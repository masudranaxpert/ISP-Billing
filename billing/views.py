from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Bill, Payment, Invoice, AdvancePayment, Discount, Refund
from .serializers import (
    BillSerializer, BillCreateSerializer,
    PaymentSerializer, PaymentCreateSerializer,
    InvoiceSerializer, AdvancePaymentSerializer, AdvancePaymentCreateSerializer,
    DiscountSerializer, RefundSerializer, RefundCreateSerializer
)
from utils.permissions import IsAdminOrManager, IsAdmin
from subscription.models import Subscription



# ==================== Bill Views ====================

@extend_schema(tags=['Billing'])
class BillListView(generics.ListAPIView):
    """
    API endpoint to list all bills
    """
    queryset = Bill.objects.select_related('subscription__customer', 'subscription__package').all()
    serializer_class = BillSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'subscription', 'billing_year', 'billing_month']
    search_fields = ['bill_number', 'subscription__customer__customer_id', 'subscription__customer__name']
    ordering_fields = ['billing_date', 'total_amount', 'created_at']
    ordering = ['-billing_year', '-billing_month']


@extend_schema(tags=['Billing'])
class BillCreateView(generics.CreateAPIView):
    """
    API endpoint to create manual bill
    """
    queryset = Bill.objects.all()
    serializer_class = BillCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set generated_by
        bill = serializer.save(
            is_auto_generated=False,
            generated_by=request.user
        )
        
        return Response({
            'message': 'Bill created successfully',
            'bill': BillSerializer(bill).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class BillDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to get, update, or delete bill
    """
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Billing'])
class GenerateMonthlyBillsView(APIView):
    """
    Generate monthly bills for all active subscriptions
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request):
        year = request.data.get('year')
        month = request.data.get('month')
        
        if not year or not month:
            return Response({'error': 'Year and month are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response({'error': 'Invalid year or month'}, status=status.HTTP_400_BAD_REQUEST)
            
        active_subscriptions = Subscription.objects.filter(status='active')
        generated_count = 0
        skipped_count = 0
        errors = []
        
        for sub in active_subscriptions:
            try:
                # Check if bill exists
                if Bill.objects.filter(subscription=sub, billing_year=year, billing_month=month).exists():
                    skipped_count += 1
                    continue
                    
                amount = sub.package.price

                Bill.objects.create(
                    subscription=sub,
                    billing_month=month,
                    billing_year=year,
                    billing_date=timezone.now().date(),
                    package_price=amount,
                    total_amount=amount,
                    due_amount=amount,
                    paid_amount=0,
                    status='pending',
                    is_auto_generated=True,
                    generated_by=request.user
                )
                generated_count += 1
            except Exception as e:
                errors.append(f"Sub {sub.id}: {str(e)}")
            
        return Response({
            'message': f'Generated {generated_count} bills, skipped {skipped_count} existing bills.',
            'generated_count': generated_count,
            'skipped_count': skipped_count,
            'errors': errors
        })


# ==================== Payment Views ====================

@extend_schema(tags=['Billing'])
class PaymentListView(generics.ListAPIView):
    """
    API endpoint to list all payments
    """
    queryset = Payment.objects.select_related('bill', 'received_by').all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'bill']
    search_fields = ['payment_number', 'transaction_id', 'reference_number']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']


@extend_schema(tags=['Billing'])
class PaymentCreateView(generics.CreateAPIView):
    """
    API endpoint to record payment
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set received_by
        payment = serializer.save(received_by=request.user)
        
        return Response({
            'message': 'Payment recorded successfully',
            'payment': PaymentSerializer(payment).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class PaymentDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get payment details
    """
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminOrManager]


# ==================== Invoice Views ====================

@extend_schema(tags=['Billing'])
class InvoiceListView(generics.ListAPIView):
    """
    API endpoint to list all invoices
    """
    queryset = Invoice.objects.select_related('bill').all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['bill']
    ordering_fields = ['issue_date', 'created_at']
    ordering = ['-created_at']


@extend_schema(tags=['Billing'])
class InvoiceCreateView(generics.CreateAPIView):
    """
    API endpoint to generate invoice
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set generated_by
        invoice = serializer.save(generated_by=request.user)
        
        return Response({
            'message': 'Invoice generated successfully',
            'invoice': InvoiceSerializer(invoice).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class InvoiceDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get invoice details
    """
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAdminOrManager]


# ==================== Advance Payment Views ====================

@extend_schema(tags=['Billing'])
class AdvancePaymentListView(generics.ListAPIView):
    """
    API endpoint to list all advance payments
    """
    queryset = AdvancePayment.objects.select_related('subscription__customer').all()
    serializer_class = AdvancePaymentSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['subscription', 'payment_method']
    ordering_fields = ['payment_date', 'amount', 'remaining_balance']
    ordering = ['-payment_date']


