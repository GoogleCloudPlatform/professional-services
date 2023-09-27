from google.cloud import compute_v1
from firebase_admin import tenant_mgt
from google.cloud import iap_v1
from google.cloud import api_keys_v2
from exceptions.connector_exception import ConnectorException
import google.auth
import sys
import argparse
import firebase_admin
import requests
from utils.validator import validate_comma_separated_string

'''

    This method updates the IAP setting that is connecting IAP with IDP

    Args:
        credentials: credential for backend service client
        project_id:  project_id for which we want to get the backend services for
        backend: backend service to connect
        api_key_arg: api key string for the sign in url
        tenant_ids: list of tenants to be enabled that connect for
    Returns:
    Raises:
        ConnectorException if the update IAP settings call fails

'''


def update_iap_settings(credentials, project_id, sign_in_url, backend, api_key_arg, tenant_ids):
    # Initialize the IAP Admin client
    client = iap_v1.IdentityAwareProxyAdminServiceClient(credentials=credentials)

    # Prepare the backend service resource name
    backend_service_resource_name = f"projects/{project_id}/iap_web/compute/services/{backend}"
    sign_in_url = f"{sign_in_url}?apiKey={api_key_arg}"
    # Prepare the IAP settings update
    request = {
        "iap_settings": {
            "name": backend_service_resource_name,
            "access_settings": {
                "gcip_settings": {
                    "tenant_ids": tenant_ids,
                    "login_page_uri": sign_in_url
                }

            }
        }
    }

    # Update the IAP settings for the backend service
    response = None
    try:
        response = client.update_iap_settings(request=request)
    except Exception as e:
        raise ConnectorException(e)

    print(f"IAP settings updated successfully for backend: {backend} with response: {response}")
    return response


'''

    This method gets firebase api key string if not provided explicitly

    Args:
        credentials: credential for api key client
        project_id:  project_id for which we want to get the api keys for
   
    Returns:
        get the api key string
    Raises:
        ConnectorException if firebase api key is not found
'''


def get_firebase_api_key_string(credentials, project_id):
    client = api_keys_v2.ApiKeysClient(credentials=credentials)
    # Initialize request argument(s)
    request = api_keys_v2.ListKeysRequest(
        parent=f"projects/{project_id}/locations/global",
    )

    # Make the request
    page_result = client.list_keys(request=request)
    # print(page_result)
    firebase_substring = "Browser key (auto created by Firebase)"
    # Handle the response
    for response in page_result:
        print(response)
        if "display_name" in response and firebase_substring in response.display_name:
            print("getting the key string value")
            # Initialize request argument(s)
            request = api_keys_v2.GetKeyStringRequest(
                name=response.name
            )

            # Make the request
            response = client.get_key_string(request=request)

            # Handle the response
            print(f"Key String is {response}")
            return response.key_string
    '''
        If we come here that means we don't have a firebase api key string generated from cloud run deploy or deployment 
        on Firebase SDK and we dont have a api key provided explicitly. In such cases, we will raise the exception 
        telling the user to provide one
    '''
    raise ConnectorException("Could not find firebase api key, please provide the api key attached to sign in page")


'''

    This method gets all the backend services in the project

    Args:
        credentials: credential for backend service client
        project_id:  project_id for which we want to get the backend services for
   
    Returns:
        all the backend services in the project
    Raises:

'''


def get_all_backend_service_names(credentials, project_id):
    # Getting the backend service names
    client = compute_v1.BackendServicesClient(credentials=credentials)

    backend_service_list = client.list(project=project_id)

    # Get the backend list
    backend_service_names = []

    for backend_service in backend_service_list:
        print(f"Adding Backend Service name: {backend_service}")
        backend_service_names.append(backend_service.name)

    print(f"All Backend Names={backend_service_names}")
    return backend_service_names


'''

    This method gets all the tenant ids in the project

    Args:
   
    Returns:
        all the tenant ids in the project
    Raises:

'''


