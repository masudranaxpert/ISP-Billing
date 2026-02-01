from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchedulerViewSet, ScheduleConfigViewSet

router = DefaultRouter()
router.register(r'scheduler', SchedulerViewSet, basename='scheduler')
router.register(r'schedule-config', ScheduleConfigViewSet, basename='schedule-config')

urlpatterns = [
    path('', include(router.urls)),
]
