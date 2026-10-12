"""GenSecure StudioNet Deployment Pipeline."""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

try:
    import genlayer_py as gl
    from genlayer_py.chains import studionet
    from genlayer_py.types import TransactionStatus
except ImportError:
    print("Error: genlayer-py is required. Run: pip install genlayer-py")
    sys.exit(1)


def get_contract_address(receipt) -> str:
    if hasattr(receipt, "contract_address") and receipt.contract_address:
        return str(receipt.contract_address)
    if isinstance(receipt, dict):
        if receipt.get("contract_address"):
            return str(receipt["contract_address"])
        data = receipt.get("data", {})
        if isinstance(data, dict) and data.get("contract_address"):
            return str(data["contract_address"])
        tx_data = receipt.get("txDataDecoded", {})
        if isinstance(tx_data, dict) and tx_data.get("contractAddress"):
            return str(tx_data["contractAddress"])
    if hasattr(receipt, "data") and isinstance(receipt.data, dict) and receipt.data.get("contract_address"):
        return str(receipt.data["contract_address"])
    raise ValueError(f"Could not extract contract address from receipt: {receipt}")


def deploy_contract_file(client, file_path: Path, args: list, label: str):
    print(f"\n--- Deploying {label} ---")
    code = file_path.read_text(encoding="utf-8")
    tx_hash = client.deploy_contract(code=code, args=args)
    tx_hash_hex = str(tx_hash) if str(tx_hash).startswith("0x") else f"0x{tx_hash.hex()}"
    print(f"{label} Deployment Tx Hash: {tx_hash_hex}")
    print("Awaiting StudioNet validator consensus...")

    receipt = client.wait_for_transaction_receipt(
        transaction_hash=tx_hash,
        status=TransactionStatus.FINALIZED,
        interval=4000,
        retries=150,
    )
    contract_addr = get_contract_address(receipt)
    print(f"[OK] {label} Deployed at: {contract_addr}")
    return contract_addr, tx_hash_hex


def main():
    root = Path(__file__).resolve().parents[1]
    registry_file = root / "contracts" / "gensecure_registry.py"
    inspector_file = root / "contracts" / "gensecure_inspector.py"
    judge_file = root / "contracts" / "gensecure_judge.py"

    for f in [registry_file, inspector_file, judge_file]:
        if not f.exists():
            print(f"Error: Contract file {f} does not exist.")
            sys.exit(1)

    raw_key = os.environ.get("DEPLOYER_PRIVATE_KEY", "").strip()
    if raw_key:
        account = gl.create_account(raw_key if raw_key.startswith("0x") else f"0x{raw_key}")
    else:
        account = gl.create_account()

    print("=" * 65)
    print("GenSecure StudioNet Deployment Pipeline")
    print("=" * 65)
    print(f"Target Network:   StudioNet (Chain ID: 61999)")
    print(f"Deployer Address: {account.address}")

    client = gl.create_client(chain=studionet, account=account)

    # 1. Deploy GenSecureRegistry with empty child addresses initially
    registry_addr, registry_tx = deploy_contract_file(client, registry_file, ["", ""], "GenSecureRegistry")

    # 2. Deploy GenSecureInspector pointing to GenSecureRegistry
    inspector_addr, inspector_tx = deploy_contract_file(client, inspector_file, [registry_addr], "GenSecureInspector")

    # 3. Deploy GenSecureJudge pointing to GenSecureRegistry
    judge_addr, judge_tx = deploy_contract_file(client, judge_file, [registry_addr], "GenSecureJudge")

    # 4. One-time Component Configuration Binding on Registry
    print("\n--- Binding Components on GenSecureRegistry ---")
    configure_tx = client.write_contract(
        address=registry_addr,
        function_name="configure_components",
        args=[inspector_addr, judge_addr],
    )
    configure_tx_hex = str(configure_tx) if str(configure_tx).startswith("0x") else f"0x{configure_tx.hex()}"
    print(f"Binding Tx Hash: {configure_tx_hex}")
    print("Awaiting finalization...")

    client.wait_for_transaction_receipt(
        transaction_hash=configure_tx,
        status=TransactionStatus.FINALIZED,
        interval=4000,
        retries=150,
    )
    print("[OK] Components bound securely on GenSecureRegistry!")

    manifest = {
        "product": "GenSecure",
        "network": "studionet",
        "chainId": 61999,
        "rpc": "https://studio.genlayer.com/api",
        "explorer": "https://explorer-studio.genlayer.com",
        "deployedAt": datetime.now(timezone.utc).isoformat(),
        "deployer": account.address,
        "contracts": {
            "registry": {
                "address": registry_addr,
                "txHash": registry_tx,
                "hash": registry_tx,
            },
            "inspector": {
                "address": inspector_addr,
                "txHash": inspector_tx,
                "hash": inspector_tx,
            },
            "judge": {
                "address": judge_addr,
                "txHash": judge_tx,
                "hash": judge_tx,
            },
            "configureTxHash": configure_tx_hex,
        },
    }

    dep_file = root / "deployments" / "studionet.json"
    dep_file.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    frontend_dep_file = root / "frontend" / "lib" / "deployment.json"
    frontend_dep_file.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print("\n" + "=" * 65)
    print("GenSecure Deployment Completed Successfully!")
    print("=" * 65)
    print(f"GenSecureRegistry:  {registry_addr}")
    print(f"GenSecureInspector: {inspector_addr}")
    print(f"GenSecureJudge:     {judge_addr}")
    print(f"Binding Tx Hash:    {configure_tx_hex}")
    print(f"Manifest saved to:  {dep_file}")
    print("=" * 65)


if __name__ == "__main__":
    main()
