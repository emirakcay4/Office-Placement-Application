"""
Custom permission classes for the OPA API.

Access control is based on the Staff.system_role field:
  - Faculty / Staff:       read-only access to own data and directory search.
  - Department Admin:      manage assignments within their department.
  - Resource Manager:      view all capacity data, resolve conflicts.
  - System Administrator:  full CRUD access to everything.
  - IT Department:         manage IT equipment assigned to offices.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSystemAdmin(BasePermission):
    """
    Grants full access to users with system_role='system_admin'.
    Used for unrestricted CRUD on all models.
    """

    def has_permission(self, request, view):
        """Check if the requesting user is a system administrator."""
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'staff_profile')
            and request.user.staff_profile.system_role == 'system_admin'
        )


class IsResourceManager(BasePermission):
    """
    Grants access to users with system_role='resource_manager'.
    Resource managers can view all data and manage capacity/conflicts.
    """

    def has_permission(self, request, view):
        """Check if the requesting user is a resource manager."""
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'staff_profile')
            and request.user.staff_profile.system_role == 'resource_manager'
        )


class IsDepartmentAdmin(BasePermission):
    """
    Grants access to users with system_role='department_admin'.
    Department admins can manage data within their own department.
    """

    def has_permission(self, request, view):
        """Check if the requesting user is a department admin."""
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'staff_profile')
            and request.user.staff_profile.system_role == 'department_admin'
        )


class IsITDepartment(BasePermission):
    """
    Grants access to users with system_role='it_department'.
    IT staff can manage equipment assigned to offices.
    """

    def has_permission(self, request, view):
        """Check if the requesting user is from the IT department."""
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'staff_profile')
            and request.user.staff_profile.system_role == 'it_department'
        )


class ReadOnly(BasePermission):
    """
    Allows read-only access (GET, HEAD, OPTIONS) to any authenticated user.
    Used for Faculty/Staff who can only view data.
    """

    def has_permission(self, request, view):
        """Allow only safe HTTP methods for authenticated users."""
        return (
            request.method in SAFE_METHODS
            and request.user
            and request.user.is_authenticated
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Allows full access to System Admins.
    All other authenticated users get read-only access.
    Unauthenticated users are denied.

    This is a convenient combined permission for most ViewSets:
      - System admins → full CRUD
      - Everyone else → read-only
    """

    def has_permission(self, request, view):
        """Grant full access to admins, read-only to everyone else."""
        if not request.user or not request.user.is_authenticated:
            return False

        # Safe methods (GET, HEAD, OPTIONS) are open to all authenticated users
        if request.method in SAFE_METHODS:
            return True

        # Write operations require system_admin role (or Django superuser)
        if request.user.is_superuser:
            return True

        return (
            hasattr(request.user, 'staff_profile')
            and request.user.staff_profile.system_role == 'system_admin'
        )
