import os

APPLICATIONS = [
    'login',
    'admin',
    'drive',
]
DEFAULT_LOGGING_API_VERSION = 'v2'
ADMIN_API_VERSION = 'reports_v1'
CREDENTIALS_PATH = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS') or \
                   'credentials.json'
TOKEN_PATH = os.environ.get('GOOGLE_GSUITE_TOKEN') or \
                   'token.json'
DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/logging.read',
    'https://www.googleapis.com/auth/logging.write'
]
