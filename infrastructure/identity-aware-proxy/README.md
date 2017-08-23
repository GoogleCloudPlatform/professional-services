# Identity-Aware Proxy Samples

## Running iap_validating_server.py

This sample script runs a simple python web server which validates all GET requests to verify if they're being proxied through Google's Identity-Aware Proxy. This sample depends on and uses the [validate_iap_jwt_from_compute_engine](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/validate_jwt.py#L49) function found in the [validate_jwt.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py) file. Make sure you install the necessary libraries by following [these instructions](https://github.com/GoogleCloudPlatform/python-docs-samples/tree/master/iap#using-validate_jwt).

    python iap_validating_server.py

## Running main.py

This sample script takes in two runtime arguments

* URL - The URL corresponding to the resource sitting behind the Identity-Aware Proxy 
* IAP Client Id - The OAuth Client Id of the service account assigned to Identity-Aware Proxy

and passes them to the [make_iap_request](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/make_iap_request.py#L33) function found in [make_iap_request.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py)

    python main.py https://yourdomain.com projectNumber-randomchars.apps.googleusercontent.com

## Deploying with prog_auth_deploy.yaml

This deployment manager template creates a virtual machine instance in compute engine and runs a custom startup script with specific steps to prepare the environment for testing programmatic authentication with IAP. 

    gcloud deployment-manager deployments create prog-auth-vm --config prog_auth_deploy.yaml
