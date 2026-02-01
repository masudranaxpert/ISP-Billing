#!/usr/bin/env python
"""
Standalone APScheduler runner
Run this as a separate process/container from the main Django application
"""
import os
import sys
import django
import logging
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'isp_billing.settings')
django.setup()

# Now import Django-dependent modules
from schedule.background_tasks import start_scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting APScheduler as standalone service")
    logger.info("=" * 60)
    
    try:
        start_scheduler()
        logger.info("Scheduler is running. Press Ctrl+C to stop.")
        
        # Keep the process running
        import time
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Scheduler failed: {e}", exc_info=True)
        sys.exit(1)
