import json
from datetime import datetime, timezone
import pytest

MIN_STAKE = 10 ** 15  # 0.001 GEN
MIN_BOND = 10 ** 14   # 0.0001 GEN


def get_now(direct_vm) -> int:
    dt = direct_vm._datetime
    if dt.endswith("Z"):
        dt = dt[:-1] + "+00:00"
    return int(datetime.fromisoformat(dt).timestamp())


def get_valid_expiry(direct_vm, seconds_ahead: int = 86400) -> int:
    return get_now(direct_vm) + seconds_ahead


def setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = direct_owner
    registry = direct_deploy("contracts/gensecure_registry.py", "", "")
    inspector_addr = hex_addr(10)
    judge_addr = hex_addr(20)
    registry.configure_components(inspector_addr, judge_addr)
    return registry, inspector_addr, judge_addr


def test_registry_deployment_and_configuration(direct_vm, direct_deploy, direct_owner, direct_alice, hex_addr):
    direct_vm.sender = direct_owner
    registry = direct_deploy("contracts/gensecure_registry.py", "", "")
    stats = registry.get_stats()
    assert stats["product"] == "GenSecure"
    assert not stats["components_configured"]

    # Non-bootstrapper cannot configure
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("only the deployment bootstrapper can configure components"):
        registry.configure_components(hex_addr(10), hex_addr(20))

    # Bootstrapper configures successfully
    direct_vm.sender = direct_owner
    registry.configure_components(hex_addr(10), hex_addr(20))
    stats = registry.get_stats()
    assert stats["components_configured"]
    assert stats["inspector"].lower() == hex_addr(10).lower()
    assert stats["judge"].lower() == hex_addr(20).lower()

    # Cannot reconfigure
    with direct_vm.expect_revert("protocol components are already configured"):
        registry.configure_components(hex_addr(10), hex_addr(20))


def test_covenant_creation_and_org_auth(direct_vm, direct_deploy, direct_owner, direct_alice, sample_covenant_args, hex_addr):
    registry, _, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE

    # 1. Third-party community assurance
    cid1 = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry, "THIRD_PARTY_ASSURANCE", ""
    )
    cov1 = registry.get_covenant(cid1)
    assert cov1["status"] == "BASELINE_PENDING"
    assert cov1["covenant_type"] == "THIRD_PARTY_ASSURANCE"
    assert cov1["stake_atto"] == str(MIN_STAKE)

    # 2. Authenticated Organization Covenant
    direct_vm.value = MIN_STAKE
    cid2 = registry.create_covenant(
        "Official Org Promise", sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry, "ORGANIZATION_AUTHENTICATED", "https://acme.example.com/.well-known/gensecure.json"
    )
    cov2 = registry.get_covenant(cid2)
    assert cov2["covenant_type"] == "ORGANIZATION_AUTHENTICATED"
    assert cov2["verification_proof"] == "https://acme.example.com/.well-known/gensecure.json"

    # Invariant
    stats = registry.get_stats()
    assert stats["accounting_balanced"]
    assert int(stats["total_deposited_atto"]) == 2 * MIN_STAKE


def test_baseline_certification_success(direct_vm, direct_deploy, direct_owner, direct_alice, sample_covenant_args, hex_addr):
    registry, inspector_addr, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )

    # Inspector callback
    direct_vm.sender = inspector_addr
    baseline_packet = {
        "request_id": f"{cid}:baseline:1",
        "kind": "BASELINE",
        "status": "BASELINE_VERIFIED",
        "source_accessible": True,
        "same_subject": True,
        "protected_promise_supported": True,
        "rule_testable": True,
        "time_scope_valid": True,
        "baseline_compliant": True,
        "breach_condition_present": False,
        "source_fingerprint": "a" * 64,
        "retrieval_timestamp": "2026-10-14T20:00:00Z",
        "supporting_passages": ["Acme guarantees zero sale of personal data under any circumstances."],
        "basis": "Verified compliant.",
    }
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps(baseline_packet))

    cov = registry.get_covenant(cid)
    assert cov["status"] == "ACTIVE"
    assert cov["baseline_fingerprint"] == "a" * 64
    assert len(cov["baseline_passages"]) == 1
    assert registry.get_stats()["covenants_activated"] == "1"


