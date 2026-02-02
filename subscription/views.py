from rest_framework import generics, filters, status, serializers, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
import time
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db import transaction

from .models import Subscription, SubscriptionHistory, ConnectionFee
from .serializers import (
    SubscriptionSerializer, SubscriptionCreateSerializer,
    SubscriptionUpdateSerializer, SubscriptionListSerializer,
    SubscriptionHistorySerializer, ConnectionFeeSerializer
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
        # Extract fees data if present
        fees_data = request.data.get('fees', [])
        
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save()
        
        # Create connection fees
        if fees_data and isinstance(fees_data, list):
            for fee in fees_data:
                try:
                    ConnectionFee.objects.create(
                        subscription=subscription,
                        amount=fee.get('amount'),
                        fee_type=fee.get('fee_type', 'connection'),
                        date=fee.get('date') or timezone.now().date(),
                        is_paid=fee.get('is_paid', False),
                        notes=fee.get('notes', ''),
                        received_by=request.user if fee.get('is_paid', False) else None
                    )
                except Exception as e:
                    # Log error but don't fail the subscription creation
                    print(f"Error creating fee for subscription {subscription.id}: {e}")

        # Auto-sync to MikroTik if router and profile are selected
        if subscription.router and subscription.mikrotik_profile_name:
            service = MikroTikService(subscription.router)
            
            # Create PPPoE User with selected profile
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
                # This will rollback the transaction including fees
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
    ).prefetch_related('connection_fees').all()
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


# ==================== Connection Fee Views ====================

@extend_schema(tags=['Subscriptions'])
class ConnectionFeeListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list or add connection fees
    """
    queryset = ConnectionFee.objects.all()
    serializer_class = ConnectionFeeSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['subscription', 'fee_type', 'is_paid']
    ordering_fields = ['date', 'amount']
    ordering = ['-date']

    def perform_create(self, serializer):
        is_paid = serializer.validated_data.get('is_paid', False)
        serializer.save(received_by=self.request.user if is_paid else None)


@extend_schema(tags=['Subscriptions'])
class ConnectionFeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to manage individual connection fee
    """
    queryset = ConnectionFee.objects.all()
    serializer_class = ConnectionFeeSerializer
    permission_classes = [IsAdminOrManager]

    def perform_update(self, serializer):
        is_paid = serializer.validated_data.get('is_paid', False)
        # If becoming paid, set received_by
        if is_paid and not serializer.instance.is_paid:
            serializer.save(received_by=self.request.user)
        else:
            serializer.save()


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

