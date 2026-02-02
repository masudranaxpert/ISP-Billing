from rest_framework import generics, filters, permissions
from rest_framework.response import Response
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Zone, Customer, ConnectionType
from .serializers import (
    ZoneSerializer,
    CustomerSerializer, CustomerCreateSerializer,
    CustomerUpdateSerializer, CustomerListSerializer,
    ConnectionTypeSerializer
)
from utils.permissions import IsAdminOrManager, IsAdmin


# ==================== Zone Views ====================

@extend_schema(tags=['Zones'])
class ZoneListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list and create zones
    """
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']



@extend_schema(tags=['Zones'])
class ZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to get, update, or delete a specific zone
    """
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsAdmin]


# ==================== Connection Type Views ====================

@extend_schema(tags=['Configuration'])
class ConnectionTypeListCreateView(generics.ListCreateAPIView):
    """
    API endpoint to list and create connection types
    """
    queryset = ConnectionType.objects.all()
    serializer_class = ConnectionTypeSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [filters.OrderingFilter]
    ordering = ['name']


@extend_schema(tags=['Configuration'])
class ConnectionTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint to manage individual connection type
    """
    queryset = ConnectionType.objects.all()
    serializer_class = ConnectionTypeSerializer
    permission_classes = [IsAdmin]


# ==================== Customer Views ====================

@extend_schema(tags=['Customers'])
class CustomerListView(generics.ListAPIView):
    """
    API endpoint to list all customers with filtering and search
    """
    queryset = Customer.objects.select_related('zone', 'created_by').all()
    serializer_class = CustomerListSerializer
    permission_classes = [IsAdminOrManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'billing_type', 'connection_type', 'zone']
    search_fields = ['customer_id', 'name', 'phone', 'email', 'address']
    ordering_fields = ['customer_id', 'name', 'created_at', 'status']
    ordering = ['-created_at']


@extend_schema(tags=['Customers'])
class CustomerCreateView(generics.CreateAPIView):
    """
    API endpoint to create new customer
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerCreateSerializer
    permission_classes = [IsAdminOrManager]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Customer created successfully',
            'customer': serializer.data
        }, status=status.HTTP_201_CREATED)


@extend_schema(tags=['Customers'])
class CustomerDetailView(generics.RetrieveAPIView):
    """
    API endpoint to get customer details
    """
    queryset = Customer.objects.select_related('zone', 'created_by').all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrManager]


@extend_schema(tags=['Customers'])
class CustomerUpdateView(generics.UpdateAPIView):
    """
    API endpoint to update customer information
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerUpdateSerializer
    permission_classes = [IsAdminOrManager]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'message': 'Customer updated successfully',
            'customer': serializer.data
        })


@extend_schema(tags=['Customers'])
class CustomerDeleteView(generics.DestroyAPIView):
    """
    API endpoint to delete customer (Admin only)
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdmin]
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        customer_id = instance.customer_id
        self.perform_destroy(instance)
        
        return Response({
            'message': f'Customer {customer_id} deleted successfully'
        }, status=status.HTTP_200_OK)


@extend_schema(tags=['Customers'])
class CustomerSearchView(generics.ListAPIView):
    """
    API endpoint for advanced customer search
    """
    serializer_class = CustomerListSerializer
    permission_classes = [IsAdminOrManager]
    
    def get_queryset(self):
        queryset = Customer.objects.select_related('zone', 'created_by').all()
        
        # Get query parameters
        customer_id = self.request.query_params.get('customer_id', None)
        phone = self.request.query_params.get('phone', None)
        name = self.request.query_params.get('name', None)
        zone_id = self.request.query_params.get('zone', None)
        status_filter = self.request.query_params.get('status', None)
        
        # Apply filters
        if customer_id:
            queryset = queryset.filter(customer_id__icontains=customer_id)
        if phone:
            queryset = queryset.filter(phone__icontains=phone)
        if name:
            queryset = queryset.filter(name__icontains=name)
        if zone_id:
            queryset = queryset.filter(zone_id=zone_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
