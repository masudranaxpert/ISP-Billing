"""
Gunicorn configuration file for ISP Billing System

Note: APScheduler runs in a separate container (scheduler service)
      This config only handles the web workers
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

# Preload app for better performance
preload_app = True

# Timeout settings
timeout = 120
keepalive = 5

# Process naming
proc_name = "isp_billing_web"
