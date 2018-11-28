<h2>Introduction</h2>
The purpose of this project is to demonstrate how to automate the process of viewing CUD/SUD commitment charges in GCP on a 
per-project basis to a BigQuery table. This helps to accurately view project cost, since currently when exporting billing 
data does not correctly attribute CUD/SUD commitment charges.

Currently, this data can be viewed by running a query in BigQuery on exported billing data and generating a new table with 
this transformed data. This example demonstrates how to automate this process to avoid manually executing the query.

In this example, a user can leverage Cloud Scheduler to schedule the recurring transformation query as a daily cron job. 
Next, the Cloud Scheduler job then publishes a message to a PubSub topic on execution time. A Cloud Function that is 
configured as a subscriber to this topic is then triggered by the PubSub message. The Cloud Function then calls the Python 
script, which performs the transformation query on the billing table and generates the new table with the CUD/SUD commitment 
charges.

<h2>Installation/Set-up</h2>
This project assumes that you already have project set up with billing data exported to BigQuery. Note the project id, dataset id, and the table name of project, as you will need it later on when configuring the Cloud Function source code.

<h3>Install/Configure the gcloud command line tool:</h3>

1. [Install and initialize the Cloud SDK](https://cloud.google.com/sdk/docs/how-to)

2. In a terminal window, enter the following to add the gcloud components for beta products
````
gcloud components install beta
````

3. Update all components:
````
gcloud components update
````

<h3>Create a new project for viewing the corrected data:</h3>

1. Open a terminal where you installed on the SDK and create a project

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

2. [Enable the Datastore API](https://console.cloud.google.com/datastore/welcome?_ga=2.58601962.-1918546401.1542306879)

3. [Enable the Cloud Scheduler API](http://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?_ga=2.212868180.-1918546401.1542306879)

4. [Enable the Cloud Pub/Sub API](https://pantheon.corp.google.com/flows/enableapi?apiid=pubsub)

5. [Enable the Cloud Functions API](https://pantheon.corp.google.com/flows/enableapi?apiid=cloudfunctions)

6. [Enable the BigQuery API](https://pantheon.corp.google.com/flows/enableapi?apiid=bigquery)


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
````

Change the values of billing_project_id, billing_dataset_id, billing_table_name, output_dataset_id, and output_table_name to your project's respective id, datasets, and tables in BigQuery. The output table will be created in this project, so you can choose any name that you would like. The remaining variables all must be customized for your project.


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
gcloud beta scheduler jobs create pubsub [JOB] --schedule [SCHEDULE] --topic [TOPIC_NAME] --message-body [MESSAGE_BODY]
````
where [JOB] is a unique name for a job, [SCHEDULE] is the frequency for the job in UNIX cron, such as "0 1 * * *" to run daily at 1AM UTC, [TOPIC_NAME] is the name of the topic created in the step above when you deployed the Cloud Function, and [MESSAGE_BODY] is any string. An example command would be: 
````
gcloud beta scheduler jobs create pubsub daily_job --schedule "0 1 * * *" --topic cron-topic --message-body "daily job"
````

<h3>Run the job:</h3>
You can test the workflow above by running the project now, instead of waiting for the scheduled UNIX time. To do this:

1. Open up the Cloud Scheduler page in the console.

2. Click the Run now button.

3. Open up BigQuery in the console.

4. Under your output dataset, look for your [output_table_name], this will contain the data.