def get_all_tenant_ids():
    valid_tenant_ids = []
    default_app = firebase_admin.initialize_app()
    for tenant in tenant_mgt.list_tenants().iterate_all():
        valid_tenant_ids.append(tenant.tenant_id)
    print(f"Valid Tenant Ids={valid_tenant_ids}")
    return valid_tenant_ids


'''

    This method checks if all backend services in backend_services are part of the all_services and return the result 
    as well as the list of unmatched backend services

    Args:
        all_services: list of all valid backend services in the project
        backend_services:  list of the backend services to be plugged
   
    Returns:
        is backend_services subset of all_services, list of unmatched backend services
    Raises:

'''


def validate_backend_services(all_services, backend_services):
    return set(all_services).issuperset(set(backend_services)), list(set(backend_services) - set(all_services))


'''

    This method checks if all tenant ids in backend_tenant_ids are part of the valid tenant ids and return the result 
    as well as the list of unmatched tenant_ids

    Args:
        all_tenant_ids: list of all valid tenant ids in the project
        tenant_ids:  list of the tenant ids to be plugged
   
    Returns:
        is tenant_ids subset of all_tenant_ids, list of unmatched tenant ids
    Raises:

'''


def validate_tenant_ids(all_tenant_ids, tenant_ids):
    return set(all_tenant_ids).issuperset(set(tenant_ids)), list(set(tenant_ids) - set(all_tenant_ids))


def run(credentials, project_id, sign_in_url, tenant_ids_arg, backend_services_arg, api_key_arg):
    backend_service_names = get_all_backend_service_names(credentials, project_id)
    if backend_services_arg is not None:
        backend_services_arg = backend_services_arg.split(',')
        is_valid, unmatched_backend_list = validate_backend_services(backend_service_names, backend_services_arg)
        if not is_valid:
            raise ConnectorException(f'Please provide the valid backends. These are the invalid backend'
                                     f' {unmatched_backend_list}')
        backend_service_names = backend_services_arg

    tenant_ids = get_all_tenant_ids()

    if tenant_ids_arg is not None:
        tenant_ids_arg = tenant_ids_arg.split(',')
        is_valid, unmatched_tenant_ids = validate_tenant_ids(tenant_ids, tenant_ids_arg)
        if not is_valid:
            raise ConnectorException(f'Please provide the valid tenant ids. These are the invalid tenants'
                                     f' {unmatched_tenant_ids}')
        tenant_ids = tenant_ids_arg

    for backend in backend_service_names:
        if api_key_arg is None:
            api_key_arg = get_firebase_api_key_string(credentials, project_id)
        print(f'Processing backend {backend}')
        update_iap_settings(credentials, project_id, sign_in_url, backend, api_key_arg, tenant_ids)


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', required=True, help='Provide the project id')
    parser.add_argument('--sign_in_url', required=True, help='Provide the sign in url for the custom login url page '
                                                             'or the one created by GCP')
    parser.add_argument('--tenant_ids', required=False, help='Provide the tenant ids you want the backend services to '
                                                             'be updated with', default=None)
    parser.add_argument('--backend_services', required=False, help='Provide the backend service names for which you '
                                                                   'want the IAP resource to be updated', default=None)
    parser.add_argument('--api_key', required=False, help='Provide the api key for the sign_in url', default=None)

    args = parser.parse_args(argv)

    if args.tenant_ids is not None and not validate_comma_separated_string(args.tenant_ids):
        raise ConnectorException(
            f'Validation failed for input_string {args.tenant_ids} to follow comma separated regex')

    if args.backend_services is not None and not validate_comma_separated_string(args.backend_services):
        raise ConnectorException(
            f'Validation failed for input_string {args.backend_services} to follow comma separated regex')
    '''
    TODO Write validate function
    '''
    # Get the default credentials for the current
    # environment.https://google-auth.readthedocs.io/en/master/reference/google.auth.html
    credentials, _ = google.auth.default()
    run(credentials, args.project, args.sign_in_url, args.tenant_ids, args.backend_services, args.api_key)


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
