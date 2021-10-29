# Quota Monitoring and Alerting 
> An easy-to-deploy Data Studio Dashboard with alerting capabilities, showing usage and quota limits in an organization or folder.

Google Cloud enforces [quotas](https://cloud.google.com/docs/quota) on resource usage for project owners, setting a limit on how much of a particular Google Cloud resource your project can use. Each quota limit represents a specific countable resource, such as the number of API requests made per day to the number of load balancers used concurrently by your application.
Quotas are enforced for a variety of reasons:
- To protect the community of Google Cloud users by preventing unforeseen spikes in usage.
- To help you manage resources. For example, you can set your own limits on service usage while developing and testing your applications.

We are introducing a new custom quota monitoring and alerting solution for Google Cloud customers.
## 1. Summary
Quota Monitoring Solution is a stand-alone application of an easy-to-deploy Data Studio dashboard with alerting capabilities showing all usage and quota limits in an organization or folder.
### 1.1 Four Initial Features
<img src="img/quota_monitoring_key_features.png" align="center" />

*The data refresh rate depends on the configured frequency to run the application.
## 2. Architecture
<img src="img/quota-monitoring-alerting-architecture.png" align="center" />

The architecture is built using Google Cloud managed services - Cloud Functions, Pub/Sub, Dataflow and BigQuery. 
- The solution is architected to scale using Pub/Sub.
- Cloud Scheduler is used to trigger Cloud Functions. This is also an user interface to configure frequency, parent nodes, alert threshold and email Ids. Parent node could be an organization Id, folder id, list of organization Ids or list of folder Ids.
- Cloud Functions are used to scan quotas across projects for the configured parent node.
- BigQuery is used to store data. 
- Alert threshold will be applicable across all metrics. 
- Alerts can be received by Email, Mobile App, PagerDuty, SMS, Slack, Web Hooks and Pub/Sub. Cloud Monitoring custom log metric has been leveraged to create Alerts.
- Easy to get started and deploy with Data Studio Dashboard. In addition to Data Studio, other visualization tools can be configured. 
- The Data Studio report can be scheduled to be emailed to appropriate team for weekly/daily reporting.
## 3. Deployment Guide
### Content
- [3.1 Prerequisites](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#31-prerequisites)
- [3.2 Initial Setup](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#32-initial-setup)
- [3.3 Create Service Account](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#33-create-service-account)
- [3.4 Grant Roles to Service Account](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#34-grant-roles-to-service-account)
  - [3.4.1 Grant Roles in the Host Project](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#341-grant-roles-in-the-host-project)
  - [3.4.2 Grant Roles in the Target Folder](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#342-grant-roles-in-the-target-folder)
  - [3.4.3 Grant Roles in the Target Organization](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#343-grant-roles-in-the-target-organization)
- [3.6 Download Service Account Key File](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#35-download-service-account-key-file)
- [3.5 Download Terraform File](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#36-download-terraform-file)
- [3.7 Configure Terraform](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#37-configure-terraform)
- [3.8 Run Terraform](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#38-run-terraform)
- [3.9 Testing](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#39-testing)
- [3.10 Data Studio Dashboard setup](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#310-data-studio-dashboard-setup)
- [3.11 Scheduled Reporting](https://github.com/anuradha-bajpai-google/professional-services/new/main/tools/quota-monitoring-alerting#311-scheduled-reporting)
### 3.1 Prerequisites
1. Host Project - A project where the BigQuery instance, Cloud Function and Cloud Scheduler will be deployed. For example Project A. 
2. Target Node - The Organization or folder or project which will be scanned for Quota Metrics. For example Org A and Folder A.
3. Project Owner role on host Project A. IAM Admin role in target Org A and target Folder A.
4. Google Cloud SDK is installed. Detailed instructions to install the SDK [here](https://cloud.google.com/sdk/docs/install#mac). See the Getting Started page for an introduction to using gcloud and terraform. 
5. Terraform version >= 0.14.6 installed. Instructions to install terraform here
    - Verify terraform version after installing 

```
terraform -version
```
The output should look like:
```
Terraform v0.14.6
+ provider registry.terraform.io/hashicorp/google v3.57.0
```
*Note - Minimum required version v0.14.6. Lower terraform versions may not work.*
### 3.2 Initial Setup
1. In local workstation create a new directory to run terraform and store credential file
```
mkdir <directory name like quota-monitoring-dashboard>
cd <directory name>
```
2. Set default project in config to host project A
```
gcloud config set project <HOST_PROJECT_ID>
```
The output should look like:
```
Updated property [core/project].
```
3. Ensure that the latest version of all installed components is installed on the local workstation.
```
gcloud components update
```
4. Cloud Scheduler depends on the App Engine application. Create an app engine application in the host project. Replace the region. List of regions where App-Engine is available can be found [here](https://cloud.google.com/about/locations#region).
```
gcloud app create --region=<region>
```
Note: Cloud Scheduler (below) needs to be in the same region as App Engine. Use the same region in terraform as mentioned here. Also, selected region should have a VPC subnet available in the region for the DataFlow deployment.
The output should look like:
```
You are creating an app for project [quota-monitoring-project-3].
WARNING: Creating an App Engine application for a project is irreversible and the region
cannot be changed. More information about regions is at
<https://cloud.google.com/appengine/docs/locations>.

Creating App Engine application in project [quota-monitoring-project-1] and region [us-east1]....done.                                                                                                                               
Success! The app is now created. Please use `gcloud app deploy` to deploy your first app.

```
### 3.3 Create Service Account
1. In local workstation, setup environment variables. Replace the name of the Service Account in the commands below
```
DEFAULT_PROJECT_ID=$(gcloud config get-value core/project 2> /dev/null)
export SERVICE_ACCOUNT_ID="sa-"$DEFAULT_PROJECT_ID 
export DISPLAY_NAME="sa-"$DEFAULT_PROJECT_ID 
```
2. Verify host project Id.
```
echo $DEFAULT_PROJECT_ID
```
3. Create Service Account
```
gcloud iam service-accounts create $SERVICE_ACCOUNT_ID --description="Service Account to scan quota usage" --display-name=$DISPLAY_NAME
```
The output should look like:
```
Created service account [sa-quota-monitoring-project-1].
```
### 3.4 Grant Roles to Service Account
#### 3.4.1 Grant Roles in the Host Project
1. Following roles should be added to the Service Account in the host project i.e. Project A:
- BigQuery
  - BigQuery Data Editor
  - BigQuery Job User
- Cloud Functions
  - Cloud Functions Admin
- Cloud Scheduler
  - Cloud Scheduler Admin
- Pub/Sub 
  - Pub/Sub Admin
- Run Terraform
  - Service Account User
  - Enable APIs
  - Service Usage Admin 
- Storage Bucket
  - Storage Admin
- Scan Quotas
  - Cloud Asset Viewer
  - Compute Network Viewer
  - Compute Viewer
- Monitoring
  - Notification Channel Editor
  - Alert Policy Editor
  - Viewer
  - Metric Writer
- Logs
  - Logs Configuration Writer	
  - Log Writer
- IAM
  - Security Admin

2. Run following commands to assign the roles:
```
gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/bigquery.dataEditor" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/bigquery.jobUser" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudfunctions.admin" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudscheduler.admin" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/pubsub.admin" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/iam.serviceAccountUser" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/storage.admin" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/serviceusage.serviceUsageAdmin" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudasset.viewer" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/compute.networkViewer" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/compute.viewer" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/monitoring.notificationChannelEditor" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/monitoring.alertPolicyEditor" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/logging.configWriter" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/logging.logWriter" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/monitoring.viewer" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/monitoring.metricWriter" --condition=None

gcloud projects add-iam-policy-binding $DEFAULT_PROJECT_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/iam.securityAdmin" --condition=None
```

#### 3.4.2 Grant Roles in the Target Folder
1. SKIP THIS STEP IF THE FOLDER IS NOT THE TARGET TO SCAN QUOTA. 

If you want to scan projects in the folder,  add following roles to the Service account created in the previous step at the target folder A:
- Cloud Asset Viewer
- Compute Network Viewer
- Compute Viewer
- Folder Viewer
- Monitoring Viewer

2. Set target folder id
```
export TARGET_FOLDER_ID=<target folder id like 38659473572>
```
3. Run following command
```
gcloud alpha resource-manager folders add-iam-policy-binding  $TARGET_FOLDER_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudasset.viewer"

gcloud alpha resource-manager folders add-iam-policy-binding  $TARGET_FOLDER_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/compute.networkViewer"

gcloud alpha resource-manager folders add-iam-policy-binding  $TARGET_FOLDER_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/compute.viewer"

gcloud alpha resource-manager folders add-iam-policy-binding  $TARGET_FOLDER_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/resourcemanager.folderViewer"

gcloud alpha resource-manager folders add-iam-policy-binding  $TARGET_FOLDER_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/monitoring.viewer"
```

Note: If this fails, run the commands again

#### 3.4.3 Grant Roles in the Target Organization
1. SKIP THIS STEP IF THE ORGANIZATION IS NOT THE TARGET. 

If you want to scan projects in the org, add following roles to the Service account created in the previous step at the Org A:
- Cloud Asset Viewer
- Compute Network Viewer
- Compute Viewer
- Org Viewer
- Folder Viewer
- Monitoring Viewer

<img src="img/service_account_roles.png" align="center" />

2. Set target organization id
```
export TARGET_ORG_ID=<target org id ex. 38659473572>
```
3. Run following commands
```
gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com" --role="roles/cloudasset.viewer" --condition=None

gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com"  --role="roles/compute.networkViewer" --condition=None

gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com"  --role="roles/compute.viewer" --condition=None

gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com"  --role="roles/resourcemanager.folderViewer" --condition=None

gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com"  --role="roles/resourcemanager.organizationViewer" --condition=None

gcloud organizations add-iam-policy-binding  $TARGET_ORG_ID --member="serviceAccount:$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com"  --role="roles/monitoring.viewer" --condition=None
```
### 3.5 Download Service Account Key File
Create Service Account key from host project A. The service account key file will be downloaded to your machine as CREDENTIALS_FILE.json. After you download the key file, you cannot download it again.
```
gcloud iam service-accounts keys create CREDENTIALS_FILE.json \
    --iam-account=$SERVICE_ACCOUNT_ID@$DEFAULT_PROJECT_ID.iam.gserviceaccount.com
```
### 3.6 Download Terraform File
1. Download terraform file
```
mkdir terraform
cd terraform
gsutil cp gs://quota-monitoring-solution-demo-bucket/main.tf .
gsutil cp gs://quota-monitoring-solution-demo-bucket/variables.tf .
gsutil cp gs://quota-monitoring-solution-demo-bucket/terraform.tfvars .
```
2. Verify that you have these 4 files in your local directory:
   - CREDENTIALS_FILE.json
   - terraform/main.tf
   - terraform/variables.tf
   - terraform/terraform.tfvars
### 3.7 Configure Terraform
1. Open terraform.tfvars file in your favourite editor and change values for the variable 
2. Values for variable source_code_bucket_name, source_code_zip and source_code_notification_zip are for source code zip in the storage bucket. These are links to the Cloud Function source code. If you want to upgrade to latest code changes everytime you run 'terraform apply', change to this code source repository. DO NOT CHANGE if you do not want to receive latest code changes while running 'terraform apply' everytime after deployment. 
3. For region, use the same region as used for app engine in earlier steps.
```
vi terraform.tfvars
```
<img src="img/edit_terraform_variables.png" align="center" />

### 3.8 Run Terraform
1. Run terraform commands
   - terraform init
   - terraform plan
   - terraform apply 
     - On Prompt Enter a value: yes

2. This will:
   - Enable required APIs
   - Create all resources and connect them. 
*Note: In case terraform fails, run terraform plan and terraform apply again*
### 3.9 Testing
1. Click ‘Run Now’ on Cloud Job scheduler. 

*Note: The status of the ‘Run Now’ button changes to ‘Running’ for a fraction of seconds. *
<img src="img/run_cloud_scheduler.png" align="center" />

2. To verify that the program ran successfully, check the BigQuery Table. The time to load data in BigQuery might take a few minutes. The execution time depends on the number of projects to scan. A sample BigQuery table will look like this:
<img src="img/test_bigquery_table.png" align="center" />

### 3.10 Data Studio Dashboard setup
1. Go to the [Data studio dashboard template](https://datastudio.google.com/reporting/61f8c09f-c593-4950-afa9-c290180482c9) . If this link is not accessible, reach out to pso-quota-monitoring@google.com to share the dashboard template with your email id. A data studio dashboard will look like this:
<img src="img/ds_template.png" align="center" />
2. Make a copy of the template from the copy icon at the top bar (top - right corner)
<img src="img/ds_copy.png" align="center" />
3. Click on ‘Copy Report’ button
<img src="img/ds_copy_report.png" align="center" />
4. This will create a copy of the report and open in Edit mode. If not click on ‘Edit’ button on top right corner in copied template:
<img src="img/ds_template_copy.png" align="center" />
5. Select any one table like below ‘Disks Total GB - Quotas’ is selected. On the right panel in ‘Data’ tab, click on icon ‘edit data source’
<img src="img/ds_edit_data_source.png" align="center" />
It will open the data source details
<img src="img/ds_datasource_config_step_1.png" align="center" />
6. In the panel, select BigQuery project, dataset id and table name
<img src="img/ds_edit_data_source_big_query.png" align="center" />
7. Verify the query by running in BigQuery Editor to make sure query returns right results and there are no syntax errors:
Note: Replace BigQuery project id, dataset id and table name:

```
SELECT
  project_id,
  region,
  metric,
  HOUR,
  CASE
    WHEN q_limit='9223372036854775807' THEN 'unlimited'
  ELSE
  q_limit
END
  AS q_limit,
  usage,
  ROUND((SAFE_DIVIDE(CAST(t.usage AS BIGNUMERIC),
        CAST(t.q_limit AS BIGNUMERIC))*100),2) AS consumption
FROM (
  SELECT
    project_id,
    region,
    metric,
    DATE_TRUNC(addedAt, HOUR) AS HOUR,
    MAX(CASE
        WHEN mv_type='limit' THEN m_value
      ELSE
      NULL
    END
      ) AS q_limit,
    MAX(CASE
        WHEN mv_type='usage' THEN m_value
      ELSE
      NULL
    END
      ) AS usage,
  FROM
    `quota-monitoring-project-34.quota_monitoring_dataset`.quota_monitoring_table
  WHERE DATE(addedAt) = CURRENT_DATE()
  GROUP BY
    1,
    2,
    3,
    4 ) t
WHERE
  usage != 'null'
  AND q_limit != 'null'
  AND usage != '0'
  AND q_limit != '0'
````

8. After making sure that query is returning results, replace it in the Data studio, click on the ‘Reconnect’ button in the data source pane.
<img src="img/ds_data_source_config_step_3.png" align="center" />
9. In the next window, click on the ‘Done’ button.
<img src="img/ds_data_source_config_step_2.png" align="center" />
10. Click on ‘Region’ tab and repeat steps from 5 - 9 above with different query:
<img src="img/ds_region_datasource_config.png" align="center" />
And query is as follows: (Replace the project id, dataset id and table name and verify query running in Bigquery editor)

```
SELECT t.threshold, t.region, t.usage, u.limit, t.metric, MAX(t.addedAt) addedAt, t.project, ((cast(t.usage as BIGNUMERIC)/cast(u.limit as BIGNUMERIC))*100) as consumption FROM quota-monitoring-solution-29.quota_monitoring_dataset.quota_monitoring_table AS t
JOIN quota-monitoring-solution-29.quota_monitoring_dataset.quota_limit_table AS u ON t.metric = u.metric AND t.project = u. project 
WHERE u.limit not like "0%"
GROUP BY
    t.org_id,
    t.project,
    t.metric,
    t.region,
    t.vpc_name,
    t.targetpool_name,
    t.threshold,
    t.usage, 
    u.limit
```

11. Once the data source is configured, click on the ‘View’ button on the top right corner. 
Note: make additional changes in the layout like which metrics to be displayed on Dashboard, color shades for consumption column, number of rows for each table etc in the ‘Edit’ mode.
<img src="img/ds_switch_view_mode.png" align="center" />

### 3.11 Scheduled Reporting
Quota monitoring reports can be scheduled from the Data Studio dashboard using ‘Schedule email delivery’. The screenshot of the Data studio dashboard will be delivered as a pdf report to the configured email Ids.

<img src="img/datastudio_schedule_email.png" align="center" />

### 3.11 Alerting
The alerts about services nearing their quota limits can be configured to be sent via email as well as following external services:
- Slack
- PagerDuty
- SMS
- Custom Webhooks

#### 3.11.1 Slack Configuration
To configure notifications to be sent to a Slack channel, you must have the Monitoring NotificationChannel Editor role on the host project.

##### 3.11.1.1 Create Notification Channel
1. In the Cloud Console, use the project picker to select your Google Cloud project, and then select Monitoring, or click the link here: Go to Monitoring
2. In the Monitoring navigation pane, click  Alerting.
3. Click Edit notification channels.
4. In the Slack section, click Add new. This brings you to the Slack sign-in page:
  - Select your Slack workspace.
  - Click Allow to enable Google Cloud Monitoring access to your Slack workspace. This action takes you back to the Monitoring configuration page for your notification channel.
  - Enter the name of the Slack channel you want to use for notifications.
  - Enter a display name for the notification channel.
5. In your Slack workspace:
  - Invite the Monitoring app to the channel by sending the following message in the channel:
  - /invite @Google Cloud Monitoring
  - Be sure you invite the Monitoring app to the channel you specified when creating the notification channel in Monitoring.

##### 3.11.1.2 Configuring Alerting Policy
1. In the Alerting section, click on Policies.
2. Find the Policy named ‘Resource Reaching Quotas’. This policy was created via Terraform code above.
3. Click Edit.
4. It opens an Edit Alerting Policy page. Leave the current condition metric as is, and click on Next.
5. In the Notification Options, Select the Slack Channel that you created above.
6. Click on Save.

You should now receive alerts in your Slack channel whenever a quota reaches the specified threshold limit.

## 4. Release Note

### 4.1 V4: Quota Monitoring across GCP services

#### New
- The new version provides visibility into Quotas across various GCP services beyond the original GCE (Compute). 
- New Data Studio Dashboard template reporting metrics across GCP services

#### Known Limitations
- The records are grouped by hour. Scheduler need to be configured to start running preferably at the beginning of the hour. 
- Out of the box solution is configured to scan quotas ‘once every day’. The SQL query to build the dashboard uses current date to filter the records. If you change the frequency, make changes to the query to rightly reflect the latest data. 

## 5. What is Next?
1. List top ten quota metrics with highest usage on the Dashboard
2. Graphs (Quota utilization over a period of time)
3. Search project, folder, org, region
4. Threshold configurable for each metric

## 5. Contact Us
For any comments, issues or feedback, please reach out to us at pso-quota-monitoring@google.com




	


