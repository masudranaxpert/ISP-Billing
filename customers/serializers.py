from rest_framework import serializers
from .models import Zone, Customer, ConnectionType


class ConnectionTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for ConnectionType model
    """
    customer_count = serializers.IntegerField(read_only=True)
    active_customer_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ConnectionType
        fields = [
            'id', 'name', 'code', 'description', 'status', 
            'customer_count', 'active_customer_count', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ZoneSerializer(serializers.ModelSerializer):
    """
    Serializer for Zone model
    """
    customer_count = serializers.IntegerField(read_only=True)
    active_customer_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Zone
        fields = [
            'id', 'name', 'code', 'description', 'status',
            'customer_count', 'active_customer_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model (Read operations)
    """
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    billing_type_display = serializers.CharField(source='get_billing_type_display', read_only=True)
    connection_type_display = serializers.CharField(source='connection_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    full_address = serializers.CharField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_id', 'name', 'email', 'phone', 'alternative_phone',
            'nid', 'address', 'full_address', 'zone', 'zone_name',
            'billing_type', 'billing_type_display',
            'connection_type', 'connection_type_display',
            'mac_address', 'static_ip',
            'status', 'status_display',
            'is_active', 'is_suspended',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'customer_id', 'created_by', 'created_at', 'updated_at',
            'is_active', 'is_suspended'
        ]


class CustomerCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new customers
    """
    class Meta:
        model = Customer
        fields = [
            'name', 'email', 'phone', 'alternative_phone', 'nid', 'address',
            'zone', 'billing_type', 'connection_type',
            'mac_address', 'static_ip', 'status'
        ]
    
    def validate_phone(self, value):
        """
        Validate phone number uniqueness
        """
        if Customer.objects.filter(phone=value).exists():
            raise serializers.ValidationError("A customer with this phone number already exists.")
        return value
    
    def validate(self, attrs):
        """
        Custom validation
        """
        # If connection type is static_ip, static_ip field is required
        connection_type = attrs.get('connection_type')
        if connection_type and 'static' in connection_type.name.lower() and not attrs.get('static_ip'):
            raise serializers.ValidationError({
                'static_ip': 'Static IP is required for Static IP connection type.'
            })
        
        # If billing type is business, email is recommended
        if attrs.get('billing_type') == 'business' and not attrs.get('email'):
            # Just a warning, not blocking
            pass
        
        return attrs
    
    def create(self, validated_data):
        """
        Create customer with created_by field
        """
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class CustomerUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating customer information
    """
    class Meta:
        model = Customer
        fields = [
            'name', 'email', 'phone', 'alternative_phone', 'nid', 'address',
            'zone', 'billing_type', 'connection_type',
            'mac_address', 'static_ip', 'status'
        ]
    
    def validate_phone(self, value):
        """
        Validate phone number uniqueness (excluding current customer)
        """
        customer = self.instance
        if Customer.objects.exclude(pk=customer.pk).filter(phone=value).exists():
            raise serializers.ValidationError("A customer with this phone number already exists.")
        return value


class CustomerListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for customer list (for performance)
    """
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_id', 'name', 'phone', 'zone_name',
            'billing_type', 'connection_type', 'status', 'status_display',
            'created_at'
        ]
