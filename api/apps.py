"""Application configuration for the api app."""

from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration class for the OPA api application."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'OPA API'
