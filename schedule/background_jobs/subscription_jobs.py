import logging
from datetime import date
from django.utils import timezone
from subscription.models import Subscription
from billing.models import Bill
from mikrotik.services import MikroTikService

logger = logging.getLogger(__name__)

def check_and_disable_expired_subscriptions():
    """
    Check all active subscriptions and disable those with unpaid bills past expiry day
    
    Logic: If today's date > expiry_day, check if current month's bill is paid.
    If unpaid, disable the subscription.
    """
    # Check if this job is enabled
    from schedule.models import ScheduleConfig
    config = ScheduleConfig.get_job_config('check_expired_subscriptions')
    if not config or not config.is_enabled:
        logger.info("Job is disabled, skipping execution")
        # Ensure we don't proceed if disabled (safety net)
        return
    
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
                # If bill doesn't exist, that's also a problem
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
    Disable a subscription and update MikroTik
    """
    try:
        # Update subscription status
        subscription.status = 'suspended'
        subscription.save()
        
        # Update bill status to overdue if it's still pending
        if bill.status == 'pending':
            bill.status = 'overdue'
            bill.save()
        
        # Disable in MikroTik
        if subscription.router:
            mikrotik_service = MikroTikService(subscription.router)
            success = mikrotik_service.disable_customer(subscription.customer.customer_id)
            
            if success:
                logger.info(f"Successfully disabled subscription {subscription.id} in MikroTik")
            else:
                logger.error(f"Failed to disable subscription {subscription.id} in MikroTik")
                
    except Exception as e:
        logger.error(f"Error disabling subscription {subscription.id}: {e}")
