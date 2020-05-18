# Dataproc init auth

File server application with a custom authentication to allow administrators to distribute secrets to Dataproc
cluster members via the initialization action. After initialization, the assumption is that untrusted users gain access 
to the nodes and must not be allowed to access the secrets. The application enables to differentiate between cluster
members when the secret is stored on the server. 

An example secret might be a Service Account Keyfile used only during cluster setup. 


## How it works

- Dataproc cluster runs an init action which starts the client

- Client obtains VM Identity token from instance metadata

- Client sends a POST request with the identity token

- Server verifies the identity token and cross-references the token with responses from Compute and Dataproc APIs

- Authorization is granted based on IP address, instance creation time, Dataproc cluster membership, and Dataproc cluster status

- The secret becomes inaccessible after a specified time period

## How to use

- Start a server which listens to the client

- Create a Dataproc Cluster which runs as a Client 
    ```
    gcloud beta dataproc clusters create c$(date +%s)
    --region us-east1 --subnet projects/prod-abc-host/regions/us-east1/subnetworks/default 
    --no-address --zone us-east1-b --single-node --master-machine-type n1-standard-4 
    --master-boot-disk-size 100 --image-version 1.4-debian9 
    --max-idle 3600s --tags nat --project dp-init 
    --service-account svc
    ```

- Obtain a VM Indentity token from Compute Engine Instance Metadata Server
https://cloud.google.com/compute/docs/instances/verifying-instance-identity#curl

    ```
    export HOSTNAME="https://secureinit.local"
    
    tokenenc = $(curl -H "Metadata-Flavor: Google" "http://metadata/computeMetadata/
             v1/instance/service-accounts/default/identity?audience=${HOSTNAME}&
             format=full" 2>/dev/null)
  
    curl --data "$tokenenc" $HOSTNAME/secret
    ```




