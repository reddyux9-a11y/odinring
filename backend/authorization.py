"""
Role-Based Access Control (RBAC) Authorization Module

SECURITY: Formalizes authorization model with explicit roles and permission map.
Eliminates ambiguous "admin" logic and enforces ownership checks on all mutations.
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from firestore_db import FirestoreDB
from logging_config import get_logger

logger = get_logger(__name__)

# SECURITY: Explicit role definitions
class UserRole(str, Enum):
    """User roles in the system"""
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


# SECURITY: Permission map - defines what each role can do
PERMISSIONS = {
    UserRole.USER: [
        "read_own_profile",
        "update_own_profile",
        "delete_own_profile",
        "create_own_links",
        "update_own_links",
        "delete_own_links",
        "read_own_analytics",
        "manage_own_ring",
        "read_own_subscription",
    ],
    UserRole.ADMIN: [
        "read_own_profile",
        "update_own_profile",
        "delete_own_profile",
        "create_own_links",
        "update_own_links",
        "delete_own_links",
        "read_own_analytics",
        "manage_own_ring",
        "read_own_subscription",
        # Admin permissions
        "read_all_users",
        "read_all_rings",
        "read_all_analytics",
        "view_admin_dashboard",
    ],
    UserRole.SUPERADMIN: [
        "read_own_profile",
        "update_own_profile",
        "delete_own_profile",
        "create_own_links",
        "update_own_links",
        "delete_own_links",
        "read_own_analytics",
        "manage_own_ring",
        "read_own_subscription",
        # Admin permissions
        "read_all_users",
        "read_all_rings",
        "read_all_analytics",
        "view_admin_dashboard",
        # Superadmin permissions
        "create_admin",
        "update_admin",
        "delete_admin",
        "revoke_ring",
        "force_logout",
        "delete_user_data",
        "view_audit_logs",
    ]
}


class AuthorizationService:
    """
    Service for role-based access control.
    
    SECURITY: Centralizes authorization logic and enforces permissions.
    """
    
    def __init__(self):
        self.admins_collection = FirestoreDB('admins')
        self.users_collection = FirestoreDB('users')
    
    async def get_user_role(self, user_id: str) -> UserRole:
        """
        Get user's role.
        
        SECURITY: Checks both users and admins collections.
        
        Args:
            user_id: ID of user
            
        Returns:
            UserRole enum value
        """
        # SECURITY: Check if user is an admin
        admin_doc = await self.admins_collection.find_one({"id": user_id})
        
        if admin_doc:
            role_str = admin_doc.get("role", "admin")
            if role_str == "super_admin" or role_str == "superadmin":
                return UserRole.SUPERADMIN
            return UserRole.ADMIN
        
        # Default to regular user
        return UserRole.USER
    
    def has_permission(self, role: UserRole, permission: str) -> bool:
        """
        Check if role has a specific permission.
        
        SECURITY: Uses explicit permission map.
        
        Args:
            role: UserRole enum value
            permission: Permission string
            
        Returns:
            True if role has permission, False otherwise
        """
        role_permissions = PERMISSIONS.get(role, [])
        return permission in role_permissions
    
    async def check_permission(
        self,
        user_id: str,
        permission: str
    ) -> bool:
        """
        Check if user has a specific permission.
        
        SECURITY: Gets user role and checks permission.
        
        Args:
            user_id: ID of user
            permission: Permission string
            
        Returns:
            True if user has permission, False otherwise
        """
        role = await self.get_user_role(user_id)
        return self.has_permission(role, permission)
    
    async def require_permission(
        self,
        user_id: str,
        permission: str
    ) -> None:
        """
        Require that user has a specific permission.
        
        SECURITY: Raises exception if permission not granted.
        
        Args:
            user_id: ID of user
            permission: Permission string
            
        Raises:
            PermissionError: If user doesn't have permission
        """
        has_perm = await self.check_permission(user_id, permission)
        
        if not has_perm:
            role = await self.get_user_role(user_id)
            logger.warning(
                "permission_denied",
                user_id=user_id,
                role=role.value,
                permission=permission
            )
            raise PermissionError(
                f"User {user_id} with role {role.value} does not have permission: {permission}"
            )
    
    async def check_ownership(
        self,
        user_id: str,
        resource_user_id: str,
        allow_admin: bool = True
    ) -> bool:
        """
        Check if user owns a resource or is admin.
        
        SECURITY: Enforces ownership checks on all mutations.
        
        Args:
            user_id: ID of user making request
            resource_user_id: ID of resource owner
            allow_admin: Whether admins can bypass ownership check
            
        Returns:
            True if user owns resource or is admin (if allowed), False otherwise
        """
        # SECURITY: User always owns their own resources
        if user_id == resource_user_id:
            return True
        
        # SECURITY: Admins can access if allowed
        if allow_admin:
            role = await self.get_user_role(user_id)
            if role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
                return True
        
        return False
    
    async def require_ownership(
        self,
        user_id: str,
        resource_user_id: str,
        allow_admin: bool = True
    ) -> None:
        """
        Require that user owns a resource.
        
        SECURITY: Raises exception if ownership check fails.
        
        Args:
            user_id: ID of user making request
            resource_user_id: ID of resource owner
            allow_admin: Whether admins can bypass ownership check
            
        Raises:
            PermissionError: If user doesn't own resource
        """
        has_access = await self.check_ownership(
            user_id,
            resource_user_id,
            allow_admin
        )
        
        if not has_access:
            logger.warning(
                "ownership_check_failed",
                user_id=user_id,
                resource_user_id=resource_user_id
            )
            raise PermissionError(
                f"User {user_id} does not have access to resource owned by {resource_user_id}"
            )
    
    async def check_cross_tenant_isolation(
        self,
        user_id: str,
        target_user_id: str
    ) -> bool:
        """
        Check cross-tenant isolation.
        
        SECURITY: Prevents users from accessing other users' data.
        
        Args:
            user_id: ID of user making request
            target_user_id: ID of target user
            
        Returns:
            True if access allowed, False otherwise
        """
        # SECURITY: Users can only access their own data
        if user_id == target_user_id:
            return True
        
        # SECURITY: Admins can access any user's data
        role = await self.get_user_role(user_id)
        if role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            return True
        
        return False


# Global authorization service instance
authorization_service = AuthorizationService()


