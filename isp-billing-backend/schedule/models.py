from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django_apscheduler.models import DjangoJob


class ScheduleConfig(models.Model):
    """
    Configuration for scheduled jobs
    Dynamically manages jobs from APScheduler database using ForeignKey
    """
    INTERVAL_UNIT_CHOICES = [
        ('seconds', 'Seconds'),
        ('minutes', 'Minutes'),
        ('hours', 'Hours'),
        ('days', 'Days'),
        ('weeks', 'Weeks'),
    ]
    
    job = models.OneToOneField(
        DjangoJob,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name='schedule_config',
        help_text="APScheduler job to configure"
    )
    
    is_enabled = models.BooleanField(
        default=True,
        help_text="Whether this job is enabled"
    )
    
    # Interval-based schedule
    interval_value = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Interval value (e.g., 5 for '5 minutes')"
    )
    
    interval_unit = models.CharField(
        max_length=20,
        choices=INTERVAL_UNIT_CHOICES,
        default='minutes',
        help_text="Interval unit"
    )
    
    # Cron-based schedule (for advanced scheduling)
    cron_expression = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Cron expression (optional, overrides interval if set)"
    )
    
    # Time of day for daily schedules (HH:MM format)
    schedule_time = models.TimeField(
        null=True,
        blank=True,
        help_text="Time of day for daily schedules (e.g., 02:00 for 2 AM)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_config'
        verbose_name = 'Schedule Configuration'
        verbose_name_plural = 'Schedule Configurations'
        ordering = ['job_id']
    
    def __str__(self):
        return f"{self.job_id} ({self.get_schedule_display()})"
    
    @property
    def job_id(self):
        """Get job ID from related DjangoJob"""
        return self.job.id if self.job else None
    
    def get_schedule_display(self):
        """Get human-readable schedule"""
        if self.cron_expression:
            return f"Cron: {self.cron_expression}"
        
        # For daily schedules with specific time
        if self.interval_unit == 'days' and self.interval_value == 1 and self.schedule_time:
            return f"Daily at {self.schedule_time.strftime('%I:%M %p')}"
        
        return f"Every {self.interval_value} {self.interval_unit}"
    
    @classmethod
    def get_job_config(cls, job_id):
        """Get configuration for a specific job"""
        try:
            return cls.objects.get(job__id=job_id, is_enabled=True)
        except cls.DoesNotExist:
            return None
    
    @classmethod
    def get_available_jobs(cls):
        """
        Get list of available jobs from APScheduler database
        Returns list of tuples: (job, job_name)
        """
        jobs = DjangoJob.objects.all()
        return [(job, job.id.replace('_', ' ').title()) for job in jobs]
    
    @classmethod
    def sync_from_apscheduler(cls):
        """
        Sync schedule configs from APScheduler jobs
        Creates ScheduleConfig for any APScheduler job that doesn't have one
        """
        apscheduler_jobs = DjangoJob.objects.all()
        created_count = 0
        
        for django_job in apscheduler_jobs:
            if not cls.objects.filter(job=django_job).exists():
                cls.objects.create(
                    job=django_job,
                    is_enabled=True,
                    interval_value=1,
                    interval_unit='minutes'
                )
                created_count += 1
        
        return created_count

