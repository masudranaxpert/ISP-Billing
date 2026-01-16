from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from .models import Package, MikroTikRouter, MikroTikQueueProfile, MikroTikSyncLog
from .serializers import (
    PackageSerializer, PackageCreateSerializer, PackageListSerializer,
    MikroTikRouterSerializer, MikroTikRouterListSerializer,
    MikroTikQueueProfileSerializer, MikroTikSyncLogSerializer
)
from .services import MikroTikService
from utils.permissions import IsAdminOrManager, IsAdmin


# ==================== Package Views ====================

@extend_schema(tags=['Packages'])
class PackageListView(generics.ListAPIView):
    """
    API endpoint to list all packages
    """
    queryset = Package.objects.all()
    serializer_class = PackageListSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'mikrotik_queue_name']
    ordering_fields = ['name', 'price', 'bandwidth_download', 'created_at']
    ordering = ['price']


@extend_schema(tags=['Packages'])
class PackageCreateView(generics.CreateAPIView):
    """
    API endpoint to create new package
    """
    queryset = Package.objects.all()
    serializer_class = PackageCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Package created successfully',
            'package': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Packages'])
class PackageDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get package details
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Packages'])
class PackageUpdateView(generics.UpdateAPIView):
    """
    API endpoint to update package
    """
    queryset = Package.objects.all()
    serializer_class = PackageCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Package updated successfully',
            'package': serializer.data
        })


@extend_schema(tags=['Packages'])
class PackageDeleteView(generics.DestroyAPIView):
    """
    API endpoint to delete package (Admin only)
    """
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAdmin]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        package_name = instance.name
        self.perform_destroy(instance)
        
        return Response({
            'message': f'Package {package_name} deleted successfully'
        }, status=status.HTTP_200_OK)


# ==================== MikroTik Router Views ====================

@extend_schema(tags=['MikroTik'])
class MikroTikRouterListView(generics.ListAPIView):
    """
    API endpoint to list all MikroTik routers
    """
    queryset = MikroTikRouter.objects.select_related('zone').all()
    serializer_class = MikroTikRouterListSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'zone', 'is_online']
    search_fields = ['name', 'ip_address']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


@extend_schema(tags=['MikroTik'])
class MikroTikRouterCreateView(generics.CreateAPIView):
    """
    API endpoint to create new MikroTik router
    """
    queryset = MikroTikRouter.objects.all()
    serializer_class = MikroTikRouterSerializer
    permission_classes = [IsAdmin]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'MikroTik router created successfully',
            'router': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['MikroTik'])
class MikroTikRouterDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to get, update, or delete MikroTik router
    """
    queryset = MikroTikRouter.objects.all()
    serializer_class = MikroTikRouterSerializer
    permission_classes = [IsAdmin]


@extend_schema(tags=['MikroTik'])
class MikroTikRouterTestConnectionView(APIView):
    """
    API endpoint to test MikroTik router connection
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, pk):
        try:
            router = MikroTikRouter.objects.get(pk=pk)
        except MikroTikRouter.DoesNotExist:
            return Response({
                'error': 'Router not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Test connection
        service = MikroTikService(router)
        success, message = service.test_connection()
        
        if success:
            return Response({
                'message': message,
                'status': 'online'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': message,
                'status': 'offline'
            }, status=status.HTTP_400_BAD_REQUEST)


# ==================== Queue Profile Sync Views ====================

@extend_schema(tags=['MikroTik'])
class SyncPackageToRouterView(APIView):
    """
    API endpoint to sync package to MikroTik router
    """
    permission_classes = [IsAdmin]
    
    def post(self, request, package_id, router_id):
        try:
            package = Package.objects.get(pk=package_id)
            router = MikroTikRouter.objects.get(pk=router_id)
        except Package.DoesNotExist:
            return Response({'error': 'Package not found'}, status=status.HTTP_404_NOT_FOUND)
        except MikroTikRouter.DoesNotExist:
            return Response({'error': 'Router not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create MikroTik service
        service = MikroTikService(router)
        
        # Check if queue profile already exists
        queue_profile, created = MikroTikQueueProfile.objects.get_or_create(
            package=package,
            router=router
        )
        
        # Sync to router
        if queue_profile.mikrotik_queue_id:
            # Update existing profile
            success, result = service.update_ppp_profile(package, queue_profile.mikrotik_queue_id)
            action = 'update_profile'
        else:
            # Create new profile
            success, result = service.create_ppp_profile(package)
            action = 'create_profile'
        
        # Log sync operation
        MikroTikSyncLog.objects.create(
            router=router,
            action=action,
            status='success' if success else 'failed',
            entity_type='profile',
            entity_id=package.mikrotik_queue_name,
            request_data={'package_id': package.id},
            response_data=result if isinstance(result, dict) else {'message': str(result)},
            error_message=None if success else str(result)
        )
        
        # Update queue profile (keeping the model name same for now, but storing profile ID)
        if success:
            queue_profile.is_synced = True
            queue_profile.last_synced_at = timezone.now()
            queue_profile.sync_error = None
            if isinstance(result, dict) and 'id' in result:
                queue_profile.mikrotik_queue_id = result['id']
        else:
            queue_profile.is_synced = False
            queue_profile.sync_error = str(result)
        
        queue_profile.save()
        
        if success:
            return Response({
                'message': f'Package synced successfully to {router.name}',
                'queue_profile': MikroTikQueueProfileSerializer(queue_profile).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': f'Failed to sync package: {result}'
            }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['MikroTik'])
class MikroTikQueueProfileListView(generics.ListAPIView):
    """
    API endpoint to list all queue profiles
    """
    queryset = MikroTikQueueProfile.objects.select_related('package', 'router').all()
    serializer_class = MikroTikQueueProfileSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['package', 'router', 'is_synced']


@extend_schema(tags=['MikroTik'])
class MikroTikSyncLogListView(generics.ListAPIView):
    """
    API endpoint to list sync logs
    """
    queryset = MikroTikSyncLog.objects.select_related('router').all()
    serializer_class = MikroTikSyncLogSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['router', 'action', 'status']
    ordering = ['-created_at']
