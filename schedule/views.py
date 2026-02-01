from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_apscheduler.models import DjangoJob, DjangoJobExecution
from datetime import datetime
import logging

from .models import ScheduleConfig
from .serializers import ScheduleConfigSerializer

logger = logging.getLogger(__name__)


class SchedulerViewSet(viewsets.ViewSet):
    """
    ViewSet for managing APScheduler jobs
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        List all scheduled jobs with their details
        """
        jobs = DjangoJob.objects.all()
        
        jobs_data = []
        for job in jobs:
            # Get last execution
            last_execution = DjangoJobExecution.objects.filter(
                job=job
            ).order_by('-run_time').first()
            
            jobs_data.append({
                'id': job.id,
                'name': job.id,  # Use ID as name for now
                'next_run_time': job.next_run_time,
                'last_run_time': last_execution.run_time if last_execution else None,
                'last_status': last_execution.status if last_execution else None,
                'enabled': True,
            })
        
        return Response(jobs_data)

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """
        Get execution history for a specific job
        """
        try:
            job = DjangoJob.objects.get(id=pk)
            executions = DjangoJobExecution.objects.filter(
                job=job
            ).order_by('-run_time')[:50]  # Last 50 executions
            
            executions_data = [{
                'id': exec.id,
                'run_time': exec.run_time,
                'status': exec.status,
                'duration': exec.duration,
                'exception': exec.exception,
            } for exec in executions]
            
            return Response(executions_data)
        except DjangoJob.DoesNotExist:
            return Response(
                {'error': 'Job not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get scheduler statistics
        """
        total_jobs = DjangoJob.objects.count()
        total_executions = DjangoJobExecution.objects.count()
        
        # Get recent executions
        recent_executions = DjangoJobExecution.objects.order_by('-run_time')[:10]
        
        # Count successful vs failed
        successful = DjangoJobExecution.objects.filter(status='Success').count()
        failed = DjangoJobExecution.objects.filter(status='Error').count()
        
        return Response({
            'total_jobs': total_jobs,
            'total_executions': total_executions,
            'successful_executions': successful,
            'failed_executions': failed,
            'recent_executions': [{
                'job_id': exec.job_id,
                'run_time': exec.run_time,
                'status': exec.status,
                'duration': exec.duration,
            } for exec in recent_executions]
        })


class ScheduleConfigViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing schedule configurations
    """
    queryset = ScheduleConfig.objects.select_related('job').all()
    serializer_class = ScheduleConfigSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'job_id'  # Use job_id instead of pk
    pagination_class = None  # Disable pagination, return all configs
    
    def get_object(self):
        """Override to lookup by job__id (ForeignKey)"""
        job_id = self.kwargs.get('job_id')
        return ScheduleConfig.objects.select_related('job').get(job__id=job_id)
    
    def update(self, request, *args, **kwargs):
        """Handle PUT requests"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # If updating interval, clear cron expression and vice versa
        data = request.data.copy()
        if 'interval_unit' in data or 'interval_value' in data:
            data['cron_expression'] = None
            
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, job_id=None):
        """
        Toggle job enabled/disabled status
        """
        config = self.get_object()
        config.is_enabled = not config.is_enabled
        config.save()
        
        return Response({
            'message': f"Job {'enabled' if config.is_enabled else 'disabled'}",
            'is_enabled': config.is_enabled
        })
    
    @action(detail=False, methods=['post'])
    def reload(self, request):
        """
        Reload scheduler with updated configurations
        Note: Requires scheduler service restart to take effect
        """
        return Response({
            'message': 'Configuration updated. Restart scheduler service to apply changes.',
            'note': 'Run: podman compose restart scheduler'
        })
    
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """
        Sync schedule configs from APScheduler jobs
        """
        ScheduleConfig.sync_from_apscheduler()
        return Response({
            'message': 'Successfully synced jobs from APScheduler',
            'count': ScheduleConfig.objects.count()
        })
    
    @action(detail=False, methods=['get'])
    def available_jobs(self, request):
        """
        Get list of available jobs from APScheduler
        """
        jobs = ScheduleConfig.get_available_jobs()
        return Response({
            'jobs': [{'id': job.id, 'name': name, 'next_run_time': job.next_run_time} for job, name in jobs]
        })

