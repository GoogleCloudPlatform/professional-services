# serverless
Google Cloud Platform (GCP) serverless computing example

# Summary
This repository contains resources for tracking static IP changes on a Google Cloud Platform (GCP) virtual machine VM. When a static IP change is detected, the affected VM is migrated within the GCP environment. The practical purpose of this is to repair a VM that is failing to register its new static IP address.

# Installation
1. Login to your GCP environment
2. Open a [Cloud Shell](https://cloud.google.com/shell/docs/using-cloud-shell) terminal
3. Clone this repo into your Cloud Shell terminal
4. Change the PROJECT_ID variable so that your own GCP project ID is assigned
5. Change the SUBNET variable so that your own Virtual Private Cloud (VPC) [subnet](https://cloud.google.com/vpc/docs/using-vpc) is assigned
6. Execute the gcloud_script.sh shell script
7. Check that your Pub/Sub topic and Cloud Function were created correctly

# Usage
1. [Manually attach a different external IP](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address#IP_assign) to one of the VMs
2. This static IP change should generate a Stackdriver event, which is captured by the Cloud Function
3. The Cloud Function will perform a VM migration event, which in turn is tracked by Stackdriver

# Debugging
Please see the contents of the debugging folder, for resources to debug Google Cloud Functions

## Debugging Instructions
1. Clone this repo to your workspace
2. Navigate to the debugging folder
3. Edit the prepare_log.sh script, adding in your Google Cloud Platform (GCP) specific values for project ID, zone, region and virtual machine (VM) instance ID
4. Run prepare_log.sh, which will produce a file called prepared_log.json
5. In the GCP console, create a Python 3 Cloud Function, the "Trigger" will be "Cloud Pub/Sub" and the "Topic" will be the one created in the above Installation steps; for "Source code" select "Inline editor" and for "Runtime" select "Python 3.x"
6. Copy-paste the contents of debugger/main.py into the "main.py" field
7. Continue creating the Cloud Function, naming it and the "Function to execute" as test_migrate_vm
8. Once the Cloud Function is created, navigate to the "Testing" sub-tab
9. Copy paste the contents of prepared_log.sh into the "Triggering event" textbox
10. Click the "Test the function" button
11. On correct execution, the "Output" should be "OK" and logs should be generated
12. The print statement at the end of the Python code will output to Stackdriver log
