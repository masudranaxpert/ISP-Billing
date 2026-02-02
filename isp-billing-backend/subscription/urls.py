from django.urls import path
from .views import (
    SubscriptionListView, SubscriptionCreateView, SubscriptionDetailView,
    SubscriptionUpdateView, SubscriptionDeleteView,
    SubscriptionSyncToMikroTikView, SubscriptionSuspendView,
    SubscriptionActivateView, SubscriptionHistoryView,
    ConnectionFeeListCreateView, ConnectionFeeDetailView
)

app_name = 'subscription'

urlpatterns = [
    # Subscription CRUD endpoints
    path('subscriptions/', SubscriptionListView.as_view(), name='subscription_list'),
    path('subscriptions/create/', SubscriptionCreateView.as_view(), name='subscription_create'),
    path('subscriptions/<int:pk>/', SubscriptionDetailView.as_view(), name='subscription_detail'),
    path('subscriptions/<int:pk>/update/', SubscriptionUpdateView.as_view(), name='subscription_update'),
    path('subscriptions/<int:pk>/delete/', SubscriptionDeleteView.as_view(), name='subscription_delete'),
    
    # Subscription Actions
    path('subscriptions/<int:pk>/sync/', SubscriptionSyncToMikroTikView.as_view(), name='subscription_sync'),
    path('subscriptions/<int:pk>/suspend/', SubscriptionSuspendView.as_view(), name='subscription_suspend'),
    path('subscriptions/<int:pk>/activate/', SubscriptionActivateView.as_view(), name='subscription_activate'),
    
    # Subscription History
    path('subscriptions/<int:pk>/history/', SubscriptionHistoryView.as_view(), name='subscription_history'),

    # Connection Fees
    path('connection-fees/', ConnectionFeeListCreateView.as_view(), name='connection_fee_list_create'),
    path('connection-fees/<int:pk>/', ConnectionFeeDetailView.as_view(), name='connection_fee_detail'),
]
