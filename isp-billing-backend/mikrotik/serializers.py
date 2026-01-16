from rest_framework import serializers
from .models import Package, MikroTikRouter, MikroTikQueueProfile, MikroTikSyncLog


class PackageSerializer(serializers.ModelSerializer):
    """
    Serializer for Package model
    """
    speed_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'bandwidth_download', 'bandwidth_upload', 'speed_display',
            'price', 'validity_days', 'description',
            'mikrotik_queue_name', 'burst_limit_download', 'burst_limit_upload',
            'burst_threshold_download', 'burst_threshold_upload', 'burst_time',
            'priority', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PackageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating packages
    """
    class Meta:
        model = Package
        fields = [
            'name', 'bandwidth_download', 'bandwidth_upload',
            'price', 'validity_days', 'description',
            'mikrotik_queue_name', 'burst_limit_download', 'burst_limit_upload',
            'burst_threshold_download', 'burst_threshold_upload', 'burst_time',
            'priority', 'status'
        ]
    
    def validate_mikrotik_queue_name(self, value):
        """
        Validate queue name format
        """
        # Queue name should be lowercase with hyphens
        if not value.replace('-', '').replace('_', '').isalnum():
            raise serializers.ValidationError(
                "Queue name should only contain alphanumeric characters, hyphens, and underscores"
            )
        return value.lower()


class PackageListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for package list
    """
    speed_display = serializers.CharField(read_only=True)
    synced_routers = serializers.SerializerMethodField()
    
    class Meta:
        model = Package
        fields = [
            'id', 'name', 'speed_display', 'price',
            'validity_days', 'status', 'created_at',
            'synced_routers'
        ]

    def get_synced_routers(self, obj):
        # Fetch related queue profiles
        profiles = obj.queue_profiles.all().select_related('router')
        return [
            {
                'router_id': p.router.id,
                'router_name': p.router.name,
                'is_synced': p.is_synced,
                'sync_error': p.sync_error
            } for p in profiles
        ]


class MikroTikRouterSerializer(serializers.ModelSerializer):
    """
    Serializer for MikroTik Router
    """
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    
    class Meta:
        model = MikroTikRouter
        fields = [
            'id', 'name', 'ip_address', 'api_port', 'username', 'password',
            'zone', 'zone_name', 'status', 'is_online', 'last_connected_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_online', 'last_connected_at', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }


class MikroTikRouterListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for router list
    """
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    
    class Meta:
        model = MikroTikRouter
        fields = [
            'id', 'name', 'ip_address', 'zone_name',
            'status', 'is_online', 'last_connected_at'
        ]


class MikroTikQueueProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for MikroTik Queue Profile
    """
    package_name = serializers.CharField(source='package.name', read_only=True)
    router_name = serializers.CharField(source='router.name', read_only=True)
    name = serializers.CharField(source='package.mikrotik_queue_name', read_only=True)
    
    class Meta:
        model = MikroTikQueueProfile
        fields = [
            'id', 'name', 'package', 'package_name', 'router', 'router_name',
            'mikrotik_queue_id', 'is_synced', 'last_synced_at',
            'sync_error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'mikrotik_queue_id', 'is_synced', 'last_synced_at',
            'sync_error', 'created_at', 'updated_at'
        ]


class MikroTikSyncLogSerializer(serializers.ModelSerializer):
    """
    Serializer for MikroTik Sync Log
    """
    router_name = serializers.CharField(source='router.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MikroTikSyncLog
        fields = [
            'id', 'router', 'router_name', 'action', 'action_display',
            'status', 'status_display', 'entity_type', 'entity_id',
            'request_data', 'response_data', 'error_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
