import json
import pytest


def test_inspector_deployment_and_stats(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = direct_owner
    registry_addr = hex_addr(1)
    inspector = direct_deploy("contracts/gensecure_inspector.py", registry_addr)
    stats = inspector.get_stats()
    assert stats["product"] == "GenSecure Inspector"
    assert stats["total_requests"] == "0"


def test_inspector_smart_evidence_extraction_large_doc(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = hex_addr(1)
    registry_addr = hex_addr(1)
    inspector = direct_deploy("contracts/gensecure_inspector.py", registry_addr)

    # Create a 40,000-character document with promise buried at character 25,000
    padding_chunk = "Standard procedural terms and conditions filler sentence. " * 300
    large_policy = (
        "ACME OFFICIAL PRIVACY POLICY AND TERMS OF SERVICE 2026.\n"
        + padding_chunk
        + "\n\nCRITICAL WARRANTY CLAUSE: We will never sell or rent your personal data to any third party.\n\n"
        + padding_chunk
        + "\nGOVERNING LAW AND AMENDMENT PROCEDURES: Changes require 30 days notice."
    )
    assert len(large_policy) > 30000

    direct_vm.mock_web(
        r".*acme\.example\.com/privacy.*",
        {"status": 200, "body": large_policy},
    )

    llm_baseline_response = {
        "status": "BASELINE_VERIFIED",
        "source_accessible": True,
        "same_subject": True,
        "protected_promise_supported": True,
        "rule_testable": True,
        "time_scope_valid": True,
        "baseline_compliant": True,
        "breach_condition_present": False,
        "supporting_passages": ["We will never sell or rent your personal data to any third party."],
        "basis": "Verified from targeted warranty clause.",
    }
    direct_vm.mock_llm(
        r".*GENSECURE_BASELINE_INSPECTION_V2.*",
        json.dumps(llm_baseline_response),
    )

    req_id = "gsc-1:baseline:1"
    inspector.inspect_baseline(
        req_id, "gsc-1", registry_addr,
        "Acme Corp Privacy Policy", "https://acme.example.com/privacy",
        "We will never sell or rent your personal data to any third party.",
        "The company sells or exchanges personal data.",
        "Permitted changes to contact email."
    )

    res = inspector.get_result(req_id)
    assert res["status"] == "BASELINE_VERIFIED"
    assert len(res["source_fingerprint"]) == 64
    assert res["inspection_coverage"] == "TARGETED_KEYWORD_EXTRACTION"
    assert res["content_length"] > 30000
    assert len(res["supporting_passages"]) == 1
    assert inspector.get_stats()["baseline_verified"] == "1"


def test_inspector_current_material_change(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = hex_addr(1)
    registry_addr = hex_addr(1)
    inspector = direct_deploy("contracts/gensecure_inspector.py", registry_addr)

    modified_policy = (
        "ACME PRIVACY POLICY 2026. UPDATE: We may share, license, and sell user personal data "
        "to advertising partners for monetization purposes."
    )
    direct_vm.mock_web(
        r".*acme\.example\.com/privacy.*",
        {"status": 200, "body": modified_policy},
    )

    baseline_packet = {
        "status": "BASELINE_VERIFIED",
        "source_accessible": True,
        "same_subject": True,
        "protected_promise_supported": True,
        "rule_testable": True,
        "time_scope_valid": True,
        "baseline_compliant": True,
        "breach_condition_present": False,
        "basis": "Verified initially.",
    }

    llm_inspection_response = {
        "status": "MATERIAL_CHANGE",
        "source_accessible": True,
        "same_subject": True,
        "promise_still_supported": False,
        "current_compliant": False,
        "breach_condition_now_supported": True,
        "effective_now": True,
        "basis": "Policy now explicitly allows data resale.",
    }
    direct_vm.mock_llm(
        r".*GENSECURE_CURRENT_INSPECTION_V2.*",
        json.dumps(llm_inspection_response),
    )

    ch_id = "gch-1"
    inspector.inspect_current(
        ch_id, registry_addr,
        "Acme Corp Privacy Policy", "https://acme.example.com/privacy",
        "We will never sell or rent your personal data to any third party.",
        "The company sells or exchanges personal data.",
        "Permitted changes to contact email.",
        json.dumps(baseline_packet)
    )

    res = inspector.get_result(ch_id)
    assert res["status"] == "MATERIAL_CHANGE"
    assert len(res["source_fingerprint"]) == 64
    assert res["inspection_coverage"] == "COMPLETE"
    assert inspector.get_stats()["material_changes"] == "1"


def test_inspector_source_unavailable_handling(direct_vm, direct_deploy, direct_owner, hex_addr):
    direct_vm.sender = hex_addr(1)
    registry_addr = hex_addr(1)
    inspector = direct_deploy("contracts/gensecure_inspector.py", registry_addr)

    # Clear mocks to simulate web error / connection refusal
    direct_vm.clear_mocks()

    req_id = "gsc-99:baseline:1"
    inspector.inspect_baseline(
        req_id, "gsc-99", registry_addr,
        "Acme Corp", "https://unavailable.example.com/404",
        "Never sell data", "Sells data", "None"
    )

    res = inspector.get_result(req_id)
    assert res["status"] == "SOURCE_UNAVAILABLE"
    assert not res["source_accessible"]
    assert res["inspection_coverage"] == "UNAVAILABLE"
