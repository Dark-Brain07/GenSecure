import json
import re
from datetime import datetime, timezone
import pytest

# Verify syntax and static validation of GenSecure contracts
def test_contracts_syntax():
    import py_compile
    py_compile.compile("contracts/gensecure_registry.py", doraise=True)
    py_compile.compile("contracts/gensecure_inspector.py", doraise=True)
    py_compile.compile("contracts/gensecure_judge.py", doraise=True)

def test_no_forbidden_imports():
    forbidden = ["os", "sys", "subprocess", "random", "math", "requests", "urllib"]
    for file_path in [
        "contracts/gensecure_registry.py",
        "contracts/gensecure_inspector.py",
        "contracts/gensecure_judge.py",
    ]:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            for mod in forbidden:
                pattern = rf"^\s*(import\s+{mod}|from\s+{mod}\s+import)"
                assert not re.search(pattern, content, re.MULTILINE), f"Forbidden import '{mod}' found in {file_path}"

def test_pinned_runner_dependency():
    pinned_header = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
    for file_path in [
        "contracts/gensecure_registry.py",
        "contracts/gensecure_inspector.py",
        "contracts/gensecure_judge.py",
    ]:
        with open(file_path, "r", encoding="utf-8") as f:
            first_line = f.readline().strip()
            assert first_line == pinned_header, f"First line in {file_path} must be the pinned runner dependency header"

def test_storage_pre_extraction_audit():
    # Verify leader_fn closures do not reference self
    for file_path in [
        "contracts/gensecure_inspector.py",
        "contracts/gensecure_judge.py",
    ]:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        in_closure = False
        closure_indent = 0
        for idx, line in enumerate(lines):
            stripped = line.strip()
            if "def leader_fn()" in stripped or "def validator_fn(" in stripped:
                in_closure = True
                closure_indent = len(line) - len(line.lstrip())
                continue
            if in_closure:
                curr_indent = len(line) - len(line.lstrip())
                if line.strip() and curr_indent <= closure_indent:
                    in_closure = False
                elif in_closure and "self." in stripped:
                    pytest.fail(f"Violation in {file_path} line {idx+1}: 'self' access inside closure: {stripped}")
