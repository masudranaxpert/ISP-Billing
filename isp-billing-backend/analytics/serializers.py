from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics
    """
    total_customers = serializers.IntegerField()
    active_customers = serializers.IntegerField()
    suspended_customers = serializers.IntegerField()
    total_subscriptions = serializers.IntegerField()
    active_subscriptions = serializers.IntegerField()
    total_packages = serializers.IntegerField()
    total_zones = serializers.IntegerField()
    total_routers = serializers.IntegerField()
    online_routers = serializers.IntegerField()


class RevenueStatsSerializer(serializers.Serializer):
    """
    Serializer for revenue statistics
    """
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    due_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    advance_balance = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_bills = serializers.IntegerField()
    paid_bills = serializers.IntegerField()
    overdue_bills = serializers.IntegerField()
    total_payments = serializers.IntegerField()
    total_refunds = serializers.DecimalField(max_digits=15, decimal_places=2)


class MonthlyRevenueSerializer(serializers.Serializer):
    """
    Serializer for monthly revenue data
    """
    month = serializers.IntegerField()
    year = serializers.IntegerField()
    month_name = serializers.CharField()
    total_billed = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_due = serializers.DecimalField(max_digits=15, decimal_places=2)
    bill_count = serializers.IntegerField()


class PackageStatsSerializer(serializers.Serializer):
    """
    Serializer for package statistics
    """
    package_id = serializers.IntegerField()
    package_name = serializers.CharField()
    subscriber_count = serializers.IntegerField()
    active_count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=2)


class ZoneStatsSerializer(serializers.Serializer):
    """
    Serializer for zone statistics
    """
    zone_id = serializers.IntegerField()
    zone_name = serializers.CharField()
    customer_count = serializers.IntegerField()
    active_count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=15, decimal_places=2)


class PaymentMethodStatsSerializer(serializers.Serializer):
    """
    Serializer for payment method statistics
    """
    payment_method = serializers.CharField()
    payment_method_display = serializers.CharField()
    count = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=15, decimal_places=2)


class CustomerGrowthSerializer(serializers.Serializer):
    """
    Serializer for customer growth data
    """
    month = serializers.IntegerField()
    year = serializers.IntegerField()
    month_name = serializers.CharField()
    new_customers = serializers.IntegerField()
    total_customers = serializers.IntegerField()


class OverdueReportSerializer(serializers.Serializer):
    """
    Serializer for overdue bills report
    """
    bill_number = serializers.CharField()
    customer_id = serializers.CharField()
    customer_name = serializers.CharField()
    package_name = serializers.CharField()
    billing_date = serializers.DateField()
    due_date = serializers.DateField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    due_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    days_overdue = serializers.IntegerField()
