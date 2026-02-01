"""
Background tasks for ISP Billing System
Uses APScheduler to run periodic tasks with database-driven scheduling
"""
import logging
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.jobstores.memory import MemoryJobStore
from django_apscheduler.jobstores import DjangoJobStore

# Import jobs from separate files
from schedule.background_jobs.subscription_jobs import check_and_disable_expired_subscriptions
from schedule.background_jobs.system_jobs import delete_old_job_executions

logger = logging.getLogger(__name__)

# Create scheduler instance globally so it can be accessed by tasks
scheduler = BackgroundScheduler()
scheduler.add_jobstore(DjangoJobStore(), "default")
# Add MemoryJobStore for internal jobs that shouldn't be logged in DB
scheduler.add_jobstore(MemoryJobStore(), "memory")


def sync_scheduler_jobs():
    """
    Sync APScheduler job state (pause/resume AND reschedule) with ScheduleConfig
    This function checks if jobs should be running based on DB config.
    """
    # Import necessary models here to avoid circular imports
    from schedule.models import ScheduleConfig
    
    # Iterate over all jobs in the scheduler
    for job in scheduler.get_jobs():
        # Skip the sync job itself to avoid recursion or pausing the syncer
        if job.id == 'sync_scheduler_jobs':
            continue
            
        try:
            config = ScheduleConfig.objects.get(job__id=job.id)
            
            # --- 1. Handle Pause/Resume Logic ---
            # If enabled in DB but no next run time (paused), Resume it
            if config.is_enabled and not job.next_run_time:
                logger.info(f"Resuming job: {job.id}")
                scheduler.resume_job(job.id)
            
            # If disabled in DB but has next run time (running), Pause it
            elif not config.is_enabled and job.next_run_time:
                logger.info(f"Pausing job: {job.id}")
                scheduler.pause_job(job.id)
            
            # --- 2. Handle Rescheduling Logic (Time Changes) ---
            # Only check for schedule changes if job is enabled
            if config.is_enabled and hasattr(job.trigger, 'interval'):
                current_interval = job.trigger.interval
                
                # Calculate target seconds based on config
                target_seconds = 0
                if config.interval_unit == 'seconds': target_seconds = config.interval_value
                elif config.interval_unit == 'minutes': target_seconds = config.interval_value * 60
                elif config.interval_unit == 'hours': target_seconds = config.interval_value * 3600
                elif config.interval_unit == 'days': target_seconds = config.interval_value * 86400
                elif config.interval_unit == 'weeks': target_seconds = config.interval_value * 604800
                
                # Allow 1 second difference due to potential float precision issues
                if abs(current_interval.total_seconds() - target_seconds) > 1:
                    logger.info(f"Schedule changed for {job.id}. Updating to every {config.interval_value} {config.interval_unit}")
                    
                    new_trigger = None
                    if config.interval_unit == 'seconds': new_trigger = IntervalTrigger(seconds=config.interval_value)
                    elif config.interval_unit == 'minutes': new_trigger = IntervalTrigger(minutes=config.interval_value)
                    elif config.interval_unit == 'hours': new_trigger = IntervalTrigger(hours=config.interval_value)
                    elif config.interval_unit == 'days': new_trigger = IntervalTrigger(days=config.interval_value)
                    elif config.interval_unit == 'weeks': new_trigger = IntervalTrigger(weeks=config.interval_value)
                    
                    if new_trigger:
                        scheduler.reschedule_job(job.id, trigger=new_trigger)

        except ScheduleConfig.DoesNotExist:
            pass
        except Exception as e:
            logger.error(f"Error syncing job {job.id}: {e}")


def start_scheduler():
    """
    Start the APScheduler background scheduler with database-driven configuration
    """
    from schedule.models import ScheduleConfig
    from django_apscheduler.models import DjangoJob
    
    # 1. Add Default Jobs (Core Logic) - Stored in DB (DjangoJobStore)
    default_jobs = {
        'check_expired_subscriptions': {
            'function': check_and_disable_expired_subscriptions,
            'name': 'Check and disable expired subscriptions',
            'trigger': IntervalTrigger(minutes=1, timezone=timezone.get_current_timezone()),
            'cron': False
        },
        'delete_old_job_executions': {
            'function': delete_old_job_executions,
            'name': 'Delete old job executions',
            'trigger': CronTrigger(
                second='0', minute='0', hour='0', 
                day='*', month='*', day_of_week='0',  # Every Sunday at midnight
                timezone=timezone.get_current_timezone()
            ),
            'cron': True
        },
    }
    
    logger.info("Adding/Updating default jobs in APScheduler...")
    for job_id, job_config in default_jobs.items():
        scheduler.add_job(
            job_config['function'],
            trigger=job_config['trigger'],
            id=job_id,
            max_instances=1,
            replace_existing=True,
            name=job_config['name']
        )
        logger.info(f"Added job: {job_config['name']}")
    
    # Checks every 10 seconds to sync state between DB and Scheduler
    scheduler.add_job(
        sync_scheduler_jobs,
        trigger=IntervalTrigger(seconds=10),
        id='sync_scheduler_jobs',
        jobstore='memory',  # <--- This ensurScheduleConfiges no DB logging
        max_instances=1,
        replace_existing=True,
        name='Sync Scheduler State'
    )
    logger.info("Added sync job to scheduler (Memory Store)")

    # 3. Start Scheduler
    try:
        if not scheduler.running:
            logger.info("Starting scheduler...")
            scheduler.start()
            logger.info("Scheduler started successfully!")
        else:
            logger.info("Scheduler is already running")
    except KeyboardInterrupt:
        logger.info("Stopping scheduler...")
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully!")
        return
    
    # 4. Initialize ScheduleConfig in DB (One-time check on startup)
    logger.info("Initializing schedule configurations in DB...")
    for job_id, job_config in default_jobs.items():
        try:
            # We fetch ID directly because it exists now
            if not ScheduleConfig.objects.filter(job__id=job_id).exists():
                django_job = DjangoJob.objects.get(id=job_id)
                
                if job_config.get('cron'):
                    defaults = {
                        'interval_value': 1,
                        'interval_unit': 'days',
                        'cron_expression': 'Daily at midnight',
                        'is_enabled': True,
                    }
                else:
                    defaults = {
                        'interval_value': 1,
                        'interval_unit': 'minutes',
                        'is_enabled': True,
                    }
                
                ScheduleConfig.objects.create(job=django_job, **defaults)
                logger.info(f"Created initial ScheduleConfig for: {job_id}")
                
        except Exception as e:
            logger.error(f"Error initializing config for {job_id}: {e}")
