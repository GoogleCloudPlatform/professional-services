# Identity-Aware Proxy Samples

## Running iap_validating_server.py

This sample script runs a simple python web server which validates all GET requests to verify if they're being proxied through Google's Identity-Aware Proxy. This sample depends on and uses the [validate_iap_jwt_from_compute_engine](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/validate_jwt.py#L49) function found in [validate_jwt.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py). Make sure you install the necessary libraries found in [requirements.txt](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/requirements.txt) by running:

    pip install -r requirements.txt

Once the libraries are installed, you can run the server by calling:

    python iap_validating_server.py

## Running main.py

This sample script takes in two runtime arguments

* URL - The URL corresponding to the resource sitting behind the Identity-Aware Proxy 
* IAP Client Id - The OAuth Client Id of the service account assigned to Identity-Aware Proxy

and passes them to the [make_iap_request](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/make_iap_request.py#L33) function found in [make_iap_request.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py). Make sure you install the necessary libraries found in [requirements.txt](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/requirements.txt) by running:

    pip install -r requirements.txt

Once the libraries are installed, you can run the sample by calling:

    python main.py URL IAP_CLIENT_ID
    
making sure to replace the URL and IAP_CLIENT_ID placeholders with appropriate values.

## Deploying with prog_auth_deploy.yaml

This deployment manager template creates a virtual machine instance in compute engine and runs a custom startup script with specific steps to prepare the environment for testing programmatic authentication with IAP.

Use gcloud to create a deployment with this template:

    gcloud deployment-manager deployments create prog-auth-vm --config prog_auth_deploy.yaml
