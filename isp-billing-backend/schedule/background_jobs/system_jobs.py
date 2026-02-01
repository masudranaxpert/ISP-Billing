import logging
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

logger = logging.getLogger(__name__)

@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    """
    Delete old job executions from database (older than max_age seconds)
    Default: 7 days (604800 seconds)
    """
    # Check if this job is enabled
    from schedule.models import ScheduleConfig
    config = ScheduleConfig.get_job_config('delete_old_job_executions')
    if not config or not config.is_enabled:
        logger.info("Job is disabled, skipping execution")
        return
    
    DjangoJobExecution.objects.delete_old_job_executions(max_age)
    logger.info(f"Deleted job executions older than {max_age} seconds")
