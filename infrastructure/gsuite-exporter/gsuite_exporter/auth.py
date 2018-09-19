import httplib2
import logging
from googleapiclient import discovery
from oauth2client.service_account import ServiceAccountCredentials
from oauth2client.client import GoogleCredentials

def build_service(api, version, credentials_path=None, user_email=None, scopes=None):
    """Build and returns a service object authorized with the service accounts
    that act on behalf of the given user.

    Args:
      user_email: The email of the user. Needs permissions to access the Admin APIs.

    Returns:
      Service object.
    """
    service_config = {
        'serviceName': api,
        'version': version
    }   
    
    # Get service account credentials
    if credentials_path is None:
        credentials = GoogleCredentials.get_application_default()
    else:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(
            credentials_path,
            scopes=scopes)

    # Delegate credentials if needed, otherwise use service account credentials
    if user_email is not None:
        delegated = credentials.create_delegated(user_email)
        http = delegated.authorize(httplib2.Http())
        service_config['http'] = http
    else:
        service_config['credentials'] = credentials

    return discovery.build(**service_config)