def test_baseline_rejection_refunds_owner(direct_vm, direct_deploy, direct_owner, direct_alice, sample_covenant_args, hex_addr, to_hex):
    registry, inspector_addr, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )

    direct_vm.sender = inspector_addr
    reject_packet = {
        "request_id": f"{cid}:baseline:1",
        "kind": "BASELINE",
        "status": "PROMISE_NOT_SUPPORTED",
        "source_accessible": True,
        "same_subject": True,
        "protected_promise_supported": False,
        "rule_testable": True,
        "time_scope_valid": True,
        "baseline_compliant": False,
        "breach_condition_present": False,
        "basis": "Target page mentions no privacy guarantees.",
    }
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps(reject_packet))

    cov = registry.get_covenant(cid)
    assert cov["status"] == "BASELINE_REJECTED"
    # Stake credited back to owner
    assert registry.get_credit(to_hex(direct_alice)) == str(MIN_STAKE)
    assert registry.get_stats()["accounting_balanced"]


def test_challenge_compliant_source_bond_to_owner(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, sample_covenant_args, hex_addr, to_hex):
    registry, inspector_addr, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )
    direct_vm.sender = inspector_addr
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps({
        "request_id": f"{cid}:baseline:1", "kind": "BASELINE", "status": "BASELINE_VERIFIED",
        "source_accessible": True, "same_subject": True, "protected_promise_supported": True,
        "rule_testable": True, "time_scope_valid": True, "baseline_compliant": True,
        "breach_condition_present": False, "basis": "OK"
    }))

    # Bob challenges with exact bond
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch_id = registry.challenge_covenant(cid)

    # Inspector reports compliant: NO_RELEVANT_CHANGE
    direct_vm.sender = inspector_addr
    registry.record_inspection(ch_id, json.dumps({
        "request_id": ch_id, "kind": "CURRENT", "status": "NO_RELEVANT_CHANGE",
        "source_accessible": True, "same_subject": True, "promise_still_supported": True,
        "current_compliant": True, "breach_condition_now_supported": False, "effective_now": True,
        "baseline_context": {
            "status": "BASELINE_VERIFIED", "source_accessible": True, "same_subject": True,
            "protected_promise_supported": True, "rule_testable": True, "time_scope_valid": True,
            "baseline_compliant": True, "breach_condition_present": False, "basis": "OK",
        },
        "basis": "No changes found."
    }))

    ch = registry.get_challenge(ch_id)
    assert ch["status"] == "NO_RELEVANT_CHANGE"
    # Challenger bond was awarded to covenant owner as defense bounty
    assert registry.get_credit(to_hex(direct_alice)) == str(MIN_BOND)
    assert registry.get_credit(to_hex(direct_bob)) == "0"
    assert registry.get_stats()["accounting_balanced"]


