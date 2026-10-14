import os
import tempfile
import pytest
import gltest.direct.loader as loader

# Safe Windows injector patch to prevent PermissionError when unlinking open fd0
def _safe_inject(vm):
    try:
        from genlayer.py import calldata
        from genlayer.py.types import Address
    except ImportError:
        return

    sender_addr = vm.sender
    if isinstance(sender_addr, bytes):
        sender_addr = Address(sender_addr)

    contract_addr = vm._contract_address
    if isinstance(contract_addr, bytes):
        contract_addr = Address(contract_addr)

    origin_addr = vm.origin
    if isinstance(origin_addr, bytes):
        origin_addr = Address(origin_addr)

    message_data = {
        'contract_address': contract_addr,
        'sender_address': sender_addr,
        'origin_address': origin_addr,
        'stack': [],
        'value': vm._value,
        'datetime': vm._datetime,
        'is_init': False,
        'chain_id': vm._chain_id,
        'entry_kind': 0,
        'entry_data': b'',
        'entry_stage_data': None,
    }

    encoded = calldata.encode(message_data)
    fd, path = tempfile.mkstemp()
    try:
        os.write(fd, encoded)
        os.lseek(fd, 0, os.SEEK_SET)
        original_stdin = os.dup(0)
        vm._original_stdin_fd = original_stdin
        os.dup2(fd, 0)
    finally:
        os.close(fd)
        try:
            os.unlink(path)
        except OSError:
            pass

loader._inject_message_to_fd0 = _safe_inject

# Patch VMContext._refresh_gl_message so warp() properly updates gl.message_raw['datetime']
import sys
from gltest.direct.vm import VMContext

_orig_refresh = VMContext._refresh_gl_message

def _patched_refresh(self):
    _orig_refresh(self)
    if 'genlayer.gl' in sys.modules:
        gl = sys.modules['genlayer.gl']
        if hasattr(gl, 'message_raw') and gl.message_raw is not None:
            gl.message_raw['datetime'] = self._datetime

VMContext._refresh_gl_message = _patched_refresh


@pytest.fixture
def hex_addr():
    def _make(byte_val: int = 1) -> str:
        return "0x" + f"{byte_val:02x}" * 20
    return _make


@pytest.fixture
def to_hex():
    def _conv(addr) -> str:
        if isinstance(addr, bytes):
            return "0x" + addr.hex()
        return str(addr)
    return _conv


@pytest.fixture
def sample_covenant_args(hex_addr):
    return {
        "title": "Zero Data Sale Warranty",
        "subject": "Acme Corp Privacy Policy",
        "canonical_url": "https://acme.example.com/privacy",
        "protected_promise": "We will never sell or rent your personal data to any third party.",
        "breach_rule": "The company sells, licenses, or exchanges user personal data for monetary or other consideration.",
        "permitted_changes": "Changes to contact email or corporate headquarters address.",
        "beneficiary": hex_addr(9),
        "finder_reward_bps": 1000,  # 10%
    }
