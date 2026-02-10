"""
Security and Penetration Tests for Bio.V Backend.
"""

import pytest
import io
import pytest_asyncio

# ============================================================================
# Injection Attacks
# ============================================================================

@pytest.mark.security
@pytest.mark.asyncio
class TestInjectionAttacks:
    """Test suite for injection vulnerabilities."""

    async def test_sql_injection_login(self, api_client):
        """Test SQL injection attempts in login fields (if applicable)."""
        # Even if we use ORM, we verify that raw inputs don't crash or leak
        payloads = [
            "' OR '1'='1",
            "admin' --",
            "UNION SELECT 1,2,3--",
            "benchmark(10000000,MD5(1))"  # Time-based blind SQLi check
        ]
        
        for payload in payloads:
            # Assuming an admin login or user search endpoint exists or similar
            # Since we don't have a direct login endpoint exposed in the brief, 
            # we test the /enroll endpoint's email field which looks up users.
            
            data = {
                "full_name": "Injection Test",
                "email": f"test{payload}@example.com",
                "role": "personnel"
            }
            
            # We don't expect it to succeed, but it certainly shouldn't return 500
            # or leak database errors.
            response = await api_client.post("/enroll", data=data)
            
            # Should handle gracefully (400, 422, or 200 if it sanitizes and accepts)
            # Definitely NOT 500 Internal Server Error
            assert response.status_code != 500, f"SQL Injection payload '{payload}' caused 500 error"
            
            # Ensure no SQL syntax errors in response text
            response_text = response.text.lower()
            assert "syntax error" not in response_text
            assert "unclosed quotation" not in response_text
            assert "postgres" not in response_text

    async def test_command_injection_filenames(self, api_client, real_audio_sample):
        """Test command injection via filenames."""
        audio, sr = real_audio_sample
        
        # Create a dummy audio file
        buffer = io.BytesIO()
        import soundfile as sf
        sf.write(buffer, audio, sr, format='WAV')
        buffer.seek(0)
        
        # Payload in filename
        malicious_filename = "song; rm -rf /; .wav"
        
        files = {
            "sample_1": (malicious_filename, buffer, "audio/wav"),
             # Need 3 samples for enroll
            "sample_2": ("safe.wav", buffer, "audio/wav"),
            "sample_3": ("safe2.wav", buffer, "audio/wav")
        }
        
        data = {
            "full_name": "Cmd Injection Test",
            "email": "cmd_injection@test.com",
            "role": "personnel"
        }
        
        response = await api_client.post("/enroll", data=data, files=files)
        
        # The system should ideally rename files or reject these characters.
        # Most importantly, it should not execute the command.
        assert response.status_code != 500
        
        # Clean up if it actually succeeded
        if response.status_code == 200:
            user_id = response.json().get("user_id")
            assert user_id is not None
            # (Cleanup logic usually handled by fixtures, but good to note)


# ============================================================================
# XSS (Cross-Site Scripting)
# ============================================================================

@pytest.mark.security
@pytest.mark.asyncio
class TestXSS:
    """Test suite for XSS vulnerabilities."""

    async def test_stored_xss_enrollment(self, api_client, real_audio_sample):
        """Test storing XSS payloads in user profile data."""
        audio, sr = real_audio_sample
        buffer = io.BytesIO()
        import soundfile as sf
        sf.write(buffer, audio, sr, format='WAV')
        buffer.seek(0)
        
        xss_payload = "<script>alert('XSS')</script>"
        
        files = {
            "sample_1": ("s1.wav", buffer, "audio/wav"),
            "sample_2": ("s2.wav", buffer, "audio/wav"),
            "sample_3": ("s3.wav", buffer, "audio/wav")
        }
        
        data = {
            "full_name": f"User {xss_payload}", # Payloads in name
            "email": f"xss_{xss_payload}@example.com", # Payload in email (might be rejected by email validator)
            "role": "personnel"
        }
        
        # Email validator might reject the email payload, but name might pass.
        # Let's try a valid email but malicious name.
        data_valid_email = {
            "full_name": f"User {xss_payload}",
            "email": "valid_xss_test@example.com",
            "role": "personnel"
        }
        
        response = await api_client.post("/enroll", data=data_valid_email, files=files)
        
        # If it created successfully, we need to check if the payload comes back unsanitized
        if response.status_code == 200:
            # Verify retrieval (if we verify using the admin endpoint)
            # For now, we assume if it accepted it, we check if it sanitized it on output 
            # OR relies on frontend to escape (React does this by default).
            # This test mainly ensures the backend doesn't crash or execute it server-side.
            pass
            
        # The system should ideally sanitize or validate inputs.
        # Assert not 500.
        assert response.status_code != 500


# ============================================================================
# Authorization Bypass
# ============================================================================

@pytest.mark.security
@pytest.mark.asyncio
class TestAuthBypass:
    """Test suite for authorization bypass attempts."""

    async def test_admin_endpoint_no_token(self, api_client):
        """Test accessing admin /users endpoint without token."""
        response = await api_client.get("/users")
        # Should be Unauthorized
        assert response.status_code in [401, 403], "Admin endpoint accessible without token!"

    async def test_admin_endpoint_invalid_token(self, api_client):
        """Test accessing admin /users endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token_string"}
        response = await api_client.get("/users", headers=headers)
        assert response.status_code in [401, 403], "Admin endpoint accessible with invalid token!"

    async def test_admin_endpoint_low_privilege(self, api_client):
        """Test accessing admin endpoint with a valid but non-admin token (if applicable)."""
        # If we had a mechanism to generate a 'personnel' token, we would test it here.
        # For now, ensuring invalid tokens fail is the baseline.
        pass

# ============================================================================
# Path Traversal
# ============================================================================

@pytest.mark.security
@pytest.mark.asyncio
class TestPathTraversal:
    """Test suite for path traversal."""

    async def test_path_traversal_filenames(self, api_client, real_audio_sample):
        """Test path traversal characters in filenames."""
        audio, sr = real_audio_sample
        buffer = io.BytesIO()
        import soundfile as sf
        sf.write(buffer, audio, sr, format='WAV')
        buffer.seek(0)
        
        files = {
            "sample_1": ("../../../../etc/passwd.wav", buffer, "audio/wav"),
            "sample_2": ("s2.wav", buffer, "audio/wav"),
            "sample_3": ("s3.wav", buffer, "audio/wav")
        }
        
        data = {
            "full_name": "Traversal Test",
            "email": "traversal@test.com",
            "role": "personnel"
        }
        
        response = await api_client.post("/enroll", data=data, files=files)
        
        # Should not crash. 
        # Ideally should either reject filename or strip paths.
        assert response.status_code != 500
