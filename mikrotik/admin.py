from django.contrib import admin
from .models import Package, MikroTikRouter, MikroTikQueueProfile, MikroTikSyncLog


@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'bandwidth_download', 'bandwidth_upload', 'price',
        'validity_days', 'mikrotik_queue_name', 'priority', 'status', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'mikrotik_queue_name']
    ordering = ['price']
    readonly_fields = ['created_at', 'updated_at', 'speed_display']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'status')
        }),
        ('Bandwidth', {
            'fields': (
                'bandwidth_download', 'bandwidth_upload', 'speed_display'
            )
        }),
        ('Pricing', {
            'fields': ('price', 'validity_days')
        }),
        ('MikroTik Configuration', {
            'fields': ('mikrotik_queue_name', 'priority')
        }),
        ('Burst Settings (Optional)', {
            'fields': (
                'burst_limit_download', 'burst_limit_upload',
                'burst_threshold_download', 'burst_threshold_upload',
                'burst_time'
            ),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MikroTikRouter)
class MikroTikRouterAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'ip_address', 'api_port', 'zone', 'status',
        'is_online', 'last_connected_at', 'created_at'
    ]
    list_filter = ['status', 'is_online', 'zone', 'created_at']
    search_fields = ['name', 'ip_address']
    ordering = ['name']
    readonly_fields = ['is_online', 'last_connected_at', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'ip_address', 'api_port', 'zone', 'status')
        }),
        ('Credentials', {
            'fields': ('username', 'password')
        }),
        ('Connection Status', {
            'fields': ('is_online', 'last_connected_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MikroTikQueueProfile)
class MikroTikQueueProfileAdmin(admin.ModelAdmin):
    list_display = [
        'package', 'router', 'mikrotik_queue_id', 'is_synced',
        'last_synced_at', 'created_at'
    ]
    list_filter = ['is_synced', 'router', 'created_at']
    search_fields = ['package__name', 'router__name', 'mikrotik_queue_id']
    ordering = ['-created_at']
    readonly_fields = [
        'mikrotik_queue_id', 'is_synced', 'last_synced_at',
        'sync_error', 'created_at', 'updated_at'
    ]
    
    fieldsets = (
        ('Profile Information', {
            'fields': ('package', 'router')
        }),
        ('Sync Status', {
            'fields': (
                'mikrotik_queue_id', 'is_synced', 'last_synced_at', 'sync_error'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MikroTikSyncLog)
class MikroTikSyncLogAdmin(admin.ModelAdmin):
    list_display = [
        'router', 'action', 'status', 'entity_type',
        'entity_id', 'created_at'
    ]
    list_filter = ['action', 'status', 'entity_type', 'router', 'created_at']
    search_fields = ['router__name', 'entity_id', 'error_message']
    ordering = ['-created_at']
    readonly_fields = [
        'router', 'action', 'status', 'entity_type', 'entity_id',
        'request_data', 'response_data', 'error_message', 'created_at'
    ]
    
    fieldsets = (
        ('Log Information', {
            'fields': ('router', 'action', 'status', 'entity_type', 'entity_id')
        }),
        ('Details', {
            'fields': ('request_data', 'response_data', 'error_message')
        }),
        ('Timestamp', {
            'fields': ('created_at',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
