# Automating Cloud DNS for VM Instances Tool

## 1. Overview
Using this document you will learn how to automate the creation and deletion of DNS ‘A’ records for compute instances on Google Cloud Platform.  We will use several GCP services to monitor virtual machine changes and act on specific events during their lifecycle. 

The procedure involves the following steps:

1. Creation of service account(s)
2. Enable & Configure Cloud Asset Inventory (CAI) and Pub/Sub
3. Deploy Cloud Function and Pub/Sub Trigger

We will use the command line gcloud utility to configure and deploy all of the services. Installation for various environments can be found at https://cloud.google.com/sdk/install. Once installed you will need to authenticate & configure it:

```
gcloud auth login
```

This will open a browser window and you will log in using your existing GCP user account. Once complete you can list the current gcloud configuration:

```
gcloud config list
```

### Example output:

```bash
[compute]
region = us-central1
zone = us-central1-a
[core]
account = user@domain
disable_usage_reporting = True
project = a_project_id

Your active configuration is: [default]
```	

Update the project, region and zone to reflect where you want to deploy the resources you will provision. We will use variables set in prior code blocks so stay in the same terminal for doing all of the work.

## 2. Create Service Accounts
You will need one or more service accounts for integrating the various services. You can create a single account and use it across Cloud Asset Inventory & Cloud Functions or create two separate ones. In this example we will create two separate accounts.

### 2.1 SA Creation
The following set of commands will create two service accounts and configure them with permissions to enable all of the functionality we need. Update your project name and change the names and descriptions of the service accounts if needed.
The two service accounts will be owner/admin for their respective services in the project so it is critical to manage who can deploy code or use the accounts.

```bash
PROJECT=[project_id_here]
CAI_SA_NAME="cloud-asset-inventory-sa"
CAI_SA_DESC="Service Account for CAI"
CAI_SA_DISP="Cloud Asset Inventory SA"

gcloud iam service-accounts create $CAI_SA_NAME \
   --description "$CAI_SA_DESC" \
   --display-name "$CAI_SA_DISP"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${CAI_SA_NAME}@${PROJECT}.iam.gserviceaccount.com" \
  --role=roles/cloudasset.owner

CAI_CF_SA_NAME="cai-cloud-function-dns-sa"
CAI_CF_SA_DESC="SA for CAI Cloud Function DNS"
CAI_CF_SA_DISP="CAI Cloud Function DNS SA"

gcloud iam service-accounts create $CAI_CF_SA_NAME \
   --description "$CAI_CF_SA_DESC" \
   --display-name "$CAI_CF_SA_DISP"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:${CAI_CF_SA_NAME}@${PROJECT}.iam.gserviceaccount.com" \
  --role=roles/dns.admin
```

## 3. Configure Cloud Asset Inventory & Pub/Sub
Now that we have some service accounts to use we can move to setting up the services we need. In order to track changes in your inventory you must first enable the CAI API and then create a service account and  configure one or more feeds that target the resource type you are interested in.

### 3.1 Enable/Configure CAI & Pub/Sub

gcloud services enable cloudasset.googleapis.com
gcloud services enable pubsub.googleapis.com

Now let’s create a pub/sub topic to collect all of the information we want to take action on:

```bash
TOPIC="cloud-assets-to-inventory"

gcloud pubsub topics create $TOPIC
```

You can create a feed that monitors a project, folder or organization. Let’s create the inventory feed and wire it up to the topic:

```bash
FEED="vm-to-dns"

gcloud asset feeds create quick_start_feed --project=$PROJECT \
	--content-type=resource \
	--asset-types="compute.googleapis.com/Instance" \
	--pubsub-topic="projects/${PROJECT}/topics/${TOPIC}"
```

The default Cloud Asset Inventory service account has publisher permissions on all pub/sub topics within your project by default. At this point if you were to create an instance you should see several messages populate the topic within 10-15 minutes.

## 4. Cloud Function & Trigger
We have data flowing into the Pub/Sub topic and now we need some code to take action on it. 

### 4.1 Deploy Function
Clone this repository and then deploy your function with the following command. You should not allow unauthorized access. If you change FUNCTION_NAME be sure to update the code in main.py and change the exported function name.

```bash
FUNCTION_NAME="vmToDNS"

gcloud functions deploy $FUNCTION_NAME \
  --runtime python37 \
  --trigger-topic $TOPIC
```

#### Note - you do NOT need to allow unauthorized access - answer NO at the prompt
