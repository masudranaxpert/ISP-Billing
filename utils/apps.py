from django.apps import AppConfig
import os

# Flag to track if scheduler has been started
scheduler_started = False


class UtilsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'utils'
