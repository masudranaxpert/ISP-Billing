from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from subscription.models import Subscription
from accounts.models import User


class Bill(models.Model):
    """
    Monthly bill model for subscriptions
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    
    # Bill ID (auto-generated)
    bill_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Subscription
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='bills'
    )
    
    # Billing Period
    billing_month = models.IntegerField(help_text='Month (1-12)')
    billing_year = models.IntegerField(help_text='Year (e.g., 2026)')
    billing_date = models.DateField(help_text='Bill generation date')
    
    # Amounts
    package_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Package monthly price'
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Discount amount'
    )
    other_charges = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Other charges (e.g., router rent)'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Total bill amount'
    )
    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Amount paid'
    )
    due_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Amount due'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    is_auto_generated = models.BooleanField(default=True)
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_bills'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bills'
        verbose_name = 'Bill'
        verbose_name_plural = 'Bills'
        ordering = ['-billing_year', '-billing_month']
        unique_together = ['subscription', 'billing_month', 'billing_year']
        indexes = [
            models.Index(fields=['subscription']),
            models.Index(fields=['status']),
            models.Index(fields=['billing_year', 'billing_month']),
        ]
    
    def __str__(self):
        return f"{self.bill_number} - {self.subscription.customer.customer_id} ({self.billing_month}/{self.billing_year})"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate bill_number and calculate amounts
        """
        if not self.bill_number:
            # Generate bill number: BILL-YYYY-MM-XXXX
            from django.utils import timezone
            year = self.billing_year
            month = self.billing_month
            
            # Get last bill number for this month
            last_bill = Bill.objects.filter(
                bill_number__startswith=f'BILL-{year}-{month:02d}-'
            ).order_by('-bill_number').first()
            
            if last_bill:
                # Extract number and increment
                last_number = int(last_bill.bill_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.bill_number = f'BILL-{year}-{month:02d}-{new_number:04d}'
        
        # Ensure all amounts are Decimal type
        from decimal import Decimal
        self.package_price = Decimal(str(self.package_price)) if self.package_price else Decimal('0.00')
        self.other_charges = Decimal(str(self.other_charges)) if self.other_charges else Decimal('0.00')
        self.discount = Decimal(str(self.discount)) if self.discount else Decimal('0.00')
        self.paid_amount = Decimal(str(self.paid_amount)) if self.paid_amount else Decimal('0.00')
        
        # Calculate total amount
        self.total_amount = (
            self.package_price + 
            self.other_charges - 
            self.discount
        )
        
        # Calculate due amount
        self.due_amount = self.total_amount - self.paid_amount
        
        # Update status based on payment
        if self.paid_amount >= self.total_amount:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partial'
        
        super().save(*args, **kwargs)
    
    @property
    def is_paid(self):
        """Check if bill is fully paid"""
        return self.status == 'paid'



class Payment(models.Model):
    """
    Payment model for bill payments
    """
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
        ('card', 'Card'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    # Payment ID (auto-generated)
    payment_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Bill
    bill = models.ForeignKey(
        Bill,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    # Payment Details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField()
    
    # Transaction Details
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    reference_number = models.CharField(max_length=100, blank=True, null=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='completed'
    )
    
    # Notes
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['bill']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.payment_number} - {self.amount} BDT ({self.payment_method})"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate payment_number and update bill
        """
        if not self.payment_number:
            # Generate payment number: PAY-YYYY-XXXX
            from django.utils import timezone
            year = timezone.now().year
            
            # Get last payment number for this year
            last_payment = Payment.objects.filter(
                payment_number__startswith=f'PAY-{year}-'
            ).order_by('-payment_number').first()
            
            if last_payment:
                # Extract number and increment
                last_number = int(last_payment.payment_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.payment_number = f'PAY-{year}-{new_number:04d}'
        
        super().save(*args, **kwargs)
        
        # Update bill paid amount and status
        if self.status == 'completed':
            self.bill.paid_amount += self.amount
            self.bill.save()


class Invoice(models.Model):
    """
    Invoice model for bill invoices
    """
    # Invoice ID (auto-generated)
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Bill
    bill = models.OneToOneField(
        Bill,
        on_delete=models.CASCADE,
        related_name='invoice'
    )
    
    # Invoice Details
    issue_date = models.DateField()
    
    # PDF
    pdf_file = models.FileField(
        upload_to='invoices/',
        blank=True,
        null=True,
        help_text='Generated PDF invoice'
    )
    
    # Metadata
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_invoices'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.bill.bill_number}"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate invoice_number
        """
        if not self.invoice_number:
            # Generate invoice number: INV-YYYY-XXXX
            from django.utils import timezone
            year = timezone.now().year
            
            # Get last invoice number for this year
            last_invoice = Invoice.objects.filter(
                invoice_number__startswith=f'INV-{year}-'
            ).order_by('-invoice_number').first()
            
            if last_invoice:
                # Extract number and increment
                last_number = int(last_invoice.invoice_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.invoice_number = f'INV-{year}-{new_number:04d}'
        
        super().save(*args, **kwargs)


class AdvancePayment(models.Model):
    """
    Advance payment model for customer wallet/balance
    """
    PAYMENT_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
        ('card', 'Card'),
        ('other', 'Other'),
    )
    
    # Advance Payment ID
    advance_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Subscription
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='advance_payments'
    )
    
    # Payment Details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_date = models.DateTimeField()
    
    # Advance Details
    months_covered = models.IntegerField(
        default=1,
        help_text='Number of months paid in advance'
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text='Discount percentage for advance payment'
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Discount amount applied'
    )
    
    # Balance Tracking
    used_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Amount already used from advance'
    )
    remaining_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Remaining advance balance'
    )
    
    # Transaction Details
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Metadata
    received_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='received_advance_payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'advance_payments'
        verbose_name = 'Advance Payment'
        verbose_name_plural = 'Advance Payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.advance_number} - {self.amount} BDT ({self.months_covered} months)"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate advance_number and calculate balance
        """
        if not self.advance_number:
            from django.utils import timezone
            year = timezone.now().year
            
            last_advance = AdvancePayment.objects.filter(
                advance_number__startswith=f'ADV-{year}-'
            ).order_by('-advance_number').first()
            
            if last_advance:
                last_number = int(last_advance.advance_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.advance_number = f'ADV-{year}-{new_number:04d}'
        
        # Calculate remaining balance
        self.remaining_balance = self.amount - self.used_amount
        
        super().save(*args, **kwargs)


class Discount(models.Model):
    """
    Discount model for promotional and customer-specific discounts
    """
    DISCOUNT_TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('flat', 'Flat Amount'),
    )
    
    APPLY_TO_CHOICES = (
        ('package', 'Package'),
        ('customer', 'Customer'),
        ('promotional', 'Promotional'),
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    # Discount Type
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Percentage (e.g., 10.00) or Flat amount (e.g., 100.00)'
    )
    
    # Apply To
    apply_to = models.CharField(max_length=20, choices=APPLY_TO_CHOICES)
    
    # Validity
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Usage Limit
    max_uses = models.IntegerField(
        null=True,
        blank=True,
        help_text='Maximum number of times this discount can be used'
    )
    current_uses = models.IntegerField(default=0)
    
    # Metadata
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_discounts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'discounts'
        verbose_name = 'Discount'
        verbose_name_plural = 'Discounts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.discount_value}{'%' if self.discount_type == 'percentage' else ' BDT'}"
    
    @property
    def is_valid(self):
        """Check if discount is currently valid"""
        from django.utils import timezone
        now = timezone.now().date()
        
        if not self.is_active:
            return False
        
        if now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        if self.max_uses and self.current_uses >= self.max_uses:
            return False
        
        return True


class Refund(models.Model):
    """
    Refund model for connection close/discontinue
    """
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    
    REFUND_METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('bkash', 'bKash'),
        ('nagad', 'Nagad'),
        ('rocket', 'Rocket'),
        ('bank', 'Bank Transfer'),
        ('other', 'Other'),
    )
    
    # Refund ID
    refund_number = models.CharField(max_length=50, unique=True, editable=False)
    
    # Subscription
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    
    # Refund Details
    refund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Total refund amount'
    )
    advance_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Remaining advance balance'
    )
    other_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text='Other refundable amount'
    )
    
    # Refund Method
    refund_method = models.CharField(
        max_length=20,
        choices=REFUND_METHOD_CHOICES,
        blank=True,
        null=True
    )
    refund_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    # Request & Approval
    request_reason = models.TextField()
    approval_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Transaction Details
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Metadata
    requested_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_refunds'
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_refunds'
    )
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'refunds'
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.refund_number} - {self.refund_amount} BDT ({self.status})"
    
    def save(self, *args, **kwargs):
        """
        Override save to auto-generate refund_number
        """
        if not self.refund_number:
            from django.utils import timezone
            year = timezone.now().year
            
            last_refund = Refund.objects.filter(
                refund_number__startswith=f'REF-{year}-'
            ).order_by('-refund_number').first()
            
            if last_refund:
                last_number = int(last_refund.refund_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.refund_number = f'REF-{year}-{new_number:04d}'
        
        super().save(*args, **kwargs)
