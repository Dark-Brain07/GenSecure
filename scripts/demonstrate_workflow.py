"""Demonstrate live on-chain workflow on StudioNet."""

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import genlayer_py as gl
from genlayer_py.chains import studionet
from genlayer_py.types import TransactionStatus


def main():
    root = Path(__file__).resolve().parents[1]
    dep_file = root / "deployments" / "studionet.json"
    manifest = json.loads(dep_file.read_text(encoding="utf-8"))

    registry_addr = manifest["contracts"]["registry"]["address"]
    inspector_addr = manifest["contracts"]["inspector"]["address"]
    judge_addr = manifest["contracts"]["judge"]["address"]

    print("=" * 65)
    print("GenSecure StudioNet E2E Workflow Demonstration")
    print("=" * 65)
    print(f"Registry:  {registry_addr}")
    print(f"Inspector: {inspector_addr}")
    print(f"Judge:     {judge_addr}")

    account = gl.create_account()
    client = gl.create_client(chain=studionet, account=account)
    print(f"Operator Account: {account.address}")

    evidence = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "network": "StudioNet (Chain ID: 61999)",
        "registry": registry_addr,
        "inspector": inspector_addr,
        "judge": judge_addr,
        "steps": [],
    }

    # Step 1: Create Covenant
    print("\n[Step 1] Creating Live Covenant on StudioNet Registry...")
    now = int(time.time())
    expires_at = now + 86400  # 1 day ahead

    create_tx = client.write_contract(
        address=registry_addr,
        function_name="create_covenant",
        args=[
            "Verified Enterprise Privacy Covenant",
            "GenSecure Protocol Policy Specification",
            "https://raw.githubusercontent.com/Dark-Brain07/GenSecure/main/README.md",
            "This protocol guarantees deterministic escrow protection and zero unauthorized data licensing.",
            "The protocol permits third-party data licensing or monetization without user consent.",
            "Permitted maintenance releases and documentation formatting improvements.",
            account.address,  # beneficiary
            1000,             # 10% reward bps
            expires_at,
            "ORGANIZATION_AUTHENTICATED",
            "https://raw.githubusercontent.com/Dark-Brain07/GenSecure/main/README.md",
        ],
        value=10**15,  # 0.001 test GEN stake
    )
    create_tx_hex = str(create_tx) if str(create_tx).startswith("0x") else f"0x{create_tx.hex()}"
    print(f"Covenant Creation Tx: {create_tx_hex}")
    print("Waiting for finalization...")

    receipt = client.wait_for_transaction_receipt(
        transaction_hash=create_tx,
        status=TransactionStatus.FINALIZED,
        interval=3000,
        retries=100,
    )
    print(f"[OK] Covenant creation finalized! Status: {receipt.status if hasattr(receipt, 'status') else 'FINALIZED'}")

    evidence["steps"].append({
        "action": "CREATE_COVENANT",
        "tx_hash": create_tx_hex,
        "explorer_url": f"https://explorer-studio.genlayer.com/tx/{create_tx_hex}",
        "covenant_id": "gsc-1",
        "covenant_type": "ORGANIZATION_AUTHENTICATED",
        "stake_deposited_atto": str(10**15),
    })

    # Read live stats from contract
    print("\nReading live registry statistics...")
    try:
        stats = client.read_contract(
            address=registry_addr,
            function_name="get_stats",
            args=[],
        )
        print(f"Stats: {stats}")
        evidence["live_stats_after_creation"] = stats
    except Exception as e:
        print(f"Stats read: {e}")

    # Read covenant data
    try:
        cov_data = client.read_contract(
            address=registry_addr,
            function_name="get_covenant",
            args=["gsc-1"],
        )
        print(f"Covenant gsc-1: {cov_data}")
        evidence["covenant_record"] = cov_data
    except Exception as e:
        print(f"Covenant read: {e}")

    # Step 2: Query Credits
    try:
        credit = client.read_contract(
            address=registry_addr,
            function_name="get_credit",
            args=[account.address],
        )
        print(f"Account Claimable Credit: {credit} atto GEN")
        evidence["account_credit"] = str(credit)
    except Exception as e:
        print(f"Credit read: {e}")

    evidence_file = root / "deployments" / "workflow_evidence.json"
    evidence_file.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"\n[OK] Evidence written to: {evidence_file}")


if __name__ == "__main__":
    main()
