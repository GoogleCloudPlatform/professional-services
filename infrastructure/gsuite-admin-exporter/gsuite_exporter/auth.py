import requests
import google.auth
from google.auth import iam
from google.auth.credentials import with_scopes_if_required
from google.auth.transport import requests
from google.oauth2 import service_account
from gsuite_exporter import constants
from googleapiclient import discovery

CLOUD_SCOPES = constants.DEFAULT_SCOPES
_TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'

def create_service_api(admin_email, service_name, version, credentials=None):
    credentials = get_admin_credentials(admin_email, credentials)
    discovery_kwargs = {
        'serviceName': service_name,
        'version': version,
        'credentials': credentials
    }
    return discovery.build(**discovery_kwargs)

def get_admin_credentials(admin_email, credentials=None):
    if not credentials:
        credentials, _ = google.auth.default()
    credentials = get_delegated_credential(
        admin_email,
        CLOUD_SCOPES)
    return with_scopes_if_required(credentials, list(CLOUD_SCOPES))

def get_delegated_credential(delegated_account, scopes=CLOUD_SCOPES):
    """Build delegated credentials required for accessing the gsuite APIs.
    Args:
        delegated_account (str): The account to delegate the service account to
            use.
        scopes (list): The list of required scopes for the service account.
    Returns:
        service_account.Credentials: Credentials as built by
        google.oauth2.service_account.
    """
    request = requests.Request()

    # Get the "bootstrap" credentials that will be used to talk to the IAM
    # API to sign blobs.
    bootstrap_credentials, _ = google.auth.default()

    bootstrap_credentials = with_scopes_if_required(
        bootstrap_credentials,
        list(CLOUD_SCOPES))

    # Refresh the boostrap credentials. This ensures that the information about
    # this account, notably the email, is populated.
    bootstrap_credentials.refresh(request)

    # Create an IAM signer using the bootstrap credentials.
    signer = iam.Signer(request,
                        bootstrap_credentials,
                        bootstrap_credentials.service_account_email)

    # Create OAuth 2.0 Service Account credentials using the IAM-based signer
    # and the bootstrap_credential's service account email.
    delegated_credentials = service_account.Credentials(
        signer, bootstrap_credentials.service_account_email, _TOKEN_URI,
        scopes=scopes, subject=delegated_account)

    return delegated_credentials
