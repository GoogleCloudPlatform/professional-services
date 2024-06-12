# Certificate Authority Service Demo

This repository contains sample Terraform resource definitions for deploying several 
related Certificate Authority Service (CAS) resources to the Google Cloud.

It demonstrates several Certificate Authority Service features and provides examples
of Terraform configuration for the following CAS features:

* Root and Subordinate CA provisioning
* Automatic Subordinate CA activation using Root CA in the CAS
* Configuration example for manual subordinate CA activation
* Multi-regional Subordinate CA deployment
* CA configuration with Cloud HSM signing keys including example for imported keys
* Application team domain ownership validation using CAS Certificate Templates and conditional IAM policies
* CAS CA Pool throughput scaling and a load test script for certificate request load generation
* CAS API activation

The following diagram shows resources being deployed by this project and the resulting CA hiearchy structure:

![Demo Deployment](images/deployment.png?raw=true)


## Pre-requisites

The deployment presumes and relies upon an existing Google Cloud Project with attached active Billing account.

To perform the successful deployment, your Google Cloud account needs to have `Project Editor` role in the target 
Google Cloud project.

Update the Google Cloud project id in the [terraform.tfvar](./terraform.tfvars) file by setting the `project_id` variable
to the id of the target Google Cloud project before proceeding with the execution.

## Demonstration

The Terraform project in this repository defines the following input variables that can either be edited in the `variables.tf` file directly or passed over the Terraform command line.

The project deploys the Google Cloud resources by default into the regions defined by the `location1` and `location2` variables. 
You can change that by passing alternative values in the `terraform.tfvars.sample` file and copying it to the `terraform.tfvars` file.

Initiate Terraform and deploy Google Cloud resources
```
terraform init
terraform plan
terraform apply
```


### Provisioned resources

