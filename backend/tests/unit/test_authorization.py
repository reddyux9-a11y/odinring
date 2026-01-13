"""
Unit tests for Authorization Module (RBAC)

SECURITY: Tests for role-based access control and permissions
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Import authorization module (FirestoreDB is mocked in conftest.py)
from authorization import (
    AuthorizationService,
    UserRole,
    PERMISSIONS,
    authorization_service
)


@pytest.mark.asyncio
class TestAuthorizationService:
    """Test authorization service"""
    
    async def test_get_user_role_regular_user(self):
        """Test getting role for regular user"""
        with patch('authorization.authorization_service.admins_collection') as mock_admins:
            mock_admins.find_one = AsyncMock(return_value=None)
            
            role = await authorization_service.get_user_role("user_123")
            
            assert role == UserRole.USER
    
    async def test_get_user_role_admin(self):
        """Test getting role for admin"""
        with patch('authorization.authorization_service.admins_collection') as mock_admins:
            mock_admins.find_one = AsyncMock(return_value={
                "id": "admin_123",
                "role": "admin"
            })
            
            role = await authorization_service.get_user_role("admin_123")
            
            assert role == UserRole.ADMIN
    
    async def test_get_user_role_superadmin(self):
        """Test getting role for superadmin"""
        with patch('authorization.authorization_service.admins_collection') as mock_admins:
            mock_admins.find_one = AsyncMock(return_value={
                "id": "superadmin_123",
                "role": "super_admin"
            })
            
            role = await authorization_service.get_user_role("superadmin_123")
            
            assert role == UserRole.SUPERADMIN
    
    def test_has_permission_user(self):
        """Test permission check for user role"""
        assert authorization_service.has_permission(UserRole.USER, "read_own_profile")
        assert authorization_service.has_permission(UserRole.USER, "update_own_profile")
        assert not authorization_service.has_permission(UserRole.USER, "read_all_users")
        assert not authorization_service.has_permission(UserRole.USER, "delete_user_data")
    
    def test_has_permission_admin(self):
        """Test permission check for admin role"""
        assert authorization_service.has_permission(UserRole.ADMIN, "read_own_profile")
        assert authorization_service.has_permission(UserRole.ADMIN, "read_all_users")
        assert authorization_service.has_permission(UserRole.ADMIN, "view_admin_dashboard")
        assert not authorization_service.has_permission(UserRole.ADMIN, "delete_user_data")
    
    def test_has_permission_superadmin(self):
        """Test permission check for superadmin role"""
        assert authorization_service.has_permission(UserRole.SUPERADMIN, "read_own_profile")
        assert authorization_service.has_permission(UserRole.SUPERADMIN, "read_all_users")
        assert authorization_service.has_permission(UserRole.SUPERADMIN, "delete_user_data")
        assert authorization_service.has_permission(UserRole.SUPERADMIN, "view_audit_logs")
    
    async def test_check_permission_allowed(self):
        """Test permission check when allowed"""
        with patch('authorization.authorization_service.get_user_role') as mock_role:
            mock_role.return_value = UserRole.ADMIN
            
            result = await authorization_service.check_permission("admin_123", "read_all_users")
            
            assert result is True
    
    async def test_check_permission_denied(self):
        """Test permission check when denied"""
        with patch('authorization.authorization_service.get_user_role') as mock_role:
            mock_role.return_value = UserRole.USER
            
            result = await authorization_service.check_permission("user_123", "read_all_users")
            
            assert result is False
    
    async def test_require_permission_allowed(self):
        """Test require permission when allowed"""
        with patch('authorization.authorization_service.check_permission') as mock_check:
            mock_check.return_value = True
            
            # Should not raise
            await authorization_service.require_permission("admin_123", "read_all_users")
    
    async def test_require_permission_denied(self):
        """Test require permission when denied"""
        with patch('authorization.authorization_service.check_permission') as mock_check:
            mock_check.return_value = False
        
        with pytest.raises(PermissionError):
            await authorization_service.require_permission("user_123", "read_all_users")
    
    async def test_check_ownership_own_resource(self):
        """Test ownership check for own resource"""
        result = await authorization_service.check_ownership(
            "user_123",
            "user_123",
            allow_admin=False
        )
        
        assert result is True
    
    async def test_check_ownership_other_resource(self):
        """Test ownership check for other user's resource"""
        result = await authorization_service.check_ownership(
            "user_123",
            "user_456",
            allow_admin=False
        )
        
        assert result is False
    
    async def test_check_ownership_admin_bypass(self):
        """Test ownership check with admin bypass"""
        with patch('authorization.authorization_service.get_user_role') as mock_role:
            mock_role.return_value = UserRole.ADMIN
            
            result = await authorization_service.check_ownership(
                "admin_123",
                "user_456",
                allow_admin=True
            )
            
            assert result is True
    
    async def test_check_cross_tenant_isolation_own(self):
        """Test cross-tenant isolation for own data"""
        result = await authorization_service.check_cross_tenant_isolation(
            "user_123",
            "user_123"
        )
        
        assert result is True
    
    async def test_check_cross_tenant_isolation_other(self):
        """Test cross-tenant isolation for other user's data"""
        with patch('authorization.authorization_service.get_user_role') as mock_role:
            mock_role.return_value = UserRole.USER
            
            result = await authorization_service.check_cross_tenant_isolation(
                "user_123",
                "user_456"
            )
            
            assert result is False
    
    async def test_check_cross_tenant_isolation_admin(self):
        """Test cross-tenant isolation with admin access"""
        with patch('authorization.authorization_service.get_user_role') as mock_role:
            mock_role.return_value = UserRole.ADMIN
            
            result = await authorization_service.check_cross_tenant_isolation(
                "admin_123",
                "user_456"
            )
            
            assert result is True


class TestPermissions:
    """Test permission definitions"""
    
    def test_user_permissions(self):
        """Test user role permissions"""
        user_perms = PERMISSIONS[UserRole.USER]
        
        assert "read_own_profile" in user_perms
        assert "update_own_profile" in user_perms
        assert "create_own_links" in user_perms
        assert "read_all_users" not in user_perms
    
    def test_admin_permissions(self):
        """Test admin role permissions"""
        admin_perms = PERMISSIONS[UserRole.ADMIN]
        
        assert "read_own_profile" in admin_perms
        assert "read_all_users" in admin_perms
        assert "view_admin_dashboard" in admin_perms
        assert "delete_user_data" not in admin_perms
    
    def test_superadmin_permissions(self):
        """Test superadmin role permissions"""
        superadmin_perms = PERMISSIONS[UserRole.SUPERADMIN]
        
        assert "read_own_profile" in superadmin_perms
        assert "read_all_users" in superadmin_perms
        assert "delete_user_data" in superadmin_perms
        assert "view_audit_logs" in superadmin_perms
        assert "create_admin" in superadmin_perms

