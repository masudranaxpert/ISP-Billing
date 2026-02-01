from django.apps import AppConfig


class ScheduleConfig(AppConfig):
    name = 'schedule'

    def ready(self):
        # Register jobs with ZenPulse
        try:
            import schedule.jobs
        except ImportError:
            pass
            
        from django.db.models.signals import post_migrate
        post_migrate.connect(seed_schedules, sender=self)

def seed_schedules(sender, **kwargs):
    """
    Automatically create ScheduleConfig entries for registered jobs
    if they don't exist in the database.
    """
    try:
        from zenpulse_scheduler.models import ScheduleConfig
        from zenpulse_scheduler.registry import JobRegistry
    except ImportError:
        # Avoid crashing if tables aren't ready or during strict steps
        return
    
    # Get jobs from registry
    # Note: Registry might be empty if apps aren't fully loaded yet, 
    # but we imported schedule.jobs in ready() so it should have them.
    registered_jobs = JobRegistry.get_all_jobs()
    
    # Defaults for specific jobs can be defined here
    DEFAULTS = {
        'check_expired_subscriptions': {
            'trigger_type': 'interval',
            'interval_value': 1,
            'interval_unit': 'minutes',
            'enabled': True
        },
        'delete_old_job_executions': {
            'trigger_type': 'cron',
            'cron_minute': '0',
            'cron_hour': '0', # Midnight
            'enabled': True
        },
        'generate_monthly_bills': {
            'trigger_type': 'cron',
            'cron_minute': '0',
            'cron_hour': '0',
            'cron_day': '1', # 1st day of month
            'enabled': False # Default disabled for safety
        }
    }
    
    created_count = 0
    # registered_jobs is expected to be a dict {job_key: job_func}
    for key in registered_jobs:
        if not ScheduleConfig.objects.filter(job_key=key).exists():
            defaults = DEFAULTS.get(key, {
                'trigger_type': 'interval',
                'interval_value': 1,
                'interval_unit': 'days',
                'enabled': True
            })
            ScheduleConfig.objects.create(job_key=key, **defaults)
            created_count += 1
            
    if created_count > 0:
        print(f"✅ Seeded {created_count} new ScheduleConfigs to DB")
