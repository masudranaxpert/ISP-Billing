from rest_framework import serializers
from .models import Bill, Payment, Invoice, AdvancePayment, Discount, Refund
from subscription.serializers import SubscriptionSerializer


class BillSerializer(serializers.ModelSerializer):
    """
    Serializer for Bill model
    """
    subscription_customer = serializers.CharField(source='subscription.customer.name', read_only=True)
    subscription_package = serializers.CharField(source='subscription.package.name', read_only=True)
    customer_name = serializers.CharField(source='subscription.customer.name', read_only=True)
    package_name = serializers.CharField(source='subscription.package.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Bill
        fields = [
            'id', 'bill_number', 'subscription', 'subscription_customer', 'subscription_package',
            'customer_name', 'package_name',
            'billing_month', 'billing_year', 'billing_date',
            'package_price', 'discount', 'other_charges', 'total_amount',
            'paid_amount', 'due_amount', 'status', 'status_display',
            'notes', 'is_auto_generated', 'generated_by',
            'created_at', 'updated_at', 'is_paid'
        ]
        read_only_fields = [
            'id', 'bill_number', 'total_amount', 'due_amount',
            'is_paid', 'created_at', 'updated_at'
        ]


class BillCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating bills
    """
    class Meta:
        model = Bill
        fields = [
            'subscription', 'billing_month', 'billing_year',
            'package_price', 'total_amount',
            'paid_amount', 'due_amount', 'status',
            'discount', 'other_charges', 'notes'
        ]
        read_only_fields = ['total_amount', 'due_amount']


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment model
    """
    bill_number = serializers.CharField(source='bill.bill_number', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)
    advance_number = serializers.CharField(source='advance_payment.advance_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'bill', 'bill_number', 'advance_payment', 'advance_number',
            'amount', 'payment_method', 'payment_method_display',
            'payment_date', 'transaction_id', 'reference_number',
            'status', 'status_display', 'notes',
            'received_by', 'received_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating payments
    """
    class Meta:
        model = Payment
        fields = [
            'bill', 'amount', 'payment_method', 'payment_date',
            'transaction_id', 'reference_number', 'notes', 'advance_payment'
        ]


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model
    """
    bill_details = BillSerializer(source='bill', read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'bill', 'bill_details',
            'issue_date', 'pdf_file', 'generated_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']


class AdvancePaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Advance Payment model
    """
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    received_by_name = serializers.CharField(source='received_by.username', read_only=True)
    
    class Meta:
        model = AdvancePayment
        fields = [
            'id', 'advance_number', 'customer', 'customer_name', 'customer_phone',
            'amount', 'payment_method', 'payment_method_display', 'payment_date',
            'used_amount', 'remaining_balance', 'transaction_id', 'notes',
            'received_by', 'received_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'advance_number', 'remaining_balance',
            'created_at', 'updated_at'
        ]


class AdvancePaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating advance payments
    """
    class Meta:
        model = AdvancePayment
        fields = [
            'customer', 'amount', 'payment_method', 'payment_date',
            'transaction_id', 'notes'
        ]


class DiscountSerializer(serializers.ModelSerializer):
    """
    Serializer for Discount model
    """
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)
    apply_to_display = serializers.CharField(source='get_apply_to_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Discount
        fields = [
            'id', 'name', 'description', 'discount_type', 'discount_type_display',
            'discount_value', 'apply_to', 'apply_to_display',
            'start_date', 'end_date', 'is_active', 'is_valid',
            'max_uses', 'current_uses', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_uses', 'is_valid', 'created_at', 'updated_at']


class RefundSerializer(serializers.ModelSerializer):
    """
    Serializer for Refund model
    """
    subscription_customer = serializers.CharField(source='subscription.customer.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    refund_method_display = serializers.CharField(source='get_refund_method_display', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'refund_number', 'subscription', 'subscription_customer',
            'refund_amount', 'advance_balance', 'other_balance',
            'refund_method', 'refund_method_display', 'refund_date',
            'status', 'status_display', 'request_reason',
            'approval_notes', 'rejection_reason', 'transaction_id',
            'requested_by', 'requested_by_name',
            'approved_by', 'approved_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refund_number', 'approved_by', 'processed_by',
            'created_at', 'updated_at'
        ]


class RefundCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating refund requests
    """
    class Meta:
        model = Refund
        fields = [
            'subscription', 'refund_amount', 'advance_balance',
            'other_balance', 'request_reason'
        ]
