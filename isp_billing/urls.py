"""
URL configuration for isp_billing project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin panel
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('accounts.urls')),
    path('api/', include('customers.urls')),      
    path('api/', include('mikrotik.urls')),
    path('api/', include('subscription.urls')),
    path('api/', include('billing.urls')),
    path('api/', include('analytics.urls')),   
    path('api/', include('dashboard.urls')),
    path('api/', include('schedule.urls')),  # Schedule management
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)








# ============================================
# API Documentation URLs
# ============================================
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)

urlpatterns += [
    # OpenAPI Schema
    re_path(r'^api/schema/?$', SpectacularAPIView.as_view(), name='schema'),
    
    # Swagger UI
    re_path(r'^$', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    re_path(r'^api/docs/?$', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-docs'),
    
    # ReDoc UI
    re_path(r'^api/redoc/?$', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
