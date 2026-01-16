"""
Auto Billing Service for ISP Billing System
Generates monthly bills for active subscriptions
"""
import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_billing.settings')
django.setup()

from django.utils import timezone
from subscription.models import Subscription
from billing.models import Bill, AdvancePayment
from mikrotik.models import Package


def generate_monthly_bills():
    """
    Generate bills for all active subscriptions based on their billing day
    """
    print("\n💰 Auto Billing Service - ISP Billing System")
    print("=" * 60)
    
    today = timezone.now().date()
    current_month = today.month
    current_year = today.year
    current_day = today.day
    
    print(f"📅 Date: {today.strftime('%d %B %Y')}")
    print(f"🔍 Checking subscriptions with billing day: {current_day}")
    print("-" * 60)
    
    # Get active subscriptions with billing day matching today
    subscriptions = Subscription.objects.filter(
        status='active',
        billing_day=current_day
    ).select_related('customer', 'package')
    
    total_subscriptions = subscriptions.count()
    print(f"📊 Found {total_subscriptions} subscription(s) to bill")
    print()
    
    if total_subscriptions == 0:
        print("✅ No subscriptions to bill today")
        return
    
    bills_created = 0
    bills_skipped = 0
    errors = 0
    
    for subscription in subscriptions:
        try:
            # Check if bill already exists for this month
            existing_bill = Bill.objects.filter(
                subscription=subscription,
                billing_month=current_month,
                billing_year=current_year
            ).first()
            
            if existing_bill:
                print(f"⏭️  Skipped: {subscription.customer.customer_id} - Bill already exists ({existing_bill.bill_number})")
                bills_skipped += 1
                continue
            
            # Calculate due date (7 days from billing date)
            due_date = today + timedelta(days=7)
            
            # Get package price
            package_price = subscription.package.price
            
            # Check for advance payment
            advance_payment = AdvancePayment.objects.filter(
                subscription=subscription,
                remaining_balance__gt=0
            ).first()
            
            discount_amount = Decimal('0.00')
            paid_amount = Decimal('0.00')
            
            # Auto deduct from advance if available
            if advance_payment and advance_payment.remaining_balance >= package_price:
                # Deduct from advance
                advance_payment.used_amount += package_price
                advance_payment.save()
                
                paid_amount = package_price
                print(f"💳 Advance deducted for {subscription.customer.customer_id}: {package_price} BDT")
            
            # Create bill
            bill = Bill.objects.create(
                subscription=subscription,
                billing_month=current_month,
                billing_year=current_year,
                billing_date=today,
                due_date=due_date,
                package_price=package_price,
                discount=discount_amount,
                other_charges=Decimal('0.00'),
                paid_amount=paid_amount,
                is_auto_generated=True,
                generated_by=None
            )
            
            print(f"✅ Created: {bill.bill_number} - {subscription.customer.customer_id} ({subscription.customer.name})")
            print(f"   Package: {subscription.package.name} - {package_price} BDT")
            print(f"   Due Date: {due_date.strftime('%d %B %Y')}")
            if paid_amount > 0:
                print(f"   Status: PAID (from advance)")
            else:
                print(f"   Status: PENDING")
            print()
            
            bills_created += 1
            
        except Exception as e:
            print(f"❌ Error for {subscription.customer.customer_id}: {str(e)}")
            errors += 1
            continue
    
    # Summary
    print("=" * 60)
    print("📈 SUMMARY")
    print("-" * 60)
    print(f"✅ Bills Created: {bills_created}")
    print(f"⏭️  Bills Skipped: {bills_skipped}")
    print(f"❌ Errors: {errors}")
    print(f"📊 Total Processed: {total_subscriptions}")
    print("=" * 60)
    print()


def check_overdue_bills():
    """
    Check for overdue bills and update status
    """
    print("\n⚠️  Checking Overdue Bills")
    print("-" * 60)
    
    today = timezone.now().date()
    
    # Get pending/partial bills past due date
    overdue_bills = Bill.objects.filter(
        status__in=['pending', 'partial'],
        due_date__lt=today
    ).select_related('subscription__customer')
    
    count = overdue_bills.count()
    print(f"Found {count} overdue bill(s)")
    
    if count == 0:
        print("✅ No overdue bills")
        return
    
    updated = 0
    for bill in overdue_bills:
        bill.status = 'overdue'
        bill.save()
        print(f"⚠️  Marked overdue: {bill.bill_number} - {bill.subscription.customer.customer_id}")
        updated += 1
    
    print(f"\n✅ Updated {updated} bill(s) to overdue status")
    print()


def main():
    """
    Main execution function
    """
    try:
        # Generate monthly bills
        generate_monthly_bills()
        
        # Check overdue bills
        check_overdue_bills()
        
        print("✅ Auto Billing Service completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Fatal Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
