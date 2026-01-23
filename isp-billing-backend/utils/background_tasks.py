"""
Background tasks for ISP Billing System
Uses APScheduler to run periodic tasks
"""
import logging
from datetime import date
from django.utils import timezone
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django_apscheduler import util

from subscription.models import Subscription
from billing.models import Bill
from mikrotik.services import MikroTikService

logger = logging.getLogger(__name__)


def check_and_disable_expired_subscriptions():
    """
    Check all active subscriptions and disable those with unpaid bills past expiry day
    This task runs every hour
    
    Logic: If today's date > expiry_day, check if current month's bill is paid.
    If unpaid, disable the subscription.
    """
    today = date.today()
    current_month = today.month
    current_year = today.year
    current_day = today.day
    
    logger.info(f'Checking expired subscriptions at {timezone.now()} (Day: {current_day})...')
    
    # Get all active subscriptions with router
    active_subscriptions = Subscription.objects.filter(
        status='active',
        router__isnull=False
    ).select_related('customer', 'package', 'router')
    
    disabled_count = 0
    
    for subscription in active_subscriptions:
        try:
            expiry_day = subscription.billing_day
            
            # Only check if current day is past the expiry day
            if current_day > expiry_day:
                # Check if current month's bill exists
                current_bill = Bill.objects.filter(
                    subscription=subscription,
                    billing_month=current_month,
                    billing_year=current_year
                ).first()
                
                # If bill exists and is not paid, disable
                if current_bill and current_bill.status in ['pending', 'partial', 'overdue']:
                    logger.warning(
                        f"Subscription {subscription.id} (Customer: {subscription.customer.customer_id}) "
                        f"has unpaid bill for {current_month}/{current_year}. "
                        f"Expiry day: {expiry_day}, Today: {current_day}. Disabling..."
                    )
                    disable_subscription(subscription, current_bill)
                    disabled_count += 1
                # If bill doesn't exist, that's also a problem - create and disable
                elif not current_bill:
                    logger.warning(
                        f"Subscription {subscription.id} (Customer: {subscription.customer.customer_id}) "
                        f"has no bill for {current_month}/{current_year} and expiry day {expiry_day} has passed. "
                        f"This subscription should have a bill generated."
                    )
                    
        except Exception as e:
            logger.error(f"Error processing subscription {subscription.id}: {e}")
            continue
    
    if disabled_count > 0:
        logger.info(f'Disabled {disabled_count} expired subscriptions')
    else:
        logger.info('No expired subscriptions found')


def disable_subscription(subscription, bill):
    """
    Disable subscription in MikroTik and update status
    """
    try:
        # Disable in MikroTik
        service = MikroTikService(subscription.router)
        success, message = service.disable_pppoe_user(subscription.mikrotik_username)
        
        if success:
            # Update subscription status to suspended
            subscription.status = 'suspended'
            subscription.save()
            
            # Update bill status to overdue
            bill.status = 'overdue'
            bill.save()
            
            logger.info(
                f"Disabled subscription {subscription.id} "
                f"(Customer: {subscription.customer.customer_id}) due to unpaid bill"
            )
        else:
            logger.error(
                f"Failed to disable subscription {subscription.id} in MikroTik: {message}"
            )
            
    except Exception as e:
        logger.error(f"Error disabling subscription {subscription.id}: {e}")


@util.close_old_connections
def delete_old_job_executions(max_age=604_800):
    """
    Delete old job executions (older than 7 days by default)
    This job deletes APScheduler job execution entries older than `max_age` from the database.
    """
    DjangoJobExecution.objects.delete_old_job_executions(max_age)


def start_scheduler():
    """
    Start the APScheduler background scheduler
    """
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # Add job to check expired subscriptions every minute (for development/testing)
    scheduler.add_job(
        check_and_disable_expired_subscriptions,
        trigger=CronTrigger(second=0),  # Run every minute at second 0
        id="check_expired_subscriptions",
        max_instances=1,
        replace_existing=True,
        name="Check and disable expired subscriptions"
    )
    logger.info("Added job: Check and disable expired subscriptions (runs every minute)")
    
    # Add job to delete old job executions every week
    scheduler.add_job(
        delete_old_job_executions,
        trigger=CronTrigger(
            day_of_week="mon", hour="00", minute="00"
        ),  # Every Monday at midnight
        id="delete_old_job_executions",
        max_instances=1,
        replace_existing=True,
        name="Delete old job executions"
    )
    logger.info("Added job: Delete old job executions (runs every Monday at midnight)")
    
    try:
        logger.info("Starting scheduler...")
        scheduler.start()
        logger.info("Scheduler started successfully!")
    except KeyboardInterrupt:
        logger.info("Stopping scheduler...")
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully!")
