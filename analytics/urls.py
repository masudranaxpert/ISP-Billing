from django.urls import path
from .views import (
    DashboardStatsView, RevenueStatsView, MonthlyRevenueView,
    PackageStatsView, ZoneStatsView, PaymentMethodStatsView,
    CustomerGrowthView, OverdueReportView
)

app_name = 'analytics'

urlpatterns = [
    # Dashboard & Stats
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('revenue/', RevenueStatsView.as_view(), name='revenue_stats'),
    
    # Reports
    path('monthly-revenue/', MonthlyRevenueView.as_view(), name='monthly_revenue'),
    path('package-stats/', PackageStatsView.as_view(), name='package_stats'),
    path('zone-stats/', ZoneStatsView.as_view(), name='zone_stats'),
    path('payment-methods/', PaymentMethodStatsView.as_view(), name='payment_method_stats'),
    path('customer-growth/', CustomerGrowthView.as_view(), name='customer_growth'),
    path('overdue-report/', OverdueReportView.as_view(), name='overdue_report'),
]
