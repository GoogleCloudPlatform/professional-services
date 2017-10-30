# Identity-Aware Proxy Samples

## IAP Server

The [iap_validating_server.py](iap_validating_server.py) sample script runs a simple python web server which validates all GET requests to verify if they're being proxied through Google's Identity-Aware Proxy. This python script depends on and uses the [validate_iap_jwt_from_compute_engine](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/validate_jwt.py#L49) function found in [validate_jwt.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py). Read the [Securing Your App with Signed Headers](https://cloud.google.com/iap/docs/signed-headers-howto) documentation for more detail on this process.
The [server_deployment.yaml](server_deployment.yaml) deployment manager template is provided to quickly setup a load balanced and managed instance group that runs the simple web server, [iap_validating_server.py](iap_validating_server.py), in a virtual machine. Note: The [server_deployment.py](server_deployment.py) template file defines a custom startup script for the instance template in order to import all necessary libraries.

### Quickstart IAP Server
1. Create a self-signed certificate to use for the front end load balancer
    ```bash
    bash createSelfSignedCert.sh
    ```
    * During certificate creation, it's only required to enter your domain in
      the `Common Name (e.g. server FQDN or YOUR name) []:` prompt (make sure you can edit DNS for domain).
      You may leave all other fields empty.
    * Self-signed certificates are not secure and only used here for demo purposes
1. Deploy the managed instance group by calling:
    ```bash
    gcloud deployment-manager deployments create iap-server --config server_deployment.yaml
    ```
    * (Optional) Set your desired zone by replacing the zone property on line 12 in [server_deployment.yaml](server_deployment.yaml)
    * Ensure [Google Cloud Deployment Manager API](https://console.developers.google.com/apis/api/deploymentmanager.googleapis.com/overview) is enabled
1. Add an A record to your domain (same domain used in certificate during step 1) which points to the [IP address of your 
   load balancer](https://console.cloud.google.com/net-services/loadbalancing/advanced/globalForwardingRules/details/iap-global-forwarding-rule) 
1. [Enable IAP](https://cloud.google.com/iap/docs/enabling-gce-howto#enabling_short_product_name)

## IAP Client

[iap_authenticated_client.py](iap_authenticated_client.py) takes in two runtime arguments

* URL - The URL corresponding to the resource sitting behind the Identity-Aware Proxy
* IAP Client Id - The OAuth Client Id of the service account assigned to Identity-Aware Proxy

and passes them to the [make_iap_request](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/make_iap_request.py#L33) function found in [make_iap_request.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/make_iap_request.py).
The [client_deployment.py](clieint_deployment.py) deployment manager template is provided to quickly setup a virtual machine instance in compute engine. [client_deployment.py](clieint_deployment.py) defines a custom startup script for the instance in order to import all necessary libraries.

### Quickstart IAP Client
1. Deploy the IAP client virtual machine
    ```bash
    gcloud deployment-manager deployments create iap-client --template client_deployment.py --properties zone:us-east4-a #ZONE IS YOUR CHOICE
    ```
    * (Optional) Set your desired zone with the ```--properties zone:YOUR_ZONE``` argument 
1. SSH into the IAP client virtual machine
1. In order for client to make web requests via a service account with user-managed keys
   * Upload the JSON private key onto the client virtual machine
   * Point the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to this file
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS=~/yourprivatekey.json
     ```
1. Once the libraries are installed, you can run the sample by calling:
    ```bash
    source /home/iap_client_env/bin/activate;
    python /home/iap_authenticated_client.py URL IAP_CLIENT_ID
    ```
    * (Required) *URL* must have the root domain pointing to your front end load balancer
    * (Required) *IAP_CLIENT_ID* can also be found in the [Identity-Aware Proxy settings](https://console.cloud.google.com/iam-admin/iap/). Locate the resource you want to access, click **More > OAuth Client** on the right side, then note the client ID on the Credentials page that appears
