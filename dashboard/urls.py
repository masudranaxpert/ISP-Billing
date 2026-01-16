from django.urls import path
from .views import (
    DashboardOverviewView, QuickStatsView, RecentActivityView,
    TopPackagesView, TopZonesView
)

app_name = 'dashboard'

urlpatterns = [
    # Dashboard Overview
    path('overview/', DashboardOverviewView.as_view(), name='dashboard_overview'),
    path('quick-stats/', QuickStatsView.as_view(), name='quick_stats'),
    path('recent-activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('top-packages/', TopPackagesView.as_view(), name='top_packages'),
    path('top-zones/', TopZonesView.as_view(), name='top_zones'),
]
