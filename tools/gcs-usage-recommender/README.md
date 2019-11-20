<h1>GCS Usage Recommender</h1>


<h2>1. Overview</h2>

<h3> 1.1 GCS Audit Logs </h3>
An organization-level audit log sink captures create and delete events on any GCS bucket, and stores those into daily tables (cloudaudit_googleapis_com_activity_<date>) in a BigQuery dataset. These events include relevant metadata about the object such as labels, location, and details about where the request is coming from.

The audit logs will have separate entries for the creation and read of an object, but these entries are generic audit log entries and we’ll need to do some additional work to surface the metadata interesting to us. As an example, the audit log doesn’t record the actual storage class or size of the object.

<h2>2. Set-up/Prerequisites</h2>

<h3> 2.1 Prerequsitites</h3>
Before starting, let’s gather some prerequisite information.

* `PROJECT_ID`: The ID of the project
* `BQ_LOCATON`: BigQuery location to use for your dataset
* `ORG_NUMBER`: The numeric id of the organization. Find yours by invoking `gcloud organizations list`
Now export them as environment variables in your Cloud Shell for subsequent use.

<h3> 2.2 Permissions </h3>
To follow these interactive instructions, you will need permissions to:

````bash
export PROJECT_ID=gcsusagerecommder
export BQ_LOCATION=EU
export ORG_NUMBER=622243302570
````

* Create and manage a BQ dataset in the project you’ve chosen
  * bigquery.datasets.create
  * bigquery.tables.create
  * bigquery.tables.getData
  * bigquery.tables.updateData

And you will need permissions at the organization level to:

* Create an organization-level audit log sink
  * roles/logging.configWriter

* Scan your inventory:
  * storage.buckets.get
  * storage.buckets.list
  * storage.objects.get
  * storage.objects.list
  * resourcemanager.organizations.get
  * resourcemanager.projects.get
  * resourcemanager.projects.list

You will need these permissions only during initial setup.

<h2> 2.3 Preparing the audit log dataset</h2>
Let’s walk through the steps necessary to create and populate the dataset.

<h3> 2.3.1 Creating the dataset </h3>
Now, let’s create the dataset inside the project.

``bq mk --location=${BQ_LOCATION} -d "${PROJECT_ID}:gce_usage_log"``

<h3> 2.3.2 Create the audit log sink </h3>

````bash
gcloud logging sinks create gce_usage \
  bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/gce_usage_log \
  --log-filter='resource.type="gce_instance" AND
  (protoPayload.methodName:"compute.instances.insert" OR
  protoPayload.methodName:"compute.instances.delete")' \
  --organization=${ORG_NUMBER} --include-children
````

This command will create and return a service account ID, such as serviceAccount:o125240632470-886280@gcp-sa-logging.iam.gserviceaccount.com.

Note down the account name, as we'll use it in the next step!

<h3> 2.3.3 Allow the service account to write to our dataset </h3> 
Taking the service account created in the last step, let’s assign to it the narrowest privileges on our dataset - in this case, 
“BigQuery Data Editor.”

This can be done a number of ways, and here we’ll just follow the [manual process](https://cloud.google.com/bigquery/docs/dataset-access-controls#controlling_access_to_a_dataset).

<h3> 2.3.4 Test that the dataset is receiving audit log entries </h3>
Create a GCS object in any project in your GCP organization, and you should see an entry arrive in the `gcs_usage_recommender` 
dataset.

The daily BigQuery tables named `cloudaudit_googleapis_com_activity_<date>` will appear in your project the first time a GCS 
object is created or read after the audit log sink is created. If you are not seeing tables being created, you may have a 
permissions issue. Troubleshoot by looking at [your project activity](your project activity) in the project where you created the instance. There you 
should see your audit log sink service account creating the daily audit log BigQuery table.

<h2>2.4 Scanning for existing GCS objects</h2>
At this point, you are collecting the raw audit log events representing creating or reading of GCS objects. The missing 
link, however, is the events for the set of objects which were created before the sink started generating these events.

We’ll run a process to populate a new, separate table in our dataset with an inventory of the currently exisiting objects
in your GCP organization to fill in this missing link.

This process only needs to be run once and would benefit from a low-latency network location to GCP. In our example we will 
run it in the cloud shell.

<h3> 2.4.1 Clone the code repository </h3>

Clone `https://github.com/GoogleCloudPlatform/professional-services`
and `cd tools/gce-usage-log` 
to access the directory inside the repository.

<h2> 2.4.2 Authenticate your shell session </h2>
You'll need to authenticate yourself to be allowed to call APIs.

`gcloud auth application-default login`

<h2> 2.4.3 Run the process </h2>
This process uses the CloudResourceManager APIs to fetch all the projects your account has access to. Please ensure that 
your account only has access to a single GCP organization, otherwise you will fetch projects from multiple orgs.

Execute the process:
#TODO
