"""
Test-only settings: uses SQLite so tests can run without PostgreSQL.
Usage: python manage.py test api --settings=opa_backend.settings_test -v 2
"""
from opa_backend.settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
