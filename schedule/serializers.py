from rest_framework import serializers
from zenpulse_scheduler.models import ScheduleConfig, JobExecutionLog
from datetime import datetime

class ScheduleConfigSerializer(serializers.ModelSerializer):
    # Mapping ZenPulse fields to frontend structure
    job_id = serializers.CharField(source='job_key', read_only=True)
    is_enabled = serializers.BooleanField(source='enabled')
    name = serializers.CharField(source='job_key', read_only=True) # Simple mapping
    
    # Display fields
    schedule_display = serializers.SerializerMethodField()
    last_run_time = serializers.SerializerMethodField()
    last_status = serializers.SerializerMethodField()
    
    # Writeable fields for simple intervals
    interval_value = serializers.IntegerField(required=False, allow_null=True)
    interval_unit = serializers.CharField(required=False, allow_null=True)
    # Writeable time for Cron conversion
    schedule_time = serializers.TimeField(required=False, allow_null=True, format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    # Writeable day for Monthly Cron
    day_of_month = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=31)
    
    # Read-only/Computed fields
    description = serializers.SerializerMethodField()
    cron_expression = serializers.SerializerMethodField()
    next_run_time = serializers.SerializerMethodField()

    class Meta:
        model = ScheduleConfig
        fields = [
            'job_id', 'name', 'description', 'is_enabled', 
            'interval_value', 'interval_unit', 
            'cron_expression', 'schedule_time', 'day_of_month',
            'schedule_display',
            'next_run_time', 'last_run_time', 'last_status', 
            'updated_at'
        ]
        read_only_fields = ['job_id', 'name', 'description', 'last_run_time', 'last_status', 'updated_at', 'schedule_display', 'next_run_time', 'cron_expression']

    def validate(self, attrs):
        # Convert empty string schedule_time to None
        if 'schedule_time' in attrs and attrs['schedule_time'] == '':
            attrs['schedule_time'] = None

        # Logic Validation
        interval_unit = attrs.get('interval_unit', self.instance.interval_unit if self.instance else None)
        
        # If daily/monthly, ensure schedule_time is present if provided
        # (We accept None during update if it wasn't sent, but if sent as None it might differ)
        
        return attrs

    def to_internal_value(self, data):
        # TimeField doesn't like empty strings, so we clean it before validation
        if data.get('schedule_time') == '':
            data_copy = data.copy()
            data_copy['schedule_time'] = None
            return super().to_internal_value(data_copy)
        return super().to_internal_value(data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        
        # UI Compatibility: Map CRON jobs to UI Modes
        if instance.trigger_type == 'cron':
            # CASE: Monthly (Specific Day + specific time)
            if instance.cron_day != '*' and instance.cron_day.isdigit():
                ret['interval_value'] = 1
                ret['interval_unit'] = 'months'
                ret['day_of_month'] = int(instance.cron_day)
                
                if instance.cron_hour.isdigit() and instance.cron_minute.isdigit():
                     ret['schedule_time'] = f"{instance.cron_hour.zfill(2)}:{instance.cron_minute.zfill(2)}"
            
            # CASE: Daily (Every day + specific time)
            else:
                ret['interval_value'] = 1
                ret['interval_unit'] = 'days'
                
                if instance.cron_hour.isdigit() and instance.cron_minute.isdigit():
                     ret['schedule_time'] = f"{instance.cron_hour.zfill(2)}:{instance.cron_minute.zfill(2)}"
        
        return ret

    def update(self, instance, validated_data):
        # 1. Update Enabled Status
        if 'enabled' in validated_data:
            instance.enabled = validated_data['enabled']
            
        # 2. Update Scheduling Logic
        interval_value = validated_data.get('interval_value')
        interval_unit = validated_data.get('interval_unit')
        schedule_time = validated_data.get('schedule_time') 
        day_of_month = validated_data.get('day_of_month')
        
        # CASE A: Monthly Schedule
        if interval_unit == 'months' and schedule_time and day_of_month:
            instance.trigger_type = 'cron'
            instance.cron_minute = str(schedule_time.minute)
            instance.cron_hour = str(schedule_time.hour)
            instance.cron_day = str(day_of_month)
            instance.cron_month = '*'
            instance.cron_day_of_week = '*'
            # Clear interval fields
            instance.interval_value = None
            instance.interval_unit = None

        # CASE B: Daily Schedule with Specific Time -> Convert to CRON
        elif interval_unit == 'days' and interval_value == 1 and schedule_time:
            instance.trigger_type = 'cron'
            instance.cron_minute = str(schedule_time.minute)
            instance.cron_hour = str(schedule_time.hour)
            instance.cron_day = '*'
            instance.cron_month = '*'
            instance.cron_day_of_week = '*'
            # Clear interval fields
            instance.interval_value = None
            instance.interval_unit = None
            
        # CASE C: Normal Interval (or Daily without time) -> Convert to INTERVAL
        elif interval_value is not None and interval_unit is not None:
            instance.trigger_type = 'interval'
            instance.interval_value = interval_value
            instance.interval_unit = interval_unit
            # Reset cron fields
            instance.cron_minute = '*'
            instance.cron_hour = '*'
            instance.cron_day = '*'
            
        instance.save()
        return instance

    def get_description(self, obj):
        # Static descriptions mapping
        DESCRIPTIONS = {
            'check_expired_subscriptions': 'Checks for subscriptions with unpaid bills past their expiry date and disables them',
            'delete_old_job_executions': 'Cleans up old job execution records from the database',
            'generate_monthly_bills': 'Automatically generates bills for all active subscriptions for the current month',
        }
        return DESCRIPTIONS.get(obj.job_key, f"Schedule configuration for {obj.job_key}")

    def get_cron_expression(self, obj):
        if obj.trigger_type == 'cron':
            return f"{obj.cron_minute} {obj.cron_hour} {obj.cron_day} {obj.cron_month} {obj.cron_day_of_week}"
        return None

    def get_next_run_time(self, obj):
        # We can calculate approximate next run based on last run + interval
        # But for now returning null is safer than wrong data, 
        # or we could implement basic calculation for intervals.
        if obj.trigger_type == 'interval' and obj.interval_value and obj.interval_unit:
             # Basic calculation logic could go here, but let's keep it simple for now
             pass
        return None 

    def get_schedule_display(self, obj):
        if obj.trigger_type == 'cron':
            # Check for monthly cron
            if obj.cron_day != '*' and obj.cron_day.isdigit():
                return f"Monthly on day {obj.cron_day} at {obj.cron_hour.zfill(2)}:{obj.cron_minute.zfill(2)}"
            # Check for daily cron
            elif obj.cron_hour.isdigit() and obj.cron_minute.isdigit():
                return f"Daily at {obj.cron_hour.zfill(2)}:{obj.cron_minute.zfill(2)}"
            return f"Cron: {obj.cron_hour}:{obj.cron_minute} {obj.cron_day} {obj.cron_month} {obj.cron_day_of_week}"
        return f"Every {obj.interval_value} {obj.interval_unit}"

    def get_last_run_time(self, obj):
        last = JobExecutionLog.objects.filter(job_key=obj.job_key).first()
        return last.run_time if last else None

    def get_last_status(self, obj):
        last = JobExecutionLog.objects.filter(job_key=obj.job_key).first()
        return 'Success' if last and last.status == 'success' else 'Failed' if last else None


