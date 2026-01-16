from django.urls import path
from .views import (
    BillListView, BillCreateView, BillDetailView, GenerateMonthlyBillsView,
    PaymentListView, PaymentCreateView, PaymentDetailView,
    InvoiceListView, InvoiceCreateView, InvoiceDetailView,
    AdvancePaymentListView, AdvancePaymentCreateView, AdvancePaymentDetailView,
    DiscountListView, DiscountCreateView, DiscountDetailView,
    RefundListView, RefundCreateView, RefundDetailView,
    RefundApproveView, RefundRejectView, RefundCompleteView
)

app_name = 'billing'

urlpatterns = [
    # Bill endpoints
    path('bills/', BillListView.as_view(), name='bill_list'),
    path('bills/create/', BillCreateView.as_view(), name='bill_create'),
    path('bills/<int:pk>/', BillDetailView.as_view(), name='bill_detail'),
    path('bills/generate-monthly/', GenerateMonthlyBillsView.as_view(), name='bill_generate_monthly'),
    
    # Payment endpoints
    path('payments/', PaymentListView.as_view(), name='payment_list'),
    path('payments/create/', PaymentCreateView.as_view(), name='payment_create'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
    
    # Invoice endpoints
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/create/', InvoiceCreateView.as_view(), name='invoice_create'),
    path('invoices/<int:pk>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    
    # Advance Payment endpoints
    path('advance-payments/', AdvancePaymentListView.as_view(), name='advance_payment_list'),
    path('advance-payments/create/', AdvancePaymentCreateView.as_view(), name='advance_payment_create'),
    path('advance-payments/<int:pk>/', AdvancePaymentDetailView.as_view(), name='advance_payment_detail'),
    
    # Discount endpoints
    path('discounts/', DiscountListView.as_view(), name='discount_list'),
    path('discounts/create/', DiscountCreateView.as_view(), name='discount_create'),
    path('discounts/<int:pk>/', DiscountDetailView.as_view(), name='discount_detail'),
    
    # Refund endpoints
    path('refunds/', RefundListView.as_view(), name='refund_list'),
    path('refunds/create/', RefundCreateView.as_view(), name='refund_create'),
    path('refunds/<int:pk>/', RefundDetailView.as_view(), name='refund_detail'),
    path('refunds/<int:pk>/approve/', RefundApproveView.as_view(), name='refund_approve'),
    path('refunds/<int:pk>/reject/', RefundRejectView.as_view(), name='refund_reject'),
    path('refunds/<int:pk>/complete/', RefundCompleteView.as_view(), name='refund_complete'),
]
