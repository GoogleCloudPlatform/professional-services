# Identity-Aware Proxy Samples

## IAP Server

The [iap_validating_server.py](iap_validating_server.py) sample script runs a simple python web server which validates all GET requests to verify if they're being proxied through Google's Identity-Aware Proxy. This python script depends on and uses the [validate_iap_jwt_from_compute_engine](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/3f5de8c8857784e90935379b63c352c0a5f7f8da/iap/validate_jwt.py#L49) function found in [validate_jwt.py](https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/iap/validate_jwt.py). Read the [Securing Your App with Signed Headers](https://cloud.google.com/iap/docs/signed-headers-howto) documentation for more detail on this process.
The [server_deployment.yaml](server_deployment.yaml) deployment manager template is provided to quickly setup a load balanced and managed instance group that runs the simple web server, [iap_validating_server.py](iap_validating_server.py), in a virtual machine. 

Note: The [server_deployment.py](server_deployment.py) deployment manager template defines a custom startup script for the instance template. This startup script imports all necessary libraries and files needed to run the [iap_validating_server.py](iap_validating_server.py) python web server.

### Quickstart IAP Server
1. Create a self-signed certificate to use for the front end load balancer
    ```bash
    ./createSelfSignedCert.sh
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
1. The client can programmatically make web requests to the IAP server using OAuth2 with two forms of managed private keys
   
   **User-managed private keys**
   * Upload the JSON private key file onto the client virtual machine
   * Point the environment variable `GOOGLE_APPLICATION_CREDENTIALS` to the private key file
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS=~/yourprivatekey.json
     ```
   **Google-managed private keys**
   * Enable the [Google Identity and Access Management (IAM) API](https://console.developers.google.com/apis/library/iam.googleapis.com)
   * Grant ```Service Account Token Creator``` role to the default compute service account (e.g. yourprojectnumber-compute@developer.gserviceaccount.com)
     * Since the Compute Engine metadata service doesn't expose the default service account key, you use the IAM signBlob API instead to sign your service account credentials (JWT). The ```Service Account Token Creator``` role grants permission to sign JWTs. 
1. Once the libraries are installed, you can run the sample by calling:
    ```bash
    source /home/iap_client_env/bin/activate;
    python /home/iap_authenticated_client.py URL IAP_CLIENT_ID
    ```
    * (Required) *URL* e.g. https://yourdomain.com
    * (Required) *IAP_CLIENT_ID* can also be found in the [Identity-Aware Proxy settings](https://console.cloud.google.com/iam-admin/iap/project). Locate the resource you want to access, click **More (3 stacked dots) > Edit OAuth Client** on the right side, then note the client ID on the Credentials page that appears

1. Grant your service account access to IAP protected resources by adding it to the access list shown in the [IAP console](https://console.cloud.google.com/iam-admin/iap/project)
    * The previous step should have returned the following error:
      ```Exception: Service account serviceAcctId@yourproject.iam.gserviceaccount.com does not have permission to access the IAP-protected application.```. You received this error because IAP has an access control list which must be populated with all identities that should be allowed to pass the IAP proxy
    * Allow a few minutes for changes to the access list to take effect
