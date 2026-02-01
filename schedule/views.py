from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from zenpulse_scheduler.models import ScheduleConfig, JobExecutionLog
from datetime import datetime
import logging

from .serializers import ScheduleConfigSerializer

logger = logging.getLogger(__name__)


class SchedulerViewSet(viewsets.ViewSet):
    """
    ViewSet for managing ZenPulse Scheduler (stats/logs)
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """List current job statuses"""
        jobs = ScheduleConfig.objects.all()
        serializer = ScheduleConfigSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total_jobs = ScheduleConfig.objects.count()
        total_executions = JobExecutionLog.objects.count()
        successful = JobExecutionLog.objects.filter(status='success').count()
        failed = JobExecutionLog.objects.filter(status='fail').count()
        
        return Response({
            'total_jobs': total_jobs,
            'total_executions': total_executions,
            'successful_executions': successful,
            'failed_executions': failed,
        })


class ScheduleConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing schedule configurations
    """
    queryset = ScheduleConfig.objects.all()
    serializer_class = ScheduleConfigSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'job_key'
    pagination_class = None
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, job_key=None):
        config = self.get_object()
        config.enabled = not config.enabled
        config.save()
        return Response({'message': 'Job updated', 'is_enabled': config.enabled})

    @action(detail=False, methods=['post'])
    def sync(self, request):
        # Trigger re-seed if needed, or just let DB signal handle it
        from schedule.apps import seed_schedules
        seed_schedules(None)
        return Response({'message': 'Sync initiated'})