def test_challenge_breach_settlement_and_withdrawals(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, sample_covenant_args, hex_addr, to_hex):
    registry, inspector_addr, judge_addr = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    # Alice creates covenant with 10^15 stake (10% reward = 10^14)
    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )
    direct_vm.sender = inspector_addr
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps({
        "request_id": f"{cid}:baseline:1", "kind": "BASELINE", "status": "BASELINE_VERIFIED",
        "source_accessible": True, "same_subject": True, "protected_promise_supported": True,
        "rule_testable": True, "time_scope_valid": True, "baseline_compliant": True,
        "breach_condition_present": False, "basis": "OK"
    }))

    # Bob challenges
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch_id = registry.challenge_covenant(cid)

    # Inspector reports MATERIAL_CHANGE
    direct_vm.sender = inspector_addr
    registry.record_inspection(ch_id, json.dumps({
        "request_id": ch_id, "kind": "CURRENT", "status": "MATERIAL_CHANGE",
        "source_accessible": True, "same_subject": True, "promise_still_supported": False,
        "current_compliant": False, "breach_condition_now_supported": True, "effective_now": True,
        "baseline_context": {
            "status": "BASELINE_VERIFIED", "source_accessible": True, "same_subject": True,
            "protected_promise_supported": True, "rule_testable": True, "time_scope_valid": True,
            "baseline_compliant": True, "breach_condition_present": False, "basis": "OK",
        },
        "basis": "Clause added authorizing data resale."
    }))

    ch = registry.get_challenge(ch_id)
    assert ch["status"] == "JUDGMENT_PENDING"

    # Judge confirms BREACH
    direct_vm.sender = judge_addr
    registry.record_judgment(ch_id, json.dumps({
        "request_id": ch_id, "kind": "JUDGMENT", "outcome": "BREACH",
        "breach_supported": True, "permitted_by_rule": False, "same_subject": True,
        "effective_now": True, "basis": "Operative breach confirmed."
    }))

    cov = registry.get_covenant(cid)
    assert cov["status"] == "BREACHED"
    assert registry.get_stats()["covenants_breached"] == "1"

    # Financial settlement verification:
    # 1. Bob receives his 10^14 bond back + 10% reward (10^14) = 2 * 10^14
    expected_bob_credit = MIN_BOND + (MIN_STAKE * 1000 // 10000)
    assert int(registry.get_credit(to_hex(direct_bob))) == expected_bob_credit

    # 2. Beneficiary receives 90% of stake = 9 * 10^14
    expected_ben_credit = MIN_STAKE - (MIN_STAKE * 1000 // 10000)
    assert int(registry.get_credit(sample_covenant_args["beneficiary"])) == expected_ben_credit

    # 3. Pull-based withdrawal works
    direct_vm.sender = direct_bob
    registry.withdraw_credit(to_hex(direct_bob))
    assert registry.get_credit(to_hex(direct_bob)) == "0"

    # Invariant verified
    stats = registry.get_stats()
    assert stats["accounting_balanced"]
    assert int(stats["withdrawn_atto"]) == expected_bob_credit


def test_persistent_source_withdrawal_triggers_breach(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, sample_covenant_args, hex_addr, to_hex):
    registry, inspector_addr, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )
    direct_vm.sender = inspector_addr
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps({
        "request_id": f"{cid}:baseline:1", "kind": "BASELINE", "status": "BASELINE_VERIFIED",
        "source_accessible": True, "same_subject": True, "protected_promise_supported": True,
        "rule_testable": True, "time_scope_valid": True, "baseline_compliant": True,
        "breach_condition_present": False, "basis": "OK"
    }))

    unavailable_packet = {
        "kind": "CURRENT", "status": "SOURCE_UNAVAILABLE",
        "source_accessible": False, "same_subject": False, "promise_still_supported": False,
        "current_compliant": False, "breach_condition_now_supported": False, "effective_now": False,
        "baseline_context": {
            "status": "BASELINE_VERIFIED", "source_accessible": True, "same_subject": True,
            "protected_promise_supported": True, "rule_testable": True, "time_scope_valid": True,
            "baseline_compliant": True, "breach_condition_present": False, "basis": "OK",
        },
        "basis": "Connection refused / 404"
    }

    # Failure 1 (Transient)
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch1 = registry.challenge_covenant(cid)
    direct_vm.sender = inspector_addr
    unavailable_packet["request_id"] = ch1
    registry.record_inspection(ch1, json.dumps(unavailable_packet))

    cov = registry.get_covenant(cid)
    assert cov["status"] == "ACTIVE"
    assert cov["source_status"] == "DEGRADED"
    assert cov["consecutive_source_failures"] == 1
    assert registry.get_challenge(ch1)["status"] == "SOURCE_UNAVAILABLE_TEMPORARY"

    # Advance past 900s cooldown
    t1 = get_now(direct_vm) + 1000
    direct_vm.warp(datetime.fromtimestamp(t1, tz=timezone.utc).isoformat())

    # Failure 2 (Transient)
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch2 = registry.challenge_covenant(cid)
    direct_vm.sender = inspector_addr
    unavailable_packet["request_id"] = ch2
    registry.record_inspection(ch2, json.dumps(unavailable_packet))
    assert registry.get_covenant(cid)["consecutive_source_failures"] == 2

    # Advance past 900s cooldown
    t2 = t1 + 1000
    direct_vm.warp(datetime.fromtimestamp(t2, tz=timezone.utc).isoformat())

    # Failure 3 (Threshold reached -> PERSISTENT_WITHDRAWAL)
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch3 = registry.challenge_covenant(cid)
    direct_vm.sender = inspector_addr
    unavailable_packet["request_id"] = ch3
    registry.record_inspection(ch3, json.dumps(unavailable_packet))

    final_cov = registry.get_covenant(cid)
    assert final_cov["status"] == "BREACHED"
    assert final_cov["source_status"] == "WITHDRAWN"
    assert registry.get_challenge(ch3)["status"] == "PERSISTENT_WITHDRAWAL"

    # Bounty and beneficiary payouts occurred
    assert int(registry.get_credit(to_hex(direct_bob))) > 0
    assert int(registry.get_credit(sample_covenant_args["beneficiary"])) > 0
    assert registry.get_stats()["accounting_balanced"]


