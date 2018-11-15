<h2>Introduction</h2>
The purpose of this project is to demonstrate how to automate the process of viewing CUD/SUD commitment charges in GCP on a 
per-project basis to a BigQuery table. This helps to accurately view project cost, since currently when exporting billing 
data it does not display CUD/SUD commitment charges.


Currently, this data can be viewed by running a query in BigQuery on exported billing data and generating a new table with 
this transformed data. This example demonstrates how to automate this process to avoid manually executing the query.

In this example, a user can leverage Cloud Scheduler to schedule the recurring transformation query as a daily cron job. 
Next, the Cloud Scheduler job then publishes a message to a PubSub topic on execution time. A Cloud Function that is 
configured as a subscriber to this topic is then triggered by the PubSub message. The Cloud Function then calls the Python 
script, which performs the transformation query on the billing table and generates the new table with the CUD/SUD commitment 
charges.

<h2>Installation/Set-up</h2>
This project assumes that you already have billing data exported to BigQuery. Note the dataset id and the table name of 
this, as you will need it later on when configuring the Cloud Function source code.

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

<h3>Create a project with an App Engine app</h3>

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

3. Create the app:
````
gcloud app create
````

<h3>Open the GCP Console and enable the following:</h3>

1. [Enable billing](http://console.cloud.google.com/billing/?_ga=2.49090150.-1918546401.1542306879)

2. [Enable the Datastore API](https://console.cloud.google.com/datastore/welcome?_ga=2.58601962.-1918546401.1542306879)

3. [Enable the Cloud Scheduler API](http://console.cloud.google.com/apis/library/cloudscheduler.googleapis.com?_ga=2.212868180.-1918546401.1542306879)

4. [Enable the Cloud Pub/Sub API](https://pantheon.corp.google.com/flows/enableapi?apiid=pubsub)

5. [Enable the Cloud Functions API](https://pantheon.corp.google.com/flows/enableapi?apiid=cloudfunctions)

<h3>Set up Pub/Sub:</h3>

1. Set up a Pub/Sub topic to use a target for the cron job

````
gcloud pubsub topics create [TOPIC_NAME]
````

where [TOPIC_NAME] is the name of the Pub/Sub topic that you will use in the next step.
 
2. Create a Cloud Pub/Sub subscription to view the results of the job and eventually trigger the Cloud Function
````
gcloud pubsub subscriptions create [SUBSCRIPTION_NAME] --topic [TOPIC_NAME]
````
where [SUBSCRIPTION_NAME] is any name that you want to choose for a subscription and [TOPIC_NAME] is the name created in 
the previous step.

<h3>Set up Cloud Functions:</h3>

1. Clone this repo and open main.py in your chosen IDE.

2. Look at the top of the file after the comment about edits:

````python
# EDIT THESE WITH YOUR OWN DATASET/TABLES
dataset_id = 'billing_dataset'
billing_table_name = 'billing_data'
output_table_name = 'transformed_table'
````
change the values of dataset_id, billing_table_name, output_table_name to your project's respective datasets and tables.

3. In your terminal window, cd into the directory where you cloned the repository.

4. Enter the following in the terminal:
````
gcloud functions deploy [FUNCTION_NAME] --entry-point main --runtime python37 --trigger-topic [TOPIC_NAME]
````
where [FUNCTION_NAME] is the name that you want to give the function and [TOPIC_NAME] is the name of the topic created
when you configured Pub/Sub.


<h3>Set up Cloud Scheduler:</h3>

````
gcloud beta scheduler jobs create pubsub [JOB] --schedule=[SCHEDULE] --topic=[TOPIC_NAME] --message-body=[SAMPLE_MESSAGE]
````
where [JOB] is a unique ID for a job, [SCHEDULE] is the frequency for the job in UNIX cron, such as "0 1 * * *" to run daily 
at 1AM, and [TOPIC_NAME] is the name of the topic created when you configured Pub/Sub, [MESSAGE_BODY] is any string such 
as "Running daily job." An example command would be: 
````
gcloud beta scheduler jobs create pubsub daily_job --schedule "0 1 * * *" --topic cron-topic --message-body "daily job"
````

<h3>Run the job:</h3>
You can test the workflow above by running the project now, instead of waiting for the scheduled time. To do this:

1. Open up the Cloud Scheduler page in the console.

2. Click the Run now button.

3. Open up BigQuery in the console.

4. Under your dataset, look for your [output_table_name], this will contain the data.
