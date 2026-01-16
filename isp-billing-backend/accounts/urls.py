from django.urls import path
from .views import (
    LoginView, LogoutView, TokenRefreshView,
    UserProfileView, ChangePasswordView,
    UserCreateView, UserListView, UserDetailView,
    LoginHistoryView
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User profile endpoints
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('login-history/', LoginHistoryView.as_view(), name='login_history'),
    
    # User management endpoints (Admin/Manager only)
    path('users/create/', UserCreateView.as_view(), name='user_create'),
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
