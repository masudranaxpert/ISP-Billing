from django.contrib import admin
from .models import Subscription, SubscriptionHistory, ConnectionFee


class ConnectionFeeInline(admin.TabularInline):
    model = ConnectionFee
    extra = 0
    readonly_fields = ['received_by', 'created_at']
    fields = ['fee_type', 'amount', 'date', 'is_paid', 'notes', 'received_by', 'created_at']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.received_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'package', 'start_date', 'billing_day',
        'status', 'router', 'is_synced_to_mikrotik', 'created_at'
    ]
    list_filter = ['status', 'is_synced_to_mikrotik', 'router', 'created_at']
    search_fields = [
        'customer__customer_id', 'customer__name',
        'mikrotik_username', 'package__name'
    ]
    ordering = ['-created_at']
    readonly_fields = [
        'mikrotik_user_id', 'is_synced_to_mikrotik', 'last_synced_at',
        'sync_error', 'cancelled_at', 'created_by', 'created_at', 'updated_at',
        'next_billing_date'
    ]
    
    inlines = [ConnectionFeeInline]
    
    fieldsets = (
        ('Customer & Package', {
            'fields': ('customer', 'package')
        }),
        ('Subscription Details', {
            'fields': ('start_date', 'billing_day', 'next_billing_date', 'status')
        }),
        ('MikroTik Integration', {
            'fields': (
                'router', 'mikrotik_username', 'mikrotik_password',
                'mikrotik_user_id', 'is_synced_to_mikrotik',
                'last_synced_at', 'sync_error'
            )
        }),
        # Fees section removed
        ('Cancellation', {
            'fields': ('cancelled_at', 'cancellation_reason'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        """
        Set created_by when creating new subscription
        """
        if not change:  # Only when creating new
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(ConnectionFee)
class ConnectionFeeAdmin(admin.ModelAdmin):
    list_display = ['subscription', 'fee_type', 'amount', 'date', 'is_paid', 'received_by']
    list_filter = ['fee_type', 'is_paid', 'date']
    search_fields = ['subscription__customer__customer_id', 'notes']
    date_hierarchy = 'date'


@admin.register(SubscriptionHistory)
class SubscriptionHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'subscription', 'action', 'performed_by', 'created_at'
    ]
    list_filter = ['action', 'created_at']
    search_fields = ['subscription__customer__customer_id', 'notes']
    ordering = ['-created_at']
    readonly_fields = [
        'subscription', 'action', 'old_value', 'new_value',
        'notes', 'performed_by', 'created_at'
    ]
    
    fieldsets = (
        ('History Information', {
            'fields': ('subscription', 'action', 'performed_by', 'created_at')
        }),
        ('Changes', {
            'fields': ('old_value', 'new_value', 'notes')
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
