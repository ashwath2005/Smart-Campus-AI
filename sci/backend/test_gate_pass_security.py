import unittest
import secrets
import hmac
import hashlib
import sys
import io
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.gate_pass_service import GatePassService
from app.core.config import settings

class TestGatePassSecurity(unittest.TestCase):

    def test_valid_token_verification(self):
        """Test that properly generated HMAC tokens are correctly verified and return pass_id."""
        pass_id = 42
        nonce = secrets.token_hex(16)
        token = GatePassService.generate_signed_token(pass_id, nonce)

        # Expected format SCME-GP:{pass_id}:{nonce}:{signature}
        self.assertTrue(token.startswith("SCME-GP:42:"))
        
        verified_id = GatePassService.verify_signed_token(token)
        self.assertEqual(verified_id, pass_id)
        print("✓ Valid HMAC token successfully verified and resolved to pass_id.")

    def test_tampered_signature_rejected(self):
        """Test that modifying the signature causes immediate rejection."""
        pass_id = 101
        nonce = secrets.token_hex(16)
        token = GatePassService.generate_signed_token(pass_id, nonce)
        parts = token.split(":")
        
        # Tamper signature by changing last character
        tampered_sig = parts[3][:-1] + ("0" if parts[3][-1] != "0" else "1")
        tampered_token = f"{parts[0]}:{parts[1]}:{parts[2]}:{tampered_sig}"
        
        self.assertIsNone(GatePassService.verify_signed_token(tampered_token))
        print("✓ Tampered signature rejected.")

    def test_tampered_pass_id_rejected(self):
        """Test that altering pass_id in the payload causes signature verification failure."""
        pass_id = 55
        nonce = secrets.token_hex(16)
        token = GatePassService.generate_signed_token(pass_id, nonce)
        parts = token.split(":")
        
        # Change pass_id from 55 to 9999 while keeping original signature
        tampered_token = f"{parts[0]}:9999:{parts[2]}:{parts[3]}"
        self.assertIsNone(GatePassService.verify_signed_token(tampered_token))
        print("✓ Tampered pass_id rejected.")

    def test_tampered_nonce_rejected(self):
        """Test that modifying nonce invalidates the HMAC signature."""
        pass_id = 77
        nonce = secrets.token_hex(16)
        token = GatePassService.generate_signed_token(pass_id, nonce)
        parts = token.split(":")
        
        # Change nonce
        tampered_token = f"{parts[0]}:{parts[1]}:tamperednonce1234567890:{parts[3]}"
        self.assertIsNone(GatePassService.verify_signed_token(tampered_token))
        print("✓ Tampered nonce rejected.")

    def test_malformed_tokens_handled_safely(self):
        """Test that arbitrary garbage strings, empty tokens, and incorrect formats do not crash the service."""
        malformed_cases = [
            "",
            None,
            "SCME-GP",
            "SCME-GP:123",
            "SCME-GP:abc:xyz:sig",
            "RANDOM_STRING_WITHOUT_COLONS",
            "SCME:GP:123:nonce:sig",
            "SCME-GP:123:nonce:sig:extra_part",
            "   ",
            "SCME-GP:::signature"
        ]
        for bad_token in malformed_cases:
            self.assertIsNone(GatePassService.verify_signed_token(bad_token))
        print("✓ All 10 malformed/edge-case tokens safely rejected.")

if __name__ == "__main__":
    unittest.main()
