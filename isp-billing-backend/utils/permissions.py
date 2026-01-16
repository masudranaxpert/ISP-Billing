from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Permission class to check if user is Admin
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class IsManager(permissions.BasePermission):
    """
    Permission class to check if user is Manager
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'manager'


class IsStaff(permissions.BasePermission):
    """
    Permission class to check if user is Staff
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'staff'


class IsAccountant(permissions.BasePermission):
    """
    Permission class to check if user is Accountant
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'accountant'


class IsAdminOrManager(permissions.BasePermission):
    """
    Permission class to check if user is Admin or Manager
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager']


class IsAdminOrManagerOrStaff(permissions.BasePermission):
    """
    Permission class to check if user is Admin, Manager or Staff
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager', 'staff']


class IsAdminOrManagerOrStaffOrAccountant(permissions.BasePermission):
    """
    Permission class to check if user is Admin, Manager, Staff or Accountant
    (Basically any authenticated user with a role)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager', 'staff', 'accountant']


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission class to check if user is owner of the object or Admin
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        # Admin can access everything
        if request.user.role == 'admin':
            return True
        # User can only access their own data
        return obj == request.user
