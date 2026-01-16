from rest_framework import serializers
from .models import Subscription, SubscriptionHistory
from customers.serializers import CustomerSerializer
from mikrotik.serializers import PackageSerializer


class SubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer for Subscription model (Read operations)
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_id_display = serializers.CharField(source='customer.customer_id', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_price = serializers.DecimalField(source='package.price', max_digits=10, decimal_places=2, read_only=True)
    router_name = serializers.CharField(source='router.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    next_billing_date = serializers.DateField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'customer', 'customer_name', 'customer_id_display',
            'package', 'package_name', 'package_price', 'start_date', 'billing_day', 'billing_start_month',
            'next_billing_date', 'status', 'status_display',
            'router', 'router_name', 'mikrotik_username', 'mikrotik_password',
            'mikrotik_user_id', 'is_synced_to_mikrotik', 'last_synced_at',
            'sync_error', 'connection_fee', 'reconnection_fee',
            'framed_ip_address', 'mac_address',
            'cancelled_at', 'cancellation_reason',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'mikrotik_user_id', 'is_synced_to_mikrotik',
            'last_synced_at', 'sync_error', 'cancelled_at',
            'created_by', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            # 'mikrotik_password': {'write_only': True}  <-- Allow read access as requested
        }


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating subscriptions
    """
    class Meta:
        model = Subscription
        fields = [
            'customer', 'package', 'start_date', 'billing_day', 'billing_start_month',
            'router', 'mikrotik_username', 'mikrotik_password',
            'connection_fee', 'reconnection_fee', 'status'
        ]
    
    def validate(self, attrs):
        """
        Custom validation
        """
        customer = attrs.get('customer')
        
        # Check if customer already has an active subscription
        if Subscription.objects.filter(
            customer=customer,
            status__in=['active', 'suspended']
        ).exists():
            raise serializers.ValidationError({
                'customer': 'Customer already has an active or suspended subscription.'
            })
        
        # Validate billing day
        billing_day = attrs.get('billing_day')
        if billing_day < 1 or billing_day > 31:
            raise serializers.ValidationError({
                'billing_day': 'billing day must be between 1 and 31.'
            })
        
        return attrs
    
    def create(self, validated_data):
        """
        Create subscription with created_by field
        """
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class SubscriptionUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating subscriptions
    """
    class Meta:
        model = Subscription
        fields = [
            'customer', 'package', 'billing_day', 'billing_start_month', 'router', 'status',
            'mikrotik_username', 'mikrotik_password', 'start_date',
            'connection_fee', 'reconnection_fee'
        ]


class SubscriptionListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for subscription list
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_id_display = serializers.CharField(source='customer.customer_id', read_only=True)
    package_name = serializers.CharField(source='package.name', read_only=True)
    package_price = serializers.DecimalField(source='package.price', max_digits=10, decimal_places=2, read_only=True)
    router_name = serializers.CharField(source='router.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    next_billing_date = serializers.DateField(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'customer_id_display', 'customer_name', 'package_name', 'package_price',
            'start_date', 'next_billing_date', 'status', 'status_display',
            'router_name', 'mikrotik_username', 'framed_ip_address', 'mac_address',
            'is_synced_to_mikrotik', 'sync_error', 'created_at'
        ]



class SubscriptionHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for Subscription History
    """
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = SubscriptionHistory
        fields = [
            'id', 'subscription', 'action', 'action_display',
            'old_value', 'new_value', 'notes',
            'performed_by', 'performed_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
