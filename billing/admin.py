from django.contrib import admin
from .models import Bill, Payment, Invoice, AdvancePayment, Discount, Refund


@admin.register(Bill)
class BillAdmin(admin.ModelAdmin):
    list_display = [
        'bill_number', 'subscription', 'billing_month', 'billing_year',
        'total_amount', 'paid_amount', 'due_amount', 'status'
    ]
    list_filter = ['status', 'billing_year', 'billing_month', 'is_auto_generated', 'created_at']
    search_fields = ['bill_number', 'subscription__customer__customer_id', 'subscription__customer__name']
    ordering = ['-billing_year', '-billing_month']
    readonly_fields = ['bill_number', 'total_amount', 'due_amount', 'is_paid', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Bill Information', {
            'fields': ('bill_number', 'subscription', 'status')
        }),
        ('Billing Period', {
            'fields': ('billing_month', 'billing_year', 'billing_date')
        }),
        ('Amounts', {
            'fields': ('package_price', 'discount', 'other_charges', 'total_amount', 'paid_amount', 'due_amount')
        }),
        ('Status', {
            'fields': ('is_paid',)
        }),
        ('Metadata', {
            'fields': ('is_auto_generated', 'generated_by', 'notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'payment_number', 'bill', 'amount', 'payment_method',
        'payment_date', 'status', 'received_by'
    ]
    list_filter = ['status', 'payment_method', 'payment_date']
    search_fields = ['payment_number', 'transaction_id', 'reference_number', 'bill__bill_number']
    ordering = ['-payment_date']
    readonly_fields = ['payment_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('payment_number', 'bill', 'amount', 'status')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'payment_date', 'transaction_id', 'reference_number')
        }),
        ('Metadata', {
            'fields': ('received_by', 'notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'bill', 'issue_date', 'created_at']
    list_filter = ['issue_date', 'created_at']
    search_fields = ['invoice_number', 'bill__bill_number']
    ordering = ['-created_at']
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Invoice Information', {
            'fields': ('invoice_number', 'bill', 'issue_date')
        }),
        ('PDF', {
            'fields': ('pdf_file',)
        }),
        ('Metadata', {
            'fields': ('generated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(AdvancePayment)
class AdvancePaymentAdmin(admin.ModelAdmin):
    list_display = [
        'advance_number', 'subscription', 'amount', 'months_covered',
        'remaining_balance', 'payment_date', 'payment_method'
    ]
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['advance_number', 'subscription__customer__customer_id', 'transaction_id']
    ordering = ['-payment_date']
    readonly_fields = ['advance_number', 'remaining_balance', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Advance Payment Information', {
            'fields': ('advance_number', 'subscription', 'amount', 'payment_method', 'payment_date')
        }),
        ('Advance Details', {
            'fields': ('months_covered', 'discount_percentage', 'discount_amount')
        }),
        ('Balance Tracking', {
            'fields': ('used_amount', 'remaining_balance')
        }),
        ('Transaction', {
            'fields': ('transaction_id', 'notes')
        }),
        ('Metadata', {
            'fields': ('received_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'discount_type', 'discount_value', 'apply_to',
        'start_date', 'end_date', 'is_active', 'current_uses', 'max_uses'
    ]
    list_filter = ['discount_type', 'apply_to', 'is_active', 'start_date']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['current_uses', 'is_valid', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Discount Information', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('Discount Details', {
            'fields': ('discount_type', 'discount_value', 'apply_to')
        }),
        ('Validity', {
            'fields': ('start_date', 'end_date', 'is_valid')
        }),
        ('Usage', {
            'fields': ('max_uses', 'current_uses')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = [
        'refund_number', 'subscription', 'refund_amount',
        'status', 'requested_by', 'approved_by', 'created_at'
    ]
    list_filter = ['status', 'refund_method', 'created_at']
    search_fields = ['refund_number', 'subscription__customer__customer_id', 'transaction_id']
    ordering = ['-created_at']
    readonly_fields = ['refund_number', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Refund Information', {
            'fields': ('refund_number', 'subscription', 'status')
        }),
        ('Refund Details', {
            'fields': ('refund_amount', 'advance_balance', 'other_balance')
        }),
        ('Refund Method', {
            'fields': ('refund_method', 'refund_date', 'transaction_id')
        }),
        ('Request & Approval', {
            'fields': ('request_reason', 'approval_notes', 'rejection_reason')
        }),
        ('Metadata', {
            'fields': ('requested_by', 'approved_by', 'processed_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
