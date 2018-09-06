from oauth2client import file, client, tools
from httplib2 import Http
from googleapiclient import discovery
from os.path import join
from os.path import dirname

def get_credentials(scopes, credentials_path, token_path=""):
    """Get credentials with Oauth2 authorization.

    Args:
        scopes (list): A list of scopes to grant to the service account.
    """
    if not token_path:
        token_path = join(dirname(credentials_path), "token.json")
        print("Token path: %s" % token_path)
    store = file.Storage(token_path)
    creds = store.get()
    if not creds or creds.invalid:
        flow = client.flow_from_clientsecrets(credentials_path, scopes)
        creds = tools.run_flow(flow, store)
    return creds

def get_api(api, version, scopes, credentials_path, token_path=""):
    """Builds a Google Cloud API client.

    Args:
        api (str): The API name (e.g: 'logging', 'monitoring', or 'admin')
        version (str): The API version (e.g: 'v2', 'v3', ...)
        scopes (list): A list of scopes to pass with each request
    """
    creds = get_credentials(scopes, credentials_path, token_path)
    return discovery.build(api, version, http=creds.authorize(Http()))
