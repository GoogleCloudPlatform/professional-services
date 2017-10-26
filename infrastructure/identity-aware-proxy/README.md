# Identity-Aware Proxy Samples

## IAP Server

The [iap_validating_server.py](iap_validating_server.py) sample script runs a simple python web server which validates all GET requests to verify if they're being proxied through Google's Identity-Aware Proxy. This python script depends on and uses the [validate_iap_jwt_from_compute_engine](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/validate_jwt.py#L49) function found in [validate_jwt.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py). Read the [Securing Your App with Signed Headers](https://cloud.google.com/iap/docs/signed-headers-howto) documentation for more detail on this process.
The [server_deployment.yaml](server_deployment.yaml) deployment manager template is provided to quickly setup a managed instance group that runs [iap_validating_server.py](iap_validating_server.py) in a virtual machine. [server_deployment.py](server_deployment.py) defines a custom startup script for the instance template in order to import all necessary libraries.

### How to setup IAP Server
1. Deploy the managed instance group by calling:
    ```bash
    gcloud deployment-manager deployments create iap-server --config server_deployment.yaml
    ```
    * (Optional) Set your desired zone by replacing the zone defined on line 12 in [server_deployment.yaml](server_deployment.yaml)
    * Ensure [Google Cloud Deployment Manager API](https://console.developers.google.com/apis/api/deploymentmanager.googleapis.com/overview) is enabled
1. [Setup a load balancer](https://cloud.google.com/iap/docs/load-balancer-howto#setting_up_the_load_balancer) with the backend service pointing to the managed instance group you just created.
To expedite this sample and only for demo purposes:
    * Set the backend service to communicate over HTTP
    * Set the frontend to communicate over HTTPS (a requirement for IAP) and use a self-signed certificate (only for demo purposes) to expedite the setup process.
1. [Enable IAP](https://cloud.google.com/iap/docs/enabling-gce-howto#enabling_short_product_name).

**IMPORTANT: This web server requires that the IAP project number and the backend service ID be passed in every request url in the following form: `https://yourdomain.com/projectNumber/backendServiceId`. This is only done for convenience since this example is intended to be generic and not specific to any project. In production, the project number and backend service ID should be passed as runtime arguments when starting your server.**

## IAP Client

[main.py](main.py) takes in two runtime arguments

* URL - The URL corresponding to the resource sitting behind the Identity-Aware Proxy
* IAP Client Id - The OAuth Client Id of the service account assigned to Identity-Aware Proxy

and passes them to the [make_iap_request](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/make_iap_request.py#L33) function found in [make_iap_request.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py).
The [client_deployment.py](clieint_deployment.py) deployment manager template is provided to quickly setup a virtual machine instance in compute engine. [client_deployment.py](clieint_deployment.py) defines a custom startup script for the instance in order to import all necessary libraries.

### How to setup IAP Client
1. Deploy the IAP client virtual machine
    ```bash
    gcloud deployment-manager deployments create iap-client --template client_deployment.py --properties zone:us-east4-a #ZONE IS YOUR CHOICE
    ```
    * (Optional) Set your desired zone with the ```--properties zone:YOUR_ZONE``` argument 
1. SSH into the IAP client virtual machine
1. Once the libraries are installed, you can run the sample by calling:
    ```bash
    python main.py URL IAP_CLIENT_ID
    ```
    * (Required) *URL* must be passed in the following form: `https://yourdomain.com/projectNumber/backendServiceId`. This is specific to this demo since the IAP Server expects this format. ```projectNumber``` and ```backendServiceId``` can be found in the [Identity-Aware Proxy settings](https://console.cloud.google.com/iam-admin/iap/). Locate the resource you want to access, click **More** next to the Load Balancer resource, and then select **Signed Header JWT Audience**. The **Signed Header JWT** dialog that appears displays both the ```projectNumber``` and ```backendServiceId```. 
    * (Required) *IAP_CLIENT_ID* can also be found in the [Identity-Aware Proxy settings](https://console.cloud.google.com/iam-admin/iap/). Locate the resource you want to access, click **More > OAuth Client** on the right side, then note the client ID on the Credentials page that appears. 
