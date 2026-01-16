from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from drf_spectacular.utils import extend_schema

from .models import User, LoginHistory
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    LoginSerializer, ChangePasswordSerializer,
    LoginHistorySerializer, LogoutSerializer
)
from utils.permissions import IsAdmin, IsAdminOrManager


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


@extend_schema(tags=['Authentication'], request=LoginSerializer, responses={200: LoginSerializer})
class LoginView(APIView):
    """
    API endpoint for user login with JWT token generation
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Update last login IP
        user.last_login_ip = get_client_ip(request)
        user.save(update_fields=['last_login_ip'])
        
        # Create login history
        LoginHistory.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            is_successful=True
        )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': serializer.data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Authentication'], request=LogoutSerializer, responses={200: LogoutSerializer})
class LogoutView(APIView):
    """
    API endpoint for user logout
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid()
        try:
            refresh_token = serializer.validated_data['refresh']
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Users'])
class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to get and update current user profile
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


@extend_schema(tags=['Users'])
class ChangePasswordView(APIView):
    """
    API endpoint for changing user password
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Users'])
class UserCreateView(generics.CreateAPIView):
    """
    API endpoint to create new user (Admin/Manager only)
    """
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'User created successfully',
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Users'])
class UserListView(generics.ListAPIView):
    """
    API endpoint to list all users (Admin/Manager only)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Users'])
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to get, update, or delete a specific user (Admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer


@extend_schema(tags=['Users'])
class LoginHistoryView(generics.ListAPIView):
    """
    API endpoint to get login history for current user
    """
    serializer_class = LoginHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LoginHistory.objects.filter(user=self.request.user)


@extend_schema(tags=['Authentication'])
class TokenRefreshView(BaseTokenRefreshView):
    """
    API endpoint to refresh JWT access token using refresh token
    """
    pass
