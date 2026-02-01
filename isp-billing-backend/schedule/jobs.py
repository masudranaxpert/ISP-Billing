import logging
from django.utils import timezone
from datetime import date, timedelta
from zenpulse_scheduler.registry import zenpulse_job
from zenpulse_scheduler.models import JobExecutionLog
from subscription.models import Subscription
from billing.models import Bill

logger = logging.getLogger(__name__)

@zenpulse_job("check_expired_subscriptions")
def check_and_disable_expired_subscriptions():
    """
    Check all active subscriptions and disable those with unpaid bills past expiry day
    Logic: If today's date > expiry_day, check if current month's bill is paid.
    If unpaid, disable the subscription.
    """
    logger.info("Starting expired subscription check...")
    
    today = date.today()
    current_month = today.month
    current_year = today.year
    
    # 1. Get all active subscriptions
    active_subs = Subscription.objects.filter(
        status='active',
        customer__isnull=False
    ).select_related('customer', 'package')
    
    count = 0
    for sub in active_subs:
        try:
            # Skip if no expiry date set (shouldn't happen for active subs usually)
            if not sub.expiry_date:
                continue
                
            expiry_day = sub.expiry_date.day
            
            # If today is past the expiry day
            if today.day > expiry_day:
                # Check for paid bill this month
                has_paid_bill = Bill.objects.filter(
                    customer=sub.customer,
                    billing_month__month=current_month,
                    billing_month__year=current_year,
                    status='paid'
                ).exists()
                
                if not has_paid_bill:
                    logger.info(f"Disabling subscription for {sub.customer.username} (Expiry: {expiry_day}, Today: {today.day})")
                    # Disable logic here - calling service or model method
                    # Assuming basic status update for now to keep it simple/safe
                    # In real app: sub.disable_subscription() or similar
                    sub.status = 'inactive'
                    sub.save(update_fields=['status'])
                    count += 1
                    
        except Exception as e:
            logger.error(f"Error checking sub {sub.id}: {e}")
            
    logger.info(f"Expired subscription check completed. Disabled {count} subscriptions.")

@zenpulse_job("delete_old_job_executions")
def delete_old_job_executions(**kwargs):
    """
    Delete ALL job executions from ZenPulse database immediately.
    """
    count, _ = JobExecutionLog.objects.all().delete()
    logger.info(f"Deleted all {count} job execution logs.")

@zenpulse_job("generate_monthly_bills")
def generate_monthly_bills():
    """
    Generate monthly bills for all active subscriptions automatically.
    This job is typically scheduled to run on the 1st of every month.
    """
    logger.info("Starting automated monthly bill generation...")
    
    today = date.today()
    current_month = today.month
    current_year = today.year
    
    # Logic similar to GenerateMonthlyBillsView
    active_subscriptions = Subscription.objects.filter(status='active')
    generated_count = 0
    skipped_count = 0
    
    for sub in active_subscriptions:
        try:
            # Check if bill exists for this month/year
            if Bill.objects.filter(subscription=sub, billing_year=current_year, billing_month=current_month).exists():
                skipped_count += 1
                continue
                
            amount = sub.package.price
            
            # Create bill
            # Note: automated bills have no generated_by user
            Bill.objects.create(
                subscription=sub,
                billing_month=current_month,
                billing_year=current_year,
                billing_date=today,
                package_price=amount,
                total_amount=amount,
                due_amount=amount,
                paid_amount=0,
                status='pending',
                is_auto_generated=True,
                generated_by=None 
            )
            generated_count += 1
            
        except Exception as e:
            logger.error(f"Error generating auto-bill for sub {sub.id}: {e}")
            
    logger.info(f"Monthly bill generation completed. Created: {generated_count}, Skipped: {skipped_count}")