The created CAS resources become visible in the Certificate Authority Service [section](https://console.cloud.google.com/security/cas/caPools) 
in the Cloud Console.

### Domain ownership validation

1. ACME and Non-ACME service accounts get created in the [cas-template.tf](./cas-template.tf)
2. [Load Python cryptography library](https://cloud.google.com/kms/docs/crypto#macos)
```
export CLOUDSDK_PYTHON_SITEPACKAGES=1
```
3. Set environment variables to the desired values, for example:
```
export PROJECT_ID=my_project_id
export LOCATION=europe-west3
export CA_POOL=acme-sub-pool-europe
```

4. Non-ACME account should NOT be able to create certificate in acme.com domain:
```
gcloud privateca certificates create \
   --issuer-location ${LOCATION} \
   --issuer-pool ${CA_POOL} \
   --generate-key \
   --key-output-file .cert.key \
   --cert-output-file .cert.crt \
   --dns-san "team1.acme.com" \
   --template "projects/${PROJECT_ID}/locations/${LOCATION}/certificateTemplates/acme-sub-ca-europe-template" \
   --impersonate-service-account "non-acme-team-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

5. Non-ACME account should NOT be able to create certificate in other example.com domain:
```
gcloud privateca certificates create \
   --issuer-location ${LOCATION} \
   --issuer-pool ${CA_POOL} \
   --generate-key \
   --key-output-file .cert.key \
   --cert-output-file .cert.crt \
   --dns-san "team1.example.com" \
   --template "projects/${PROJECT_ID}/locations/${LOCATION}/certificateTemplates/acme-sub-ca-europe-template" \
   --impersonate-service-account "non-acme-team-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

6. ACME account should be able to create certificate in acme.com domain:
```
gcloud privateca certificates create \
   --issuer-location ${LOCATION} \
   --issuer-pool ${CA_POOL} \
   --generate-key \
   --key-output-file .cert.key \
   --cert-output-file .cert.crt \
   --dns-san "team1.acme.com" \
   --template "projects/${PROJECT_ID}/locations/${LOCATION}/certificateTemplates/acme-sub-ca-europe-template" \
   --impersonate-service-account "acme-team-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```
7. ACME account should NOT be able to create certificate in other example.com domain:
```
gcloud privateca certificates create \
   --issuer-location ${LOCATION} \
   --issuer-pool ${CA_POOL} \
   --generate-key \
   --key-output-file .cert.key \
   --cert-output-file .cert.crt \
   --dns-san "team1.example.com" \
   --template "projects/${PROJECT_ID}/locations/${LOCATION}/certificateTemplates/db-sub-ca-europe-template" \
   --impersonate-service-account "acme-team-sa@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Scaling CA Pool

1. Set environment variables
```
export PROJECT_ID=my_project_id
export LOCATION=europe-west3
export CA_POOL=acme-sub-pool-europe
export CONCURRENCY=2
export QPS=50
export TIME=15s
```

2. Run load test
```
./load-cas.sh $PROJECT_ID $LOCATION $CA_POOL $CONCURRENCY $QPS $TIME
```

The test uses [Fortio](https://github.com/fortio/fortio) to call CAS API concurrenly over HTTPS
to generate dummy certificates simulataing load on the CA Pool. The test will run for the time duration
defined by the `TIME` environment variable.

Check the outcome
```
142.251.39.106:443: 3
172.217.168.234:443: 3
142.251.36.42:443: 3
216.58.214.10:443: 3
172.217.23.202:443: 3
142.250.179.138:443: 3
216.58.208.106:443: 3
142.251.36.10:443: 3
142.250.179.202:443: 3
142.250.179.170:443: 3
Code 200 : 248 (89.2 %)
Code 429 : 30 (10.8 %)
Response Header Sizes : count 278 avg 347.91367 +/- 121 min 0 max 390 sum 96720
Response Body/Total Sizes : count 278 avg 6981.3165 +/- 2237 min 550 max 7763 sum 1940806
All done 278 calls (plus 4 warmup) 224.976 ms avg, 16.8 qps
```

Notice the portion of the requests returning 429 error, which indicated that the load exceeds the current CA pool throughput limit.

3. Add additional subordinate CA to the CA pool. For that, rename `cas-scaling.tf.sample` to `cas-scaling.tf` and run
```
terraform apply --auto-approve
```

4. Run the load test again
```
./load-cas.sh $PROJECT_ID $LOCATION $CA_POOL $CONCURRENCY $QPS $TIME
```

and check the outcome:
```
IP addresses distribution:
142.250.179.170:443: 1
172.217.23.202:443: 1
142.251.39.106:443: 1
172.217.168.202:443: 1
Code 200 : 258 (100.0 %)
Response Header Sizes : count 258 avg 390 +/- 0 min 390 max 390 sum 100620
Response Body/Total Sizes : count 258 avg 7759.624 +/- 1.497 min 7758 max 7763 sum 2001983
All done 258 calls (plus 4 warmup) 233.180 ms avg, 17.1 qps
```

Notice that there are no 429 errors in responses any more and the load can now be handled.

### Manual Subordinate CA activation

The [sub-activation.tf.sample](./sub-activation.tf.sample) file contains example Terraform configuration 
to perform manual Subordinate CA activaction. Use the Certificate Signing Request in the Terraform run output 
to sign using external Root Certificate Authority.

Set the `pem_ca_certificate` and `subordinate_config.pem_issuer_chain` fields in the [ca.tf](./modules/cas-ca/ca.tf) 
to the files obtained from the issuer.

## Clean up

You can clean up and free Google Cloud resources created with this project you can either
* Delete the Google Cloud project with all created resources
* Run the following command
```
terraform destroy
```

It is not possible to create new CAS resources with the same resource id as were already used before even 
of they were deleted by the `terraform destroy` command. The new deployment attempt to the same Google Cloud
project needs to use new resource names. Modify the values of the following variables in the [terraform.tfvars](./terraform.tfvars) 
file before running the demo deployment again:
* `root_pool_name`
* `sub_pool1_name`
* `sub_pool2_name`
* `root_ca_name`
* `sub_ca1_name`
* `sub_ca2_name`