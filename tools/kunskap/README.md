<h2>Introduction</h2>

The purpose of this project is to demonstrate how to automate the process of viewing [Committed Use Discount (CUD)](https://cloud.google.com/compute/docs/instances/signing-up-committed-use-discounts) and [Sustained Use Discount (SUD)](https://cloud.google.com/compute/docs/sustained-use-discounts) charges in GCP on a
per-project basis in a BigQuery table. This helps to accurately view project cost, since currently when exporting billing
data, it does not correctly attribute CUD/SUD commitment charges.
<br></br>
Currently, this data can be viewed by running a query in BigQuery on exported billing data and generating a new table with
this transformed data. This example demonstrates how to automate this process to avoid manually executing the query.
<br></br>
In this example, a user can leverage Cloud Scheduler to schedule the recurring transformation query as a cron job which repeats every few hours.
Next, the Cloud Scheduler job then publishes a message to a PubSub topic on execution time. A Cloud Function that is
configured as a subscriber to this topic is then triggered by the PubSub message. The Cloud Function then calls a Python
script, which performs the transformation query on the billing table and generates the new table with the CUD/SUD commitment
charges.
<br></br>
The solution adjusts each project's cost by generating new line items in the output table, each of which represent a new SKU for reattribution. The purpose of this SKU is to amend the incorrect original per-project cost. The SKUs that are prefixed with "Reattribution_Negation_" subtract out the incorrect cost from the original billing table. The SKUs prefixed with "Reattribution_Addition_" then add in the newly generated correctly proportioned cost. These SKUs are generated for both CUD and SUD costs/credits.

<h2>Installation/Set-up</h2>
This project assumes that you already have project set up with billing data exported to BigQuery. Note the billing project id, dataset ids, and the table names, as you will need these later on when configuring the Cloud Function source code.

This project also assumes that you only have <b>one</b> billing account for your GCP organization.

<h3>Install/Configure the gcloud command line tool:</h3>

1. [Install and initialize the Cloud SDK](https://cloud.google.com/sdk/docs/how-to)

2. Update all components:
````
gcloud components update
````

<h3>Create a new project for viewing the corrected data:</h3>

1. Open a terminal where you installed on the SDK and create a <b>new</b> project

````
gcloud projects create [PROJECT_ID]
````

where [PROJECT_ID] is the ID for the project that you want to create.

2. Configure gcloud to use the project that you created

````
gcloud config set project [PROJECT_ID]
````
where [PROJECT_ID] is the ID that you created in the previous step.


<h3>Open the GCP Console and enable the following:</h3>

1. [Enable billing](http://console.cloud.google.com/billing/?_ga=2.49090150.-1918546401.1542306879)

2. [Enable the Cloud Scheduler API](http://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?_ga=2.212868180.-1918546401.1542306879)

3. [Enable the Cloud Pub/Sub API](https://console.cloud.google.com/flows/enableapi?apiid=pubsub)

4. [Enable the Cloud Functions API](https://console.cloud.google.com/flows/enableapi?apiid=cloudfunctions)

5. [Enable the BigQuery API](https://console.cloud.google.com/flows/enableapi?apiid=bigquery)


<h3>Set up BigQuery Permissions</h3>

1. In a terminal window, run the following to verify that a default App Engine service account was created when you enabled the Cloud Functions API.

````
gcloud iam service-accounts list
````
The output should display an email in the form of [PROJECT_ID]@appspot.gserviceaccount.com. Copy this email for the next step.

2. In the BigQuery UI, hover over the plus icon for your <b>billing</b> dataset.

3. Click "Share Dataset"

4. In the pop-up, enter the service account email from step 1. Give it permission <b>"Can View".</b>

5. Hover over the plus icon for the <b>output</b> dataset.

6. Click "Share Dataset"

7. In the pop-up, enter the service account email from step 1. Give it permission <b>"Can Edit".</b>


<h3>Edit Config Variables</h3>

1. Clone this repo and open config.py in your chosen IDE.

2. Look at the top of the file after the comment about edits:

````python
# EDIT THESE WITH YOUR OWN DATASET/TABLES
billing_project_id = 'project_id'
billing_dataset_id = 'billing_dataset'
billing_table_name = 'billing_data'
output_dataset_id = 'output_dataset'
output_table_name = 'transformed_table'
# You can leave this unless you renamed the file yourself.
sql_file_path = 'cud_sud_attribution_query.sql'


# There are two slightly different allocation methods that affect how the Commitment charge is allocated:


# Method 1: Only UTILIZED commitment charges are allocated to projects.
# (P_method_1_commitment_cost): Utilized CUD commitment charges are
# proportionally allocated to each project based on its share of total eligible
# VM usage during the time increment (P_usage_percentage). Any unutilized
# commitment cost remains unallocated (BA_unutilized_commitment_cost) and is
# allocated to the shell project.

# Method 2: ALL commitment charges are allocated to projects (regardless of utilization).
# (P_method_2_commitment_cost): All CUD commitment charges are
# proportionally allocated to each project based on its share of total eligible
# VM usage during the time increment (P_usage_percentage). All commitment cost
# is allocated into the projects proportionally based on the CUD credits that
# they consumed, even if the commitment is not fully utilized.
allocation_method = 'P_method_2_commitment_cost'
````

Change the values of billing_project_id, billing_dataset_id, billing_table_name, output_dataset_id, and output_table_name to your project's respective id, datasets, and tables in BigQuery. The output table will be created in this project, so you can choose any name that you would like. The remaining variables all must be changed for the values that already exist in your project.


<h3>Set up Cloud Functions:</h3>

1. In your terminal window, cd into the directory where you cloned the repository.

2. Enter the following in the terminal:
````
gcloud functions deploy [FUNCTION_NAME] --entry-point main --runtime python37 --trigger-resource [TOPIC_NAME] --trigger-event google.pubsub.topic.publish --timeout 540s
````
where [FUNCTION_NAME] is the name that you want to give the function and [TOPIC_NAME] is the name of the topic that you want to create in Pub/Sub.


<h3>Set up Cloud Scheduler:</h3>

1. Open a terminal window. Make sure that you are still in the kunskap directory.

2. In the window, enter:

````
gcloud scheduler jobs create pubsub [JOB] --schedule [SCHEDULE] --topic [TOPIC_NAME] --message-body [MESSAGE_BODY]
````
where [JOB] is a unique name for a job, [SCHEDULE] is the frequency for the job in UNIX cron, such as "0 */12 * * *" to run every 12hours, [TOPIC_NAME] is the name of the topic created in the step above when you deployed the Cloud Function, and [MESSAGE_BODY] is any string. An example command would be:
````
gcloud scheduler jobs create pubsub daily_job --schedule "0 */12 * * *" --topic cron-topic --message-body "bi-daily job"
````

<h3>Run the job:</h3>
You can test the workflow above by running the project now, instead of waiting for the scheduled UNIX time. To do this:

1. Open up the Cloud Scheduler page in the console.

2. Click the Run now button.

3. Open up BigQuery in the console.

4. Under your output dataset, look for your [output_table_name], this will contain the data.
