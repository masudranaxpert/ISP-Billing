from django.db import models
from django.core.validators import MinValueValidator
from customers.models import Customer
from mikrotik.models import Package, MikroTikRouter
from accounts.models import User


class Subscription(models.Model):
    """
    Customer subscription model
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )
    
    # Customer and Package
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    package = models.ForeignKey(
        Package,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    
    # Subscription Details
    start_date = models.DateField()
    billing_day = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Day of month for billing (1-31)'
    )
    billing_start_month = models.DateField(
        help_text='Month from which billing cycle starts (YYYY-MM-01 format)',
        null=True,
        blank=True
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # MikroTik Integration
    router = models.ForeignKey(
        MikroTikRouter,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscriptions',
        help_text='Assigned MikroTik router'
    )
    
    # Protocol and Profile
    PROTOCOL_CHOICES = (
        ('pppoe', 'PPPoE'),
        ('dhcp', 'DHCP'),
        ('hotspot', 'Hotspot'),
        ('static', 'Static IP'),
    )
    protocol = models.CharField(
        max_length=20,
        choices=PROTOCOL_CHOICES,
        null=True,
        blank=True,
        help_text='Connection protocol'
    )
    mikrotik_profile_name = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text='MikroTik profile name (fetched from router)'
    )
    
    mikrotik_username = models.CharField(
        max_length=100,
        unique=True,
        help_text='PPPoE username for MikroTik'
    )
    mikrotik_password = models.CharField(
        max_length=100,
        help_text='PPPoE password for MikroTik'
    )
    mikrotik_user_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text='MikroTik PPPoE user ID'
    )
    
    # Active Connection Details (Updated periodically or on-demand)
    framed_ip_address = models.GenericIPAddressField(
        blank=True, 
        null=True,
        help_text='Assigned IP Address from MikroTik'
    )
    mac_address = models.CharField(
        max_length=17,
        blank=True, 
        null=True,
        help_text='Device MAC Address'
    )
    
    # Sync Status
    is_synced_to_mikrotik = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True, null=True)
    
    # Fees
    connection_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='One-time connection fee'
    )
    reconnection_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Reconnection fee after suspension'
    )
    
    # Cancellation
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_subscriptions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['status']),
            models.Index(fields=['billing_day']),
        ]
    
    def __str__(self):
        return f"{self.customer.customer_id} - {self.package.name} ({self.status})"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate mikrotik_username if not provided
        """
        if not self.mikrotik_username:
            # Generate username: customer_id without ISP- prefix
            base_username = self.customer.customer_id.replace('ISP-', '').replace('-', '')
            self.mikrotik_username = f"user{base_username}"
        
        if not self.mikrotik_password:
            # Generate random password
            import secrets
            self.mikrotik_password = secrets.token_urlsafe(12)
        
        super().save(*args, **kwargs)
    
    @property
    def is_active(self):
        """Check if subscription is active"""
        return self.status == 'active'
    
    @property
    def is_suspended(self):
        """Check if subscription is suspended"""
        return self.status == 'suspended'
    
    @property
    def next_billing_date(self):
        """Calculate next billing date based on billing_start_month and existing bills"""
        from datetime import datetime, date
        from dateutil.relativedelta import relativedelta
        
        today = datetime.now().date()
        
        # Start from billing_start_month if available, otherwise start_date
        if self.billing_start_month:
            start_month = self.billing_start_month
        else:
            start_month = self.start_date.replace(day=1)
        
        # Find the next month that doesn't have a bill yet
        current_check = start_month
        max_iterations = 24  # Check up to 2 years ahead
        
        for _ in range(max_iterations):
            # Check if bill exists for this month
            from billing.models import Bill
            bill_exists = Bill.objects.filter(
                subscription=self,
                billing_year=current_check.year,
                billing_month=current_check.month
            ).exists()
            
            if not bill_exists and current_check >= start_month:
                # This month doesn't have a bill, calculate the billing date
                try:
                    next_date = current_check.replace(day=self.billing_day)
                except ValueError:
                    # Handle case where billing day doesn't exist in month (e.g., 31st in Feb)
                    next_date = current_check + relativedelta(day=31)
                
                return next_date
            
            # Move to next month
            current_check = current_check + relativedelta(months=1)
        
        # Fallback: return next month with billing_day
        next_month = today + relativedelta(months=1)
        try:
            return next_month.replace(day=self.billing_day)
        except ValueError:
            return next_month + relativedelta(day=31)



class SubscriptionHistory(models.Model):
    """
    Track subscription status changes
    """
    ACTION_CHOICES = (
        ('created', 'Created'),
        ('activated', 'Activated'),
        ('suspended', 'Suspended'),
        ('cancelled', 'Cancelled'),
        ('package_changed', 'Package Changed'),
        ('router_changed', 'Router Changed'),
    )
    
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='history'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    old_value = models.JSONField(blank=True, null=True)
    new_value = models.JSONField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscription_actions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscription_history'
        verbose_name = 'Subscription History'
        verbose_name_plural = 'Subscription Histories'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subscription} - {self.action} at {self.created_at}"
