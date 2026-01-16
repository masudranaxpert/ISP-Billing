from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import calendar

from customers.models import Customer, Zone
from mikrotik.models import Package, MikroTikRouter
from subscription.models import Subscription
from billing.models import Bill, Payment, AdvancePayment, Refund

from .serializers import (
    DashboardStatsSerializer, RevenueStatsSerializer,
    MonthlyRevenueSerializer, PackageStatsSerializer,
    ZoneStatsSerializer, PaymentMethodStatsSerializer,
    CustomerGrowthSerializer, OverdueReportSerializer
)
from utils.permissions import IsAdminOrManager


@extend_schema(tags=['Analytics'])
class DashboardStatsView(APIView):
    """
    API endpoint for dashboard statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        # Customer stats
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        suspended_customers = Customer.objects.filter(status='suspended').count()
        
        # Subscription stats
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        
        # Package stats
        total_packages = Package.objects.count()
        
        # Zone stats
        total_zones = Zone.objects.count()
        
        # Router stats
        total_routers = MikroTikRouter.objects.count()
        online_routers = MikroTikRouter.objects.filter(is_online=True).count()
        
        data = {
            'total_customers': total_customers,
            'active_customers': active_customers,
            'suspended_customers': suspended_customers,
            'total_subscriptions': total_subscriptions,
            'active_subscriptions': active_subscriptions,
            'total_packages': total_packages,
            'total_zones': total_zones,
            'total_routers': total_routers,
            'online_routers': online_routers,
        }
        
        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class RevenueStatsView(APIView):
    """
    API endpoint for revenue statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        # Bill stats
        bill_stats = Bill.objects.aggregate(
            total_revenue=Sum('total_amount'),
            paid_amount=Sum('paid_amount'),
            due_amount=Sum('due_amount')
        )
        
        # Advance balance
        advance_stats = AdvancePayment.objects.aggregate(
            advance_balance=Sum('remaining_balance')
        )
        
        # Bill counts
        pending_bills = Bill.objects.filter(status='pending').count()
        paid_bills = Bill.objects.filter(status='paid').count()
        overdue_bills = Bill.objects.filter(status='overdue').count()
        
        # Payment count
        total_payments = Payment.objects.filter(status='completed').count()
        
        # Refund total
        refund_stats = Refund.objects.filter(status='completed').aggregate(
            total_refunds=Sum('refund_amount')
        )
        
        data = {
            'total_revenue': bill_stats['total_revenue'] or Decimal('0.00'),
            'paid_amount': bill_stats['paid_amount'] or Decimal('0.00'),
            'due_amount': bill_stats['due_amount'] or Decimal('0.00'),
            'advance_balance': advance_stats['advance_balance'] or Decimal('0.00'),
            'pending_bills': pending_bills,
            'paid_bills': paid_bills,
            'overdue_bills': overdue_bills,
            'total_payments': total_payments,
            'total_refunds': refund_stats['total_refunds'] or Decimal('0.00'),
        }
        
        serializer = RevenueStatsSerializer(data)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class MonthlyRevenueView(APIView):
    """
    API endpoint for monthly revenue data (last 12 months)
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        today = timezone.now().date()
        months_data = []
        
        # Get last 12 months
        for i in range(11, -1, -1):
            # Calculate month and year
            target_date = today - timedelta(days=30 * i)
            month = target_date.month
            year = target_date.year
            
            # Get bills for this month
            bills = Bill.objects.filter(
                billing_month=month,
                billing_year=year
            ).aggregate(
                total_billed=Sum('total_amount'),
                total_paid=Sum('paid_amount'),
                total_due=Sum('due_amount'),
                bill_count=Count('id')
            )
            
            months_data.append({
                'month': month,
                'year': year,
                'month_name': calendar.month_name[month],
                'total_billed': bills['total_billed'] or Decimal('0.00'),
                'total_paid': bills['total_paid'] or Decimal('0.00'),
                'total_due': bills['total_due'] or Decimal('0.00'),
                'bill_count': bills['bill_count'] or 0,
            })
        
        serializer = MonthlyRevenueSerializer(months_data, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class PackageStatsView(APIView):
    """
    API endpoint for package-wise statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        packages = Package.objects.all()
        package_stats = []
        
        for package in packages:
            # Get subscriptions for this package
            subscriptions = Subscription.objects.filter(package=package)
            subscriber_count = subscriptions.count()
            active_count = subscriptions.filter(status='active').count()
            
            # Get revenue from bills
            revenue = Bill.objects.filter(
                subscription__package=package
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            package_stats.append({
                'package_id': package.id,
                'package_name': package.name,
                'subscriber_count': subscriber_count,
                'active_count': active_count,
                'revenue': revenue,
            })
        
        serializer = PackageStatsSerializer(package_stats, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class ZoneStatsView(APIView):
    """
    API endpoint for zone-wise statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        zones = Zone.objects.all()
        zone_stats = []
        
        for zone in zones:
            # Get customers in this zone
            customers = Customer.objects.filter(zone=zone)
            customer_count = customers.count()
            active_count = customers.filter(status='active').count()
            
            # Get revenue from bills
            revenue = Bill.objects.filter(
                subscription__customer__zone=zone
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            zone_stats.append({
                'zone_id': zone.id,
                'zone_name': zone.name,
                'customer_count': customer_count,
                'active_count': active_count,
                'revenue': revenue,
            })
        
        serializer = ZoneStatsSerializer(zone_stats, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class PaymentMethodStatsView(APIView):
    """
    API endpoint for payment method statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        # Get payment method choices
        payment_methods = Payment.PAYMENT_METHOD_CHOICES
        method_stats = []
        
        for method_code, method_name in payment_methods:
            stats = Payment.objects.filter(
                payment_method=method_code,
                status='completed'
            ).aggregate(
                count=Count('id'),
                total_amount=Sum('amount')
            )
            
            if stats['count'] and stats['count'] > 0:
                method_stats.append({
                    'payment_method': method_code,
                    'payment_method_display': method_name,
                    'count': stats['count'],
                    'total_amount': stats['total_amount'] or Decimal('0.00'),
                })
        
        serializer = PaymentMethodStatsSerializer(method_stats, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class CustomerGrowthView(APIView):
    """
    API endpoint for customer growth data (last 12 months)
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        today = timezone.now().date()
        growth_data = []
        
        # Get last 12 months
        for i in range(11, -1, -1):
            # Calculate month and year
            target_date = today - timedelta(days=30 * i)
            month = target_date.month
            year = target_date.year
            
            # Get customers created in this month
            month_start = datetime(year, month, 1).date()
            if month == 12:
                month_end = datetime(year + 1, 1, 1).date()
            else:
                month_end = datetime(year, month + 1, 1).date()
            
            new_customers = Customer.objects.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            
            # Total customers up to this month
            total_customers = Customer.objects.filter(
                created_at__lt=month_end
            ).count()
            
            growth_data.append({
                'month': month,
                'year': year,
                'month_name': calendar.month_name[month],
                'new_customers': new_customers,
                'total_customers': total_customers,
            })
        
        serializer = CustomerGrowthSerializer(growth_data, many=True)
        return Response(serializer.data)


@extend_schema(tags=['Analytics'])
class OverdueReportView(APIView):
    """
    API endpoint for overdue bills report
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        today = timezone.now().date()
        
        # Get overdue bills
        overdue_bills = Bill.objects.filter(
            status__in=['pending', 'partial', 'overdue'],
            due_date__lt=today
        ).select_related('subscription__customer', 'subscription__package').order_by('due_date')
        
        report_data = []
        for bill in overdue_bills:
            days_overdue = (today - bill.due_date).days
            
            report_data.append({
                'bill_number': bill.bill_number,
                'customer_id': bill.subscription.customer.customer_id,
                'customer_name': bill.subscription.customer.name,
                'package_name': bill.subscription.package.name,
                'billing_date': bill.billing_date,
                'due_date': bill.due_date,
                'total_amount': bill.total_amount,
                'paid_amount': bill.paid_amount,
                'due_amount': bill.due_amount,
                'days_overdue': days_overdue,
            })
        
        serializer = OverdueReportSerializer(report_data, many=True)
        return Response(serializer.data)
