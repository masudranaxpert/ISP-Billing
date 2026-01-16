from rest_framework import generics, filters, status, serializers, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
import time
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db import transaction

from .models import Subscription, SubscriptionHistory
from .serializers import (
    SubscriptionSerializer, SubscriptionCreateSerializer,
    SubscriptionUpdateSerializer, SubscriptionListSerializer,
    SubscriptionHistorySerializer
)
from mikrotik.services import MikroTikService
from mikrotik.models import MikroTikSyncLog, MikroTikQueueProfile
from utils.permissions import IsAdminOrManager, IsAdmin


# ==================== Subscription Views ====================

@extend_schema(tags=['Subscriptions'])
class SubscriptionListView(generics.ListAPIView):
    """
    API endpoint to list all subscriptions
    """
    queryset = Subscription.objects.select_related(
        'customer', 'package', 'router', 'created_by'
    ).all()
    serializer_class = SubscriptionListSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'customer', 'package', 'router', 'is_synced_to_mikrotik']
    search_fields = ['customer__customer_id', 'customer__name', 'mikrotik_username']
    ordering_fields = ['start_date', 'billing_day', 'created_at']
    ordering = ['-created_at']

    def list(self, request, *args, **kwargs):
        """
        Override list to inject live MikroTik status
        """
        response = super().list(request, *args, **kwargs)
        
        # Fetch active connections from all routers
        from mikrotik.models import MikroTikRouter
        from mikrotik.services import MikroTikService
        
        active_map = {}
        try:
            routers = MikroTikRouter.objects.filter(status='active')
            for router in routers:
                try:
                    service = MikroTikService(router)
                    conns = service.get_active_connections()
                    for c in conns:
                        name = c.get('name')
                        if name:
                            active_map[name] = {
                                'online': True,
                                'ip_address': c.get('address'),
                                'mac_address': c.get('caller-id'),
                                'uptime': c.get('uptime')
                            }
                except Exception as e:
                    print(f"Error fetching from router {router.name}: {e}")
        except Exception as e:
            print(f"Error initializing router fetch: {e}")

        # Inject into results
        if isinstance(response.data, dict) and 'results' in response.data:
            for sub in response.data['results']:
                username = sub.get('mikrotik_username')
                if username and username in active_map:
                    sub['live_status'] = active_map[username]
                else:
                    sub['live_status'] = None
                    
        return response


