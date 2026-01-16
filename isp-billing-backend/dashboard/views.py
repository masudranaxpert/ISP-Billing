from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from customers.models import Customer, Zone
from mikrotik.models import Package, MikroTikRouter
from subscription.models import Subscription
from billing.models import Bill, Payment, AdvancePayment

from utils.permissions import IsAdminOrManager


@extend_schema(tags=['Dashboard'])
class DashboardOverviewView(APIView):
    """
    Complete dashboard overview with all statistics
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        today = timezone.now().date()
        current_month = today.month
        current_year = today.year
        
        # Customer Statistics
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(status='active').count()
        suspended_customers = Customer.objects.filter(status='suspended').count()
        inactive_customers = Customer.objects.filter(status='inactive').count()
        
        # Subscription Statistics
        total_subscriptions = Subscription.objects.count()
        active_subscriptions = Subscription.objects.filter(status='active').count()
        suspended_subscriptions = Subscription.objects.filter(status='suspended').count()
        
        # Package Statistics
        total_packages = Package.objects.filter(status='active').count()
        
        # Zone Statistics
        total_zones = Zone.objects.filter(status='active').count()
        
        # Router Statistics
        total_routers = MikroTikRouter.objects.count()
        online_routers = MikroTikRouter.objects.filter(is_online=True).count()
        offline_routers = total_routers - online_routers
        
        # Revenue Statistics (Current Month)
        current_month_bills = Bill.objects.filter(
            billing_month=current_month,
            billing_year=current_year
        ).aggregate(
            total_revenue=Sum('total_amount'),
            paid_amount=Sum('paid_amount'),
            due_amount=Sum('due_amount')
        )
        
        # Bill Statistics
        pending_bills = Bill.objects.filter(status='pending').count()
        paid_bills = Bill.objects.filter(status='paid').count()
        partial_bills = Bill.objects.filter(status='partial').count()
        
        # Payment Statistics (Current Month)
        current_month_payments = Payment.objects.filter(
            payment_date__month=current_month,
            payment_date__year=current_year,
            status='completed'
        ).aggregate(
            total_payments=Sum('amount'),
            payment_count=Count('id')
        )
        
        # Advance Balance
        advance_balance = AdvancePayment.objects.aggregate(
            total_balance=Sum('remaining_balance')
        )['total_balance'] or Decimal('0.00')
        
        # Recent Activity (Last 7 days)
        last_week = today - timedelta(days=7)
        new_customers_week = Customer.objects.filter(created_at__gte=last_week).count()
        new_subscriptions_week = Subscription.objects.filter(created_at__gte=last_week).count()
        
        # Growth Percentage (Compare with last month)
        last_month = current_month - 1 if current_month > 1 else 12
        last_month_year = current_year if current_month > 1 else current_year - 1
        
        last_month_revenue = Bill.objects.filter(
            billing_month=last_month,
            billing_year=last_month_year
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        current_revenue = current_month_bills['total_revenue'] or Decimal('0.00')
        
        if last_month_revenue > 0:
            revenue_growth = ((current_revenue - last_month_revenue) / last_month_revenue) * 100
        else:
            revenue_growth = 0
        
        data = {
            'overview': {
                'customers': {
                    'total': total_customers,
                    'active': active_customers,
                    'suspended': suspended_customers,
                    'inactive': inactive_customers,
                    'new_this_week': new_customers_week
                },
                'subscriptions': {
                    'total': total_subscriptions,
                    'active': active_subscriptions,
                    'suspended': suspended_subscriptions,
                    'new_this_week': new_subscriptions_week
                },
                'packages': {
                    'total': total_packages
                },
                'zones': {
                    'total': total_zones
                },
                'routers': {
                    'total': total_routers,
                    'online': online_routers,
                    'offline': offline_routers
                }
            },
            'revenue': {
                'current_month': {
                    'total': str(current_revenue),
                    'paid': str(current_month_bills['paid_amount'] or Decimal('0.00')),
                    'due': str(current_month_bills['due_amount'] or Decimal('0.00'))
                },
                'growth_percentage': round(float(revenue_growth), 2),
                'advance_balance': str(advance_balance)
            },
            'bills': {
                'pending': pending_bills,
                'paid': paid_bills,
                'partial': partial_bills,
                'total': pending_bills + paid_bills + partial_bills
            },
            'payments': {
                'current_month': {
                    'total_amount': str(current_month_payments['total_payments'] or Decimal('0.00')),
                    'count': current_month_payments['payment_count'] or 0
                }
            }
        }
        
        return Response(data)


@extend_schema(tags=['Dashboard'])
class QuickStatsView(APIView):
    """
    Quick statistics for dashboard cards
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        today = timezone.now().date()
        current_month = today.month
        current_year = today.year
        
        # Quick Stats
        stats = {
            'total_customers': Customer.objects.count(),
            'active_subscriptions': Subscription.objects.filter(status='active').count(),
            'monthly_revenue': str(
                Bill.objects.filter(
                    billing_month=current_month,
                    billing_year=current_year
                ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            ),
            'online_routers': MikroTikRouter.objects.filter(is_online=True).count(),
            'pending_bills': Bill.objects.filter(status='pending').count()
        }
        
        return Response(stats)


@extend_schema(tags=['Dashboard'])
class RecentActivityView(APIView):
    """
    Recent activity feed for dashboard
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        
        activities = []
        
        # Recent Payments
        recent_payments = Payment.objects.filter(
            status='completed'
        ).select_related('bill__subscription__customer').order_by('-payment_date')[:limit]
        
        for payment in recent_payments:
            activities.append({
                'type': 'payment',
                'icon': 'check-circle',
                'color': 'success',
                'message': f'Payment received from {payment.bill.subscription.customer.name}',
                'amount': str(payment.amount),
                'timestamp': payment.payment_date.isoformat(),
                'time_ago': self._get_time_ago(payment.payment_date)
            })
        
        # Recent Customers
        recent_customers = Customer.objects.order_by('-created_at')[:limit]
        
        for customer in recent_customers:
            activities.append({
                'type': 'customer',
                'icon': 'user-plus',
                'color': 'primary',
                'message': f'New customer added: {customer.name}',
                'customer_id': customer.customer_id,
                'timestamp': customer.created_at.isoformat(),
                'time_ago': self._get_time_ago(customer.created_at)
            })
        
        # Recent Pending Bills (replaced overdue as due_date was removed)
        recent_pending = Bill.objects.filter(
            status='pending'
        ).select_related('subscription__customer').order_by('-created_at')[:limit]
        
        for bill in recent_pending:
            activities.append({
                'type': 'pending',
                'icon': 'clock',
                'color': 'warning',
                'message': f'Pending bill: {bill.subscription.customer.name}',
                'bill_number': bill.bill_number,
                'amount': str(bill.due_amount),
                'timestamp': bill.created_at.isoformat(),
                'time_ago': self._get_time_ago(bill.created_at)
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(activities[:limit])
    
    def _get_time_ago(self, dt):
        """Calculate time ago string"""
        now = timezone.now()
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"


@extend_schema(tags=['Dashboard'])
class TopPackagesView(APIView):
    """
    Top packages by subscriber count
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 5))
        
        packages = Package.objects.annotate(
            subscriber_count=Count('subscriptions')
        ).order_by('-subscriber_count')[:limit]
        
        data = []
        for package in packages:
            data.append({
                'id': package.id,
                'name': package.name,
                'speed': package.speed_display,
                'price': str(package.price),
                'subscriber_count': package.subscriber_count,
                'revenue': str(
                    Bill.objects.filter(
                        subscription__package=package
                    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                )
            })
        
        return Response(data)


@extend_schema(tags=['Dashboard'])
class TopZonesView(APIView):
    """
    Top zones by customer count
    """
    permission_classes = [IsAdminOrManager]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 5))
        
        zones = Zone.objects.annotate(
            customer_count=Count('customers')
        ).order_by('-customer_count')[:limit]
        
        data = []
        for zone in zones:
            active_count = zone.customers.filter(status='active').count()
            data.append({
                'id': zone.id,
                'name': zone.name,
                'code': zone.code,
                'customer_count': zone.customer_count,
                'active_count': active_count,
                'revenue': str(
                    Bill.objects.filter(
                        subscription__customer__zone=zone
                    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
                )
            })
        
        return Response(data)
