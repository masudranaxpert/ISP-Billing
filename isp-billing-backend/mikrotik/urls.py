from django.urls import path
from .views import (
    PackageListView, PackageCreateView, PackageDetailView,
    PackageUpdateView, PackageDeleteView,
    MikroTikRouterListView, MikroTikRouterCreateView, MikroTikRouterDetailView,
    MikroTikRouterTestConnectionView, MikroTikRouterProfilesView,
    SyncPackageToRouterView,
    MikroTikQueueProfileListView, MikroTikSyncLogListView
)

app_name = 'mikrotik'

urlpatterns = [
    # Package endpoints
    path('packages/', PackageListView.as_view(), name='package_list'),
    path('packages/create/', PackageCreateView.as_view(), name='package_create'),
    path('packages/<int:pk>/', PackageDetailView.as_view(), name='package_detail'),
    path('packages/<int:pk>/update/', PackageUpdateView.as_view(), name='package_update'),
    path('packages/<int:pk>/delete/', PackageDeleteView.as_view(), name='package_delete'),
    
    # MikroTik Router endpoints
    path('routers/', MikroTikRouterListView.as_view(), name='router_list'),
    path('routers/create/', MikroTikRouterCreateView.as_view(), name='router_create'),
    path('routers/<int:pk>/', MikroTikRouterDetailView.as_view(), name='router_detail'),
    path('routers/<int:pk>/test/', MikroTikRouterTestConnectionView.as_view(), name='router_test'),
    path('routers/<int:pk>/profiles/', MikroTikRouterProfilesView.as_view(), name='router_profiles'),
    
    # Queue Profile Sync endpoints
    path('sync/package/<int:package_id>/router/<int:router_id>/', SyncPackageToRouterView.as_view(), name='sync_package'),
    path('queue-profiles/', MikroTikQueueProfileListView.as_view(), name='queue_profile_list'),
    
    # Sync Logs
    path('sync-logs/', MikroTikSyncLogListView.as_view(), name='sync_log_list'),
]
