import httplib2
import logging
from googleapiclient import discovery
from oauth2client.service_account import ServiceAccountCredentials

def build_service(api, version, credentials_path, user_email=None, scopes=None):
    """Build and returns a service object authorized with the service accounts
    that act on behalf of the given user.

    Args:
      user_email: The email of the user. Needs permissions to access the Admin APIs.

    Returns:
      Service object.
    """
    # Create credentials from service account key file
    credentials = ServiceAccountCredentials.from_json_keyfile_name(
        credentials_path,
        scopes=scopes)

    # Create base config for our service
    config = {
        'serviceName': api,
        'version': version
    }

    # Delegate credentials if needed, otherwise use service account credentials
    if user_email is not None:
        delegated = credentials.create_delegated(user_email)
        http = delegated.authorize(httplib2.Http())
        config['http'] = http
    else:
        config['credentials'] = credentials

    return discovery.build(**config)
