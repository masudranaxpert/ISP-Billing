"""
Signals for billing app to handle auto re-enable on payment
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment
from mikrotik.services import MikroTikService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Payment)
def auto_enable_on_payment(sender, instance, created, **kwargs):
    """
    Automatically enable subscription in MikroTik when payment is made
    """
    if created and instance.status == 'completed':
        try:
            subscription = instance.bill.subscription
            
            # Check if subscription is suspended and has router
            if subscription.status == 'suspended' and subscription.router:
                # Check if bill is now paid
                if instance.bill.status == 'paid':
                    # Enable in MikroTik
                    service = MikroTikService(subscription.router)
                    success, message = service.enable_pppoe_user(subscription.mikrotik_username)
                    
                    if success:
                        # Update subscription status to active
                        subscription.status = 'active'
                        subscription.save()
                        
                        logger.info(
                            f"Auto-enabled subscription {subscription.id} "
                            f"(Customer: {subscription.customer.customer_id}) after payment"
                        )
                    else:
                        logger.error(
                            f"Failed to enable subscription {subscription.id} in MikroTik: {message}"
                        )
                        
        except Exception as e:
            logger.error(f"Error in auto_enable_on_payment signal: {e}")
