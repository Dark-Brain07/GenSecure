import json
import pytest


def test_judge_deployment_and_stats(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = direct_owner
    registry_addr = hex_addr(1)
    judge = direct_deploy("contracts/gensecure_judge.py", registry_addr)
    stats = judge.get_stats()
    assert stats["product"] == "GenSecure Judge"
    assert stats["total_requests"] == "0"


def test_judge_breach_verdict_and_evidence(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = hex_addr(1)
    registry_addr = hex_addr(1)
    judge = direct_deploy("contracts/gensecure_judge.py", registry_addr)

    current_policy = (
        "ACME UPDATED PRIVACY POLICY: We sell customer records to affiliated advertising networks."
    )
    direct_vm.mock_web(
        r".*acme\.example\.com/privacy.*",
        {"status": 200, "body": current_policy},
    )

    verified_inspection = {
        "request_id": "gch-1",
        "kind": "CURRENT",
        "status": "MATERIAL_CHANGE",
        "source_accessible": True,
        "same_subject": True,
        "promise_still_supported": False,
        "current_compliant": False,
        "breach_condition_now_supported": True,
        "effective_now": True,
        "baseline_context": {
            "status": "BASELINE_VERIFIED",
            "source_accessible": True,
            "same_subject": True,
            "protected_promise_supported": True,
            "rule_testable": True,
            "time_scope_valid": True,
            "baseline_compliant": True,
            "breach_condition_present": False,
            "basis": "OK",
        },
        "basis": "Data resale terms introduced.",
    }

    llm_judgment_response = {
        "outcome": "BREACH",
        "breach_supported": True,
        "permitted_by_rule": False,
        "same_subject": True,
        "effective_now": True,
        "basis": "Active selling of personal data violates immutable breach rule.",
    }
    direct_vm.mock_llm(
        r".*GENSECURE_BREACH_JUDGE_V2.*",
        json.dumps(llm_judgment_response),
    )

    ch_id = "gch-1"
    judge.judge_breach(
        ch_id, registry_addr,
        "Acme Corp Privacy Policy", "https://acme.example.com/privacy",
        "We will never sell or rent your personal data to any third party.",
        "The company sells or exchanges personal data.",
        "Permitted changes to contact email.",
        json.dumps(verified_inspection)
    )

    res = judge.get_result(ch_id)
    assert res["outcome"] == "BREACH"
    assert res["breach_supported"]
    assert not res["permitted_by_rule"]
    assert len(res["source_fingerprint"]) == 64
    assert judge.get_stats()["breach_verdicts"] == "1"


def test_judge_permitted_change_verdict(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = hex_addr(1)
    registry_addr = hex_addr(1)
    judge = direct_deploy("contracts/gensecure_judge.py", registry_addr)

    current_policy = (
        "ACME POLICY: Our contact email has changed to support@acme-newdomain.com."
    )
    direct_vm.mock_web(
        r".*acme\.example\.com/privacy.*",
        {"status": 200, "body": current_policy},
    )

    verified_inspection = {
        "request_id": "gch-2",
        "kind": "CURRENT",
        "status": "MATERIAL_CHANGE",
        "source_accessible": True,
        "same_subject": True,
        "promise_still_supported": False,
        "current_compliant": False,
        "breach_condition_now_supported": True,
        "effective_now": True,
        "baseline_context": {
            "status": "BASELINE_VERIFIED",
            "source_accessible": True,
            "same_subject": True,
            "protected_promise_supported": True,
            "rule_testable": True,
            "time_scope_valid": True,
            "baseline_compliant": True,
            "breach_condition_present": False,
            "basis": "OK",
        },
        "basis": "Contact email altered.",
    }

    llm_judgment_response = {
        "outcome": "PERMITTED_CHANGE",
        "breach_supported": False,
        "permitted_by_rule": True,
        "same_subject": True,
        "effective_now": True,
        "basis": "Change to contact email is explicitly permitted under covenant rules.",
    }
    direct_vm.mock_llm(
        r".*GENSECURE_BREACH_JUDGE_V2.*",
        json.dumps(llm_judgment_response),
    )

    ch_id = "gch-2"
    judge.judge_breach(
        ch_id, registry_addr,
        "Acme Corp Privacy Policy", "https://acme.example.com/privacy",
        "We will never sell or rent your personal data.",
        "The company sells personal data.",
        "Changes to contact email or headquarters address.",
        json.dumps(verified_inspection)
    )

    res = judge.get_result(ch_id)
    assert res["outcome"] == "PERMITTED_CHANGE"
    assert res["permitted_by_rule"]
    assert judge.get_stats()["permitted_verdicts"] == "1"
