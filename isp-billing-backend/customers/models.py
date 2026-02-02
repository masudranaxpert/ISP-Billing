from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
from accounts.models import User


class Zone(models.Model):
    """
    Zone/Area model for geographical organization of customers
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True, help_text='Unique zone code (e.g., MIR, GUL, DHK)')
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'zones'
        verbose_name = 'Zone'
        verbose_name_plural = 'Zones'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    @property
    def customer_count(self):
        """Get total number of customers in this zone"""
        return self.customers.count()
    
    @property
    def active_customer_count(self):
        """Get number of active customers in this zone"""
        return self.customers.filter(status='active').count()



class ConnectionType(models.Model):
    """
    Model for Connection Types (e.g., PPPoE, Static IP, Hotspot)
    """
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True, help_text='Unique code (e.g., PPPOE, STATIC)')
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=Zone.STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'connection_types'
        verbose_name = 'Connection Type'
        verbose_name_plural = 'Connection Types'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def customer_count(self):
        """Get total number of customers with this connection type"""
        return self.customers.count()
    
    @property
    def active_customer_count(self):
        """Get number of active customers with this connection type"""
        return self.customers.filter(status='active').count()


class Customer(models.Model):
    """
    Customer model for ISP customers
    """
    BILLING_TYPE_CHOICES = (
        ('personal', 'Personal'),
        ('business', 'Business'),
        ('free', 'Free'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('inactive', 'Inactive'),
        ('closed', 'Closed'),
    )
    
    # Customer ID (auto-generated)
    customer_id = models.CharField(max_length=50, unique=True, editable=False)
    
    # Basic Information
    name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)
    phone = PhoneNumberField(region='BD', help_text='Phone number in international format')
    alternative_phone = PhoneNumberField(region='BD', blank=True, null=True, help_text='Alternative phone number')
    nid = models.CharField(max_length=20, blank=True, null=True, help_text='National ID Number')
    address = models.TextField()
    
    # Zone/Area
    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers'
    )
    
    # billing & Connection Type
    billing_type = models.CharField(
        max_length=20,
        choices=BILLING_TYPE_CHOICES,
        default='residential'
    )
    connection_type = models.ForeignKey(
        ConnectionType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers',
        help_text='Type of connection (e.g., PPPoE, Optical Fiber)'
    )
    
    # Network Information
    mac_address = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text='MAC address for binding (format: XX:XX:XX:XX:XX:XX)'
    )
    static_ip = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text='Static IP for business customers'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_customers'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_id']),
            models.Index(fields=['phone']),
            models.Index(fields=['status']),
            models.Index(fields=['zone']),
        ]
    
    def __str__(self):
        return f"{self.customer_id} - {self.name}"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate customer_id
        """
        if not self.customer_id:
            # Generate customer ID: ISP-YYYY-XXXX
            from django.utils import timezone
            year = timezone.now().year
            
            # Get last customer ID for this year
            last_customer = Customer.objects.filter(
                customer_id__startswith=f'ISP-{year}-'
            ).order_by('-customer_id').first()
            
            if last_customer:
                # Extract number and increment
                last_number = int(last_customer.customer_id.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.customer_id = f'ISP-{year}-{new_number:04d}'
        
        super().save(*args, **kwargs)
    
    @property
    def full_address(self):
        """Get full address with zone"""
        if self.zone:
            return f"{self.address}, {self.zone.name}"
        return self.address
    
    @property
    def is_active(self):
        """Check if customer is active"""
        return self.status == 'active'
    
    @property
    def is_suspended(self):
        """Check if customer is suspended"""
        return self.status == 'suspended'
