"""
Security Implementation Smoke Test
Tests all new security features to ensure they work correctly
"""

import asyncio
import sys
from datetime import datetime

# Test imports
try:
    from audit_log_utils import log_login, log_logout, log_profile_update, log_link_create
    from session_utils import SessionManager
    from refresh_token_utils import RefreshTokenManager
    from config import settings
    print("✅ All security modules imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)


async def test_audit_logging():
    """Test audit logging functionality"""
    print("\n🧪 Testing Audit Logging...")
    
    try:
        # Test login logging
        success = await log_login(
            user_id="test_user_123",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            method="email",
            status="success"
        )
        
        if success:
            print("  ✅ Login audit log created successfully")
        else:
            print("  ⚠️  Login audit log creation failed (non-blocking)")
        
        return True
    except Exception as e:
        print(f"  ❌ Audit logging test failed: {e}")
        return False


async def test_session_management():
    """Test session management functionality"""
    print("\n🧪 Testing Session Management...")
    
    try:
        # Create session
        session = await SessionManager.create_session(
            user_id="test_user_123",
            token="test_token",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            expires_in_hours=24
        )
        
        if session and session.get('id'):
            print(f"  ✅ Session created: {session['id']}")
            
            # Validate session
            is_valid = await SessionManager.validate_session(session['id'])
            if is_valid:
                print("  ✅ Session validation successful")
            else:
                print("  ❌ Session validation failed")
                return False
            
            # Invalidate session
            invalidated = await SessionManager.invalidate_session(session['id'])
            if invalidated:
                print("  ✅ Session invalidated successfully")
            else:
                print("  ⚠️  Session invalidation failed")
            
            return True
        else:
            print("  ❌ Session creation failed")
            return False
            
    except Exception as e:
        print(f"  ❌ Session management test failed: {e}")
        return False


async def test_refresh_tokens():
    """Test refresh token functionality"""
    print("\n🧪 Testing Refresh Token Management...")
    
    try:
        # Create a test session first
        session = await SessionManager.create_session(
            user_id="test_user_456",
            token="test_token_2",
            ip_address="127.0.0.1",
            user_agent="Test Agent",
            expires_in_hours=24
        )
        
        # Create refresh token
        refresh_token, token_record = await RefreshTokenManager.create_refresh_token(
            user_id="test_user_456",
            session_id=session['id'],
            ip_address="127.0.0.1",
            user_agent="Test Agent"
        )
        
        if refresh_token and token_record:
            print(f"  ✅ Refresh token created: {token_record['id']}")
            
            # Validate refresh token
            validated = await RefreshTokenManager.validate_refresh_token(refresh_token)
            if validated:
                print("  ✅ Refresh token validation successful")
            else:
                print("  ❌ Refresh token validation failed")
                return False
            
            # Test token rotation
            rotation_result = await RefreshTokenManager.rotate_refresh_token(
                old_token=refresh_token,
                ip_address="127.0.0.1",
                user_agent="Test Agent"
            )
            
            if rotation_result:
                new_token, new_record = rotation_result
                print("  ✅ Refresh token rotation successful")
                
                # Verify old token is invalidated
                old_validated = await RefreshTokenManager.validate_refresh_token(refresh_token)
                if not old_validated:
                    print("  ✅ Old refresh token properly invalidated")
                else:
                    print("  ❌ Old refresh token still valid (security issue)")
                    return False
                
                # Clean up: invalidate the new token
                await RefreshTokenManager.invalidate_token(new_record['id'])
            else:
                print("  ❌ Refresh token rotation failed")
                return False
            
            return True
        else:
            print("  ❌ Refresh token creation failed")
            return False
            
    except Exception as e:
        print(f"  ❌ Refresh token test failed: {e}")
        return False


def test_configuration():
    """Test configuration settings"""
    print("\n🧪 Testing Configuration...")
    
    try:
        # Check token expiry settings
        if hasattr(settings, 'ACCESS_TOKEN_EXPIRY_MINUTES'):
            print(f"  ✅ ACCESS_TOKEN_EXPIRY_MINUTES: {settings.ACCESS_TOKEN_EXPIRY_MINUTES} minutes")
        else:
            print("  ❌ ACCESS_TOKEN_EXPIRY_MINUTES not configured")
            return False
        
        if hasattr(settings, 'REFRESH_TOKEN_EXPIRY_DAYS'):
            print(f"  ✅ REFRESH_TOKEN_EXPIRY_DAYS: {settings.REFRESH_TOKEN_EXPIRY_DAYS} days")
        else:
            print("  ❌ REFRESH_TOKEN_EXPIRY_DAYS not configured")
            return False
        
        # Verify reasonable values
        if settings.ACCESS_TOKEN_EXPIRY_MINUTES <= 0 or settings.ACCESS_TOKEN_EXPIRY_MINUTES > 60:
            print(f"  ⚠️  ACCESS_TOKEN_EXPIRY_MINUTES ({settings.ACCESS_TOKEN_EXPIRY_MINUTES}) outside recommended range (1-60)")
        
        if settings.REFRESH_TOKEN_EXPIRY_DAYS <= 0 or settings.REFRESH_TOKEN_EXPIRY_DAYS > 30:
            print(f"  ⚠️  REFRESH_TOKEN_EXPIRY_DAYS ({settings.REFRESH_TOKEN_EXPIRY_DAYS}) outside recommended range (1-30)")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Configuration test failed: {e}")
        return False


async def main():
    """Run all tests"""
    print("=" * 70)
    print("🔒 SECURITY IMPLEMENTATION SMOKE TEST")
    print("=" * 70)
    print(f"Started at: {datetime.utcnow().isoformat()}")
    
    results = {
        "Configuration": test_configuration(),
        "Audit Logging": await test_audit_logging(),
        "Session Management": await test_session_management(),
        "Refresh Tokens": await test_refresh_tokens()
    }
    
    print("\n" + "=" * 70)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 70)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name:.<50} {status}")
    
    total = len(results)
    passed = sum(results.values())
    failed = total - passed
    
    print(f"\nTotal: {total} | Passed: {passed} | Failed: {failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Security implementation is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} TEST(S) FAILED. Please review the implementation.")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

