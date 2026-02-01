from rest_framework import serializers
from .models import ScheduleConfig


class ScheduleConfigSerializer(serializers.ModelSerializer):
    schedule_display = serializers.CharField(source='get_schedule_display', read_only=True)
    job_id = serializers.CharField(source='job.id', read_only=True)
    next_run_time = serializers.DateTimeField(source='job.next_run_time', read_only=True)
    last_run_time = serializers.SerializerMethodField()
    last_status = serializers.SerializerMethodField()
    
    # Dynamic fields mimicking old fields for frontend compatibility
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    
    class Meta:
        model = ScheduleConfig
        fields = [
            'job_id',
            'name',
            'description',
            'is_enabled',
            'interval_value',
            'interval_unit',
            'cron_expression',
            'schedule_time',
            'schedule_display',
            'next_run_time',
            'last_run_time',
            'last_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'job_id', 'next_run_time', 'last_run_time', 'last_status', 'name', 'description']
    
    def get_last_run_time(self, obj):
        """Get last run time from job executions"""
        from django_apscheduler.models import DjangoJobExecution
        last_execution = DjangoJobExecution.objects.filter(
            job=obj.job
        ).order_by('-run_time').first()
        return last_execution.run_time if last_execution else None
    
    def get_last_status(self, obj):
        """Get last execution status"""
        from django_apscheduler.models import DjangoJobExecution
        last_execution = DjangoJobExecution.objects.filter(
            job=obj.job
        ).order_by('-run_time').first()
        
        if not last_execution:
            return None
        
        # APScheduler uses 'Executed' for successful runs, map it to 'Success' for frontend
        if last_execution.status == 'Executed':
            return 'Success'
        elif last_execution.exception:
            return 'Failed'
        else:
            return last_execution.status

    def get_name(self, obj):
        """Generate readable name from job ID"""
        if obj.job_id:
            return obj.job_id.replace('_', ' ').capitalize()
        return "Unknown Job"

    def get_description(self, obj):
        """Generate description from job ID"""
        # We can map specific IDs to descriptions if needed, or just return name
        DESCRIPTIONS = {
            'check_expired_subscriptions': 'Checks for subscriptions with unpaid bills past their expiry date and disables them',
            'delete_old_job_executions': 'Cleans up old job execution records from the database',
        }
        return DESCRIPTIONS.get(obj.job_id, f"Schedule configuration for {self.get_name(obj)}")
