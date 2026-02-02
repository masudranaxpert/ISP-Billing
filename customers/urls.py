from django.urls import path
from .views import (
    ZoneListCreateView, ZoneDetailView,
    ConnectionTypeListCreateView, ConnectionTypeDetailView,
    CustomerListView, CustomerCreateView, CustomerDetailView,
    CustomerUpdateView, CustomerDeleteView, CustomerSearchView
)

app_name = 'customers'

urlpatterns = [
    # Zone endpoints
    path('zones/', ZoneListCreateView.as_view(), name='zone_list_create'),
    path('zones/<int:pk>/', ZoneDetailView.as_view(), name='zone_detail'),
    
    # Connection Type endpoints
    path('connection-types/', ConnectionTypeListCreateView.as_view(), name='connection_type_list_create'),
    path('connection-types/<int:pk>/', ConnectionTypeDetailView.as_view(), name='connection_type_detail'),
    
    # Customer endpoints
    path('customers/', CustomerListView.as_view(), name='customer_list'),
    path('customers/create/', CustomerCreateView.as_view(), name='customer_create'),
    path('customers/search/', CustomerSearchView.as_view(), name='customer_search'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer_detail'),
    path('customers/<int:pk>/update/', CustomerUpdateView.as_view(), name='customer_update'),
    path('customers/<int:pk>/delete/', CustomerDeleteView.as_view(), name='customer_delete'),
]