@extend_schema(tags=['Subscriptions'])
class SubscriptionCreateView(generics.CreateAPIView):
    """
    API endpoint to create new subscription
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # Handle fees if empty/null
        data = request.data.copy()
        if not data.get('connection_fee'):
            data['connection_fee'] = 0.00
        if not data.get('reconnection_fee'):
            data['reconnection_fee'] = 0.00
            
        serializer = self.get_serializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save()
        
        # Auto-sync to MikroTik
        if subscription.router:
            service = MikroTikService(subscription.router)
            
            # 1. Ensure Package (Queue Profile) exists on Router
            # Check if synced in DB first
            queue_profile = MikroTikQueueProfile.objects.filter(
                package=subscription.package,
                router=subscription.router,
                is_synced=True
            ).first()
            
            # If not tracked as synced, or if we want to be safe, try to create/ensure it exists
            # If not tracked as synced, or if we want to be safe, try to create/ensure it exists
            if not queue_profile:
                # Try to create queue profile first
                q_success, q_result = service.create_queue_profile(subscription.package)
                
                # Log package sync
                MikroTikSyncLog.objects.create(
                    router=subscription.router,
                    action='create_queue',
                    status='success' if q_success else 'failed',
                    entity_type='queue',
                    entity_id=subscription.package.mikrotik_queue_name,
                    error_message=None if q_success else str(q_result)
                )

                if q_success:
                    # Update local tracking
                    MikroTikQueueProfile.objects.update_or_create(
                        package=subscription.package,
                        router=subscription.router,
                        defaults={
                            'mikrotik_queue_id': q_result if isinstance(q_result, str) else '',
                            'is_synced': True,
                            'last_synced_at': timezone.now(),
                            'sync_error': None
                        }
                    )
                else:
                    raise serializers.ValidationError({
                        'mikrotik_error': f"Failed to sync package to router: {q_result}. Details: Subscription creation rolled back."
                    })

            # ALWAYS Ensure PPP Profile exists (Critical for PPPoE)
            # Even if queue is synced, PPP profile might be missing if created by older version
            p_success, p_result = service.create_ppp_profile(subscription.package)
            
            if not p_success:
                 # Log failure but maybe don't block if it's just "already exists" which returns True now
                 MikroTikSyncLog.objects.create(
                    router=subscription.router,
                    action='create_ppp_profile',
                    status='failed',
                    entity_type='ppp_profile',
                    entity_id=subscription.package.mikrotik_queue_name,
                    error_message=str(p_result)
                )

            # Small delay to ensure profile is ready
            time.sleep(1)

            # 2. Create PPPoE User
            force_link = request.data.get('force_link', False)
            success, result = service.create_pppoe_user(subscription, force_link=force_link)
            
            # Log user sync
            MikroTikSyncLog.objects.create(
                router=subscription.router,
                action='create_user',
                status='success' if success else 'failed',
                entity_type='pppoe_user',
                entity_id=subscription.mikrotik_username,
                request_data={'subscription_id': subscription.id},
                response_data=result if isinstance(result, dict) else {'message': str(result)},
                error_message=None if success else str(result)
            )
            
            if success:
                subscription.is_synced_to_mikrotik = True
                subscription.last_synced_at = timezone.now()
                subscription.sync_error = None
                if isinstance(result, dict) and 'id' in result:
                    subscription.mikrotik_user_id = result['id']
                subscription.save()
            else:
                # CRITICAL: If MikroTik sync fails, rollback the subscription creation
                raise serializers.ValidationError({
                    'mikrotik_error': f"Failed to create user in MikroTik: {result}. Subscription creation rolled back."
                })
        
        # Create subscription history
        SubscriptionHistory.objects.create(
            subscription=subscription,
            action='created',
            new_value={'status': subscription.status},
            notes='Subscription created and synced',
            performed_by=request.user
        )
        
        return Response({
            'message': 'Subscription created and synced successfully',
            'subscription': SubscriptionSerializer(subscription).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Subscriptions'])
class SubscriptionDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get subscription details
    """
    queryset = Subscription.objects.select_related(
        'customer', 'package', 'router', 'created_by'
    ).all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Subscriptions'])
