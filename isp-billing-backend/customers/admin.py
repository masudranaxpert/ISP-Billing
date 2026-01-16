from django.contrib import admin
from .models import Zone, Customer


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'status', 'customer_count', 'active_customer_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'code']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at', 'customer_count', 'active_customer_count']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'code', 'description', 'status')
        }),
        ('Statistics', {
            'fields': ('customer_count', 'active_customer_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = [
        'customer_id', 'name', 'phone', 'zone', 'billing_type',
        'connection_type', 'status', 'created_at'
    ]
    list_filter = ['status', 'billing_type', 'connection_type', 'zone', 'created_at']
    search_fields = ['customer_id', 'name', 'phone', 'email', 'nid']
    ordering = ['-created_at']
    readonly_fields = ['customer_id', 'created_by', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Customer Information', {
            'fields': ('customer_id', 'name', 'email', 'phone', 'alternative_phone', 'nid')
        }),
        ('Address', {
            'fields': ('address', 'zone')
        }),
        ('billing & Connection', {
            'fields': ('billing_type', 'connection_type', 'status')
        }),
        ('Network Information', {
            'fields': ('mac_address', 'static_ip'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """
        Set created_by when creating new customer
        """
        if not change:  # Only when creating new
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
