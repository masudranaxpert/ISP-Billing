from django.db import models
from django.core.validators import MinValueValidator
from customers.models import Zone


class Package(models.Model):
    """
    Internet Package model
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    name = models.CharField(max_length=100, unique=True)
    
    # Bandwidth (in Mbps)
    bandwidth_download = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Download speed in Mbps'
    )
    bandwidth_upload = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Upload speed in Mbps'
    )
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    validity_days = models.IntegerField(default=30, help_text='Package validity in days')
    
    # Description
    description = models.TextField(blank=True, null=True)
    
    # MikroTik Integration
    mikrotik_queue_name = models.CharField(
        max_length=100,
        unique=True,
        help_text='MikroTik queue profile name (e.g., home-10mbps)'
    )
    
    # Burst settings (optional)
    burst_limit_download = models.IntegerField(
        null=True,
        blank=True,
        help_text='Burst download limit in Mbps (optional), Providing higher speed than the normal speed for a short period of time.'
    )
    burst_limit_upload = models.IntegerField(
        null=True,
        blank=True,
        help_text='Burst upload limit in Mbps (optional), Providing higher speed than the normal speed for a short period of time.'
    )
    burst_threshold_download = models.IntegerField(
        null=True,
        blank=True,
        help_text='Burst threshold download in Mbps (optional), The threshold at which the burst limit is activated.'
    )
    burst_threshold_upload = models.IntegerField(
        null=True,
        blank=True,
        help_text='Burst threshold upload in Mbps (optional), The threshold at which the burst limit is activated.'
    )
    burst_time = models.IntegerField(
        null=True,
        blank=True,
        help_text='Burst time in seconds (optional), The duration for which the burst limit is activated.'
    )
    
    # Priority (1-8, lower is higher priority)
    priority = models.IntegerField(
        default=8,
        validators=[MinValueValidator(1)],
        help_text='Queue priority (1-8, lower is higher priority), Lower value means higher priority.'
    )
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'packages'
        verbose_name = 'Package'
        verbose_name_plural = 'Packages'
        ordering = ['price']
    
    def __str__(self):
        return f"{self.name} - {self.bandwidth_download}Mbps - {self.price} BDT"
    
    @property
    def speed_display(self):
        """Display speed in readable format"""
        return f"{self.bandwidth_download}/{self.bandwidth_upload} Mbps"


class MikroTikRouter(models.Model):
    """
    MikroTik Router configuration model
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField(unique=True)
    api_port = models.IntegerField(default=8728)
    username = models.CharField(max_length=50)
    password = models.CharField(max_length=255, help_text='Router API password')
    
    # Zone assignment
    zone = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mikrotik_routers',
        help_text='Assign router to specific zone'
    )
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    # Connection tracking
    last_connected_at = models.DateTimeField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mikrotik_routers'
        verbose_name = 'MikroTik Router'
        verbose_name_plural = 'MikroTik Routers'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.ip_address})"


class MikroTikQueueProfile(models.Model):
    """
    MikroTik Queue Profile - synced with Package
    """
    package = models.ForeignKey(
        Package,
        on_delete=models.CASCADE,
        related_name='queue_profiles'
    )
    router = models.ForeignKey(
        MikroTikRouter,
        on_delete=models.CASCADE,
        related_name='queue_profiles'
    )
    
    # MikroTik Queue ID
    mikrotik_queue_id = models.CharField(max_length=50, blank=True, null=True)
    
    # Sync status
    is_synced = models.BooleanField(default=False)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_error = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'mikrotik_queue_profiles'
        verbose_name = 'MikroTik Queue Profile'
        verbose_name_plural = 'MikroTik Queue Profiles'
        unique_together = ['package', 'router']
    
    def __str__(self):
        return f"{self.package.name} on {self.router.name}"


class MikroTikSyncLog(models.Model):
    """
    Log for MikroTik sync operations
    """
    ACTION_CHOICES = (
        ('create_queue', 'Create Queue'),
        ('update_queue', 'Update Queue'),
        ('delete_queue', 'Delete Queue'),
        ('create_user', 'Create PPPoE User'),
        ('update_user', 'Update PPPoE User'),
        ('delete_user', 'Delete PPPoE User'),
        ('enable_user', 'Enable User'),
        ('disable_user', 'Disable User'),
    )
    
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    router = models.ForeignKey(
        MikroTikRouter,
        on_delete=models.CASCADE,
        related_name='sync_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    
    # Details
    entity_type = models.CharField(max_length=50, help_text='e.g., queue, pppoe_user')
    entity_id = models.CharField(max_length=100, blank=True, null=True)
    
    request_data = models.JSONField(blank=True, null=True)
    response_data = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mikrotik_sync_logs'
        verbose_name = 'MikroTik Sync Log'
        verbose_name_plural = 'MikroTik Sync Logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} on {self.router.name} - {self.status}"