@extend_schema(tags=['Billing'])
class AdvancePaymentCreateView(generics.CreateAPIView):
    """
    API endpoint to record advance payment
    """
    queryset = AdvancePayment.objects.all()
    serializer_class = AdvancePaymentCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set received_by
        advance = serializer.save(received_by=request.user)
        
        return Response({
            'message': 'Advance payment recorded successfully',
            'advance_payment': AdvancePaymentSerializer(advance).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class AdvancePaymentDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get advance payment details
    """
    queryset = AdvancePayment.objects.all()
    serializer_class = AdvancePaymentSerializer
    permission_classes = [IsAdminOrManager]


# ==================== Discount Views ====================

@extend_schema(tags=['Billing'])
class DiscountListView(generics.ListAPIView):
    """
    API endpoint to list all discounts
    """
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['discount_type', 'apply_to', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']
    ordering = ['-created_at']


@extend_schema(tags=['Billing'])
class DiscountCreateView(generics.CreateAPIView):
    """
    API endpoint to create discount
    """
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [IsAdmin]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set created_by
        discount = serializer.save(created_by=request.user)
        
        return Response({
            'message': 'Discount created successfully',
            'discount': DiscountSerializer(discount).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class DiscountDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to get, update, or delete discount
    """
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    permission_classes = [IsAdmin]


# ==================== Refund Views ====================

@extend_schema(tags=['Billing'])
class RefundListView(generics.ListAPIView):
    """
    API endpoint to list all refunds
    """
    queryset = Refund.objects.select_related('subscription__customer').all()
    serializer_class = RefundSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'subscription']
    ordering_fields = ['created_at', 'refund_date']
    ordering = ['-created_at']


@extend_schema(tags=['Billing'])
class RefundCreateView(generics.CreateAPIView):
    """
    API endpoint to create refund request
    """
    queryset = Refund.objects.all()
    serializer_class = RefundCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set requested_by
        refund = serializer.save(requested_by=request.user)
        
        return Response({
            'message': 'Refund request created successfully',
            'refund': RefundSerializer(refund).data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Billing'])
class RefundDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get refund details
    """
    queryset = Refund.objects.all()
    serializer_class = RefundSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Billing'])
class RefundApproveView(APIView):
    """
    API endpoint to approve refund
    """
    permission_classes = [IsAdmin]
    
    def post(self, request, pk):
        try:
            refund = Refund.objects.get(pk=pk)
        except Refund.DoesNotExist:
            return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if refund.status != 'pending':
            return Response({'error': 'Only pending refunds can be approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update refund
        refund.status = 'approved'
        refund.approved_by = request.user
        refund.approval_notes = request.data.get('notes', '')
        refund.save()
        
        return Response({
            'message': 'Refund approved successfully',
            'refund': RefundSerializer(refund).data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Billing'])
class RefundRejectView(APIView):
    """
    API endpoint to reject refund
    """
    permission_classes = [IsAdmin]
    
    def post(self, request, pk):
        try:
            refund = Refund.objects.get(pk=pk)
        except Refund.DoesNotExist:
            return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if refund.status != 'pending':
            return Response({'error': 'Only pending refunds can be rejected'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update refund
        refund.status = 'rejected'
        refund.approved_by = request.user
        refund.rejection_reason = request.data.get('reason', '')
        refund.save()
        
        return Response({
            'message': 'Refund rejected',
            'refund': RefundSerializer(refund).data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Billing'])
class RefundCompleteView(APIView):
    """
    API endpoint to complete refund (mark as paid)
    """
    permission_classes = [IsAdmin]
    
    def post(self, request, pk):
        try:
            refund = Refund.objects.get(pk=pk)
        except Refund.DoesNotExist:
            return Response({'error': 'Refund not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if refund.status != 'approved':
            return Response({'error': 'Only approved refunds can be completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update refund
        refund.status = 'completed'
        refund.processed_by = request.user
        refund.refund_method = request.data.get('refund_method')
        refund.refund_date = timezone.now()
        refund.transaction_id = request.data.get('transaction_id', '')
        refund.save()
        
        return Response({
            'message': 'Refund completed successfully',
            'refund': RefundSerializer(refund).data
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Billing'])
class BillAddPaymentView(APIView):
    """
    API endpoint to add payment to a specific bill
    """
    permission_classes = [IsAdminOrManager]
    
    def post(self, request, pk):
        try:
            bill = Bill.objects.get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if bill is already fully paid
        if bill.status == 'paid':
            return Response({'error': 'Bill is already fully paid'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare payment data
        payment_data = {
            'bill': bill.id,
            'amount': request.data.get('amount'),
            'payment_method': request.data.get('payment_method'),
            'payment_date': request.data.get('payment_date', timezone.now()),
            'transaction_id': request.data.get('transaction_id', ''),
            'reference_number': request.data.get('reference_number', ''),
            'notes': request.data.get('notes', ''),
            'status': 'completed'
        }
        
        # Validate payment amount
        amount = Decimal(str(payment_data['amount']))
        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount > bill.due_amount:
            return Response({
                'error': f'Payment amount (৳{amount}) cannot exceed due amount (৳{bill.due_amount})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment
        serializer = PaymentCreateSerializer(data=payment_data)
        if serializer.is_valid():
            payment = serializer.save(received_by=request.user)
            
            # Refresh bill to get updated amounts
            bill.refresh_from_db()
            
            return Response({
                'message': 'Payment added successfully',
                'payment': PaymentSerializer(payment).data,
                'bill': BillSerializer(bill).data
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