class SubscriptionUpdateView(generics.UpdateAPIView):
    """
    API endpoint to update subscription
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionUpdateSerializer
    permission_classes = [IsAdminOrManager]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_package = instance.package.id if instance.package else None
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save()
        
        # Create history if package changed
        if 'package' in request.data and old_package != subscription.package.id:
            SubscriptionHistory.objects.create(
                subscription=subscription,
                action='package_changed',
                old_value={'package_id': old_package},
                new_value={'package_id': subscription.package.id},
                notes='Package changed',
                performed_by=request.user
            )
        
        return Response({
            'message': 'Subscription updated successfully',
            'subscription': SubscriptionSerializer(subscription).data
        })


@extend_schema(tags=['Subscriptions'])
class SubscriptionDeleteView(generics.DestroyAPIView):
    """
    API endpoint to delete subscription (Admin only)
    """
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAdmin]


# ==================== Subscription Actions ====================

@extend_schema(tags=['Subscriptions'])
class SubscriptionSyncToMikroTikView(APIView):
    """
    API endpoint to sync subscription to MikroTik router
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, pk):
        try:
            subscription = Subscription.objects.select_related('customer', 'package', 'router').get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not subscription.router:
            return Response({'error': 'No router assigned to this subscription'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create MikroTik service
        service = MikroTikService(subscription.router)
        
        # Sync PPPoE user
        if subscription.mikrotik_user_id:
            # Update existing user
            success, result = service.update_pppoe_user(subscription, subscription.mikrotik_user_id)
            action = 'update_user'
        else:
            # Create new user
            success, result = service.create_pppoe_user(subscription)
            action = 'create_user'
        
        # Log sync operation
        MikroTikSyncLog.objects.create(
            router=subscription.router,
            action=action,
            status='success' if success else 'failed',
            entity_type='pppoe_user',
            entity_id=subscription.mikrotik_username,
            request_data={'subscription_id': subscription.id},
            response_data=result if isinstance(result, dict) else {'message': str(result)},
            error_message=None if success else str(result)
        )
        
        # Update subscription
        if success:
            subscription.is_synced_to_mikrotik = True
            subscription.last_synced_at = timezone.now()
            subscription.sync_error = None
            if isinstance(result, dict) and 'id' in result:
                subscription.mikrotik_user_id = result['id']
        else:
            subscription.is_synced_to_mikrotik = False
            subscription.sync_error = str(result)
        
        subscription.save()
        
        if success:
            return Response({
                'message': f'Subscription synced successfully to {subscription.router.name}',
                'subscription': SubscriptionSerializer(subscription).data
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': f'Failed to sync subscription: {result}'
            }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(tags=['Subscriptions'])
class SubscriptionSuspendView(APIView):
    """
    API endpoint to suspend subscription
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if subscription.status == 'suspended':
            return Response({'error': 'Subscription is already suspended'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Disable in MikroTik
        if subscription.router and subscription.is_synced_to_mikrotik:
            service = MikroTikService(subscription.router)
            success, message = service.disable_pppoe_user(subscription.mikrotik_username)
            
            # Log sync operation
            MikroTikSyncLog.objects.create(
                router=subscription.router,
                action='disable_user',
                status='success' if success else 'failed',
                entity_type='pppoe_user',
                entity_id=subscription.mikrotik_username,
                error_message=None if success else message
            )
        
        # Update subscription status
        old_status = subscription.status
        subscription.status = 'suspended'
        subscription.save()
        
        # Create history
        SubscriptionHistory.objects.create(
            subscription=subscription,
            action='suspended',
            old_value={'status': old_status},
            new_value={'status': 'suspended'},
            notes=request.data.get('reason', 'Suspended by admin'),
            performed_by=request.user
        )
        
        return Response({
            'message': 'Subscription suspended successfully',
            'subscription': SubscriptionSerializer(subscription).data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Subscriptions'])
class SubscriptionActivateView(APIView):
    """
    API endpoint to activate subscription
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, pk):
        try:
            subscription = Subscription.objects.get(pk=pk)
        except Subscription.DoesNotExist:
            return Response({'error': 'Subscription not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if subscription.status == 'active':
            return Response({'error': 'Subscription is already active'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Enable in MikroTik
        if subscription.router and subscription.is_synced_to_mikrotik:
            service = MikroTikService(subscription.router)
            success, message = service.enable_pppoe_user(subscription.mikrotik_username)
            
            # Log sync operation
            MikroTikSyncLog.objects.create(
                router=subscription.router,
                action='enable_user',
                status='success' if success else 'failed',
                entity_type='pppoe_user',
                entity_id=subscription.mikrotik_username,
                error_message=None if success else message
            )
        
        # Update subscription status
        old_status = subscription.status
        subscription.status = 'active'
        subscription.save()
        
        # Create history
        SubscriptionHistory.objects.create(
            subscription=subscription,
            action='activated',
            old_value={'status': old_status},
            new_value={'status': 'active'},
            notes='Activated by admin',
            performed_by=request.user
        )
        
        return Response({
            'message': 'Subscription activated successfully',
            'subscription': SubscriptionSerializer(subscription).data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Subscriptions'])
class SubscriptionHistoryView(generics.ListAPIView):
    """
    API endpoint to get subscription history
    """
    serializer_class = SubscriptionHistorySerializer
    permission_classes = [IsAdminOrManager]
    
    def get_queryset(self):
        subscription_id = self.kwargs.get('pk')
        return SubscriptionHistory.objects.filter(
            subscription_id=subscription_id
        ).select_related('performed_by')

