"""
Gunicorn configuration file
"""
import os

# Server socket
bind = "0.0.0.0:8000"
workers = 3

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Worker class
worker_class = "sync"

# Preload app
preload_app = True


def post_fork(server, worker):
    """
    Called just after a worker has been forked.
    Start scheduler only in the first worker to avoid duplicates.
    """
    # Only start scheduler in worker 1
    if worker.age == 0:  # First worker
        try:
            from utils.background_tasks import start_scheduler
            import logging
            
            logger = logging.getLogger(__name__)
            logger.info(f"Starting scheduler in worker {worker.pid}")
            start_scheduler()
            logger.info(f"Scheduler started successfully in worker {worker.pid}")
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to start scheduler in worker {worker.pid}: {e}")