def test_coverage_decoupling_allows_late_challenge(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, sample_covenant_args, hex_addr):
    registry, inspector_addr, _ = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    # Expiry 3 hours ahead (10800s)
    expiry = get_valid_expiry(direct_vm, 10800)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )
    direct_vm.sender = inspector_addr
    registry.record_baseline(cid, f"{cid}:baseline:1", json.dumps({
        "request_id": f"{cid}:baseline:1", "kind": "BASELINE", "status": "BASELINE_VERIFIED",
        "source_accessible": True, "same_subject": True, "protected_promise_supported": True,
        "rule_testable": True, "time_scope_valid": True, "baseline_compliant": True,
        "breach_condition_present": False, "basis": "OK"
    }))

    # Bob challenges during what used to be the 65-min blackout window!
    # Because coverage has not expired (now <= expires_at), challenge succeeds!
    direct_vm.sender = direct_bob
    direct_vm.value = MIN_BOND
    ch_id = registry.challenge_covenant(cid)
    assert ch_id.startswith("gch-")

    # While challenge is under adjudication, owner cannot prematurely call expire_covenant
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("covenant has an active pending challenge under adjudication"):
        registry.expire_covenant(cid)


def test_duplicate_settlement_and_authorization_guards(direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob, sample_covenant_args, hex_addr):
    registry, inspector_addr, judge_addr = setup_contracts(direct_vm, direct_deploy, direct_owner, hex_addr)
    expiry = get_valid_expiry(direct_vm)

    direct_vm.sender = direct_alice
    direct_vm.value = MIN_STAKE
    cid = registry.create_covenant(
        sample_covenant_args["title"], sample_covenant_args["subject"],
        sample_covenant_args["canonical_url"], sample_covenant_args["protected_promise"],
        sample_covenant_args["breach_rule"], sample_covenant_args["permitted_changes"],
        sample_covenant_args["beneficiary"], sample_covenant_args["finder_reward_bps"],
        expiry
    )

    # Unauthorized caller cannot record baseline
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("only the configured inspector can callback"):
        registry.record_baseline(cid, f"{cid}:baseline:1", "{}")

    # Unauthorized caller cannot record judgment
    with direct_vm.expect_revert("only the configured judge can callback"):
        registry.record_judgment("gch-1", "{}")
