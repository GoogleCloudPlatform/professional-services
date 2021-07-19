# Allowing third party services to access specific backend resources in a Shared VPC

## Solution Goal and Architecture
The main architecture and the goal of this example can be found [here](link follows).

## Prerequisites
Prerequisites for using the code provided here:
- This code has been tested with Terraform 1.0.2
- You have to have two projects in your organization - the one that will be the host for the shared VPC and the one that will be using it (service project)
- The host project has to have the following APIs enabled:
   - Compute Engine API
   - You might want to consider Cloud Logging API
- The service project has to have the following APIs enabled:
   - Compute Engine API
   - Serverless VPC Access API
   - Cloud Build API
   - API Gateway API
   - Service Control API
   - Service Management API
   - Cloud Deployment Manager V2 API	34	0	181	463	
   - Cloud Run API
   - You might want to consider Cloud Logging API and Cloud Pub/Sub API
- You have to have necessary rights to create all resources this Terraform configuration creates

## Folder structure
- The main file for the solution components is the serverless_endpoint.tf. It creates the necessary serverless components and organizes access between them.
- In variables.tf and main.tf the variables, locals and data are defined.
- Other files are to create an example to be able to test the setup - the file networking.tf sets up shared VPC, example_server.tf runs an example webserver.

**Note**: The IP of the webserver is hardcoded in server/index.js and is used in Terraform variables.

## On module usage
This code is not using any modules, although the Terraform modules provided by the Google team might be useful in this case. This was done to make this code cleaner, more simple and easier to read and understand.

## Running this code
```
>> terraform init
>> gcloud config set project YOUR_SERVICE_PROJECT # ??? surely needed?
>> gcloud auth application-default login
>> terraform apply
```
After the resources have been created (give them some time), find your load balancer and access its IP address:
http://IP/ or https://IP/ping

With authentication:
> curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" http://IP/ping


## Destroying created resources
```
>> terraform destroy
```
Be aware that the destroying of all resources created here might need to be done in two steps, since the destroy process does not figure out the dependencies right, specifically for the google_compute_shared_vpc_host_project resource, so if you get an error, please just run "terraform destroy" again. If it still goes wrong, you might need to detach the shared VPC project manually.