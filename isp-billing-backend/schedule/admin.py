from django.contrib import admin
from django.contrib import messages
from .models import ScheduleConfig


@admin.register(ScheduleConfig)
class ScheduleConfigAdmin(admin.ModelAdmin):
    list_display = ['get_job_id', 'get_job_name', 'is_enabled', 'get_schedule_display', 'get_next_run', 'updated_at']
    list_filter = ['is_enabled', 'interval_unit']
    search_fields = ['job__id']
    readonly_fields = ['created_at', 'updated_at', 'available_jobs_help', 'get_job_details', 'get_job_name']
    actions = ['sync_from_apscheduler', 'enable_jobs', 'disable_jobs']
    
    def get_job_id(self, obj):
        """Display job ID"""
        return obj.job.id if obj.job else '-'
    get_job_id.short_description = 'Job ID'
    get_job_id.admin_order_field = 'job__id'

    def get_job_name(self, obj):
        """Display human readable name"""
        return obj.job.id.replace('_', ' ').title() if obj.job else '-'
    get_job_name.short_description = 'Job Name'
    
    def get_next_run(self, obj):
        """Display next run time"""
        return obj.job.next_run_time if obj.job else '-'
    get_next_run.short_description = 'Next Run'
    
    def get_job_details(self, obj):
        """Show job details from APScheduler"""
        if obj.job:
            return f"Job ID: {obj.job.id}\nNext Run: {obj.job.next_run_time}"
        return "No job linked"
    get_job_details.short_description = "APScheduler Job Details"
    
    def available_jobs_help(self, obj):
        """Show available jobs from APScheduler"""
        jobs = ScheduleConfig.get_available_jobs()
        if jobs:
            job_list = ', '.join([f"{job.id}" for job, _ in jobs])
            return f"Available jobs in APScheduler: {job_list}"
        return "No jobs found in APScheduler database"
    available_jobs_help.short_description = "Available Jobs"
    
    def sync_from_apscheduler(self, request, queryset):
        """Sync schedule configs from APScheduler"""
        count = ScheduleConfig.sync_from_apscheduler()
        self.message_user(request, f"Successfully synced {count} new job(s) from APScheduler", messages.SUCCESS)
    sync_from_apscheduler.short_description = "Sync jobs from APScheduler"
    
    def enable_jobs(self, request, queryset):
        """Enable selected jobs"""
        count = queryset.update(is_enabled=True)
        self.message_user(request, f"Enabled {count} job(s)", messages.SUCCESS)
    enable_jobs.short_description = "Enable selected jobs"
    
    def disable_jobs(self, request, queryset):
        """Disable selected jobs"""
        count = queryset.update(is_enabled=False)
        self.message_user(request, f"Disabled {count} job(s)", messages.SUCCESS)
    disable_jobs.short_description = "Disable selected jobs"
    
    fieldsets = (
        ('Job Information', {
            'fields': ('job', 'get_job_details', 'get_job_name', 'is_enabled'),
            'description': 'Select an existing APScheduler job to configure'
        }),
        ('Schedule Configuration', {
            'fields': ('interval_value', 'interval_unit', 'cron_expression', 'schedule_time'),
            'description': 'Configure when this job should run. Use either interval or cron expression.'
        }),
        ('Available Jobs', {
            'fields': ('available_jobs_help',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
