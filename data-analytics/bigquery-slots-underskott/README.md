# Slots Deficit Estimator
## Introduction
The purpose of this application is to provide large GCP organizations with a way to monitor slots usage and **deficits** across projects. The system uses BQ query plan explanation to calculate the deficits and relies on BQ API calls to fetch the timelines. The metrics gets written in to BigQuery tables. It is made to scale to thousands of projects and only requires initial setup.
The solution consists of two main components:

- slots-timeline.py: This script uses BQ Jobs api to collect timeline information about all the BQ jobs for all the projects.
- BQ Views: There are few views that will get installed which gives you slots usage and deficit data from minutes to seconds resolution.

## Instructions

### Service account & IAM permissioning
We will need to create two custom IAM roles; One for org level and one for project level. 
The org level role gives the abilitly for the service account fetch job information for all the projects within the organization.


* Let's call org level custom role **slots-deficit-org-role** and assign the following permissions:
```
bigquery.jobs.create
bigquery.jobs.get
bigquery.jobs.list
bigquery.jobs.listAll
resourcemanager.projects.get
Resourcemanager.projects.list```
These roles are needed in order to get BigQuery jobs information from all the projects, not just the project where this solution will reside.

```
* Let’s call project level role **slots-deficit-project-role** and assign the following permissions:
```
storage.buckets.get
storage.buckets.list
storage.objects.get
storage.objects.list 
```
These permissions are optional and needed if you are planning on wrapping this script in a docker container and deploying in kubernetes cluster. Its needed in order for kubernetes to fetch the images from GCE registry. The images are stored in GCS. 

Now create a service account, called **slots-deficits-log-service**.
Give that service account the following project level role:
```
Slots-deficit-project-role
BigQuery Data Owner
Project Editor
```
Now give it the following org level role (you will need to select the org from projectt selection and add a new user with the slots-deficits-log-service’s email):
```
Project Viewer
slots-deficit-org-role
```

## Manual Install and deploying
Now lets go through the installation steps. We will use the following parameter during the installation:

- The id of the project. Here referred to as ```{PROJECT_ID}```. An example project id is slots-underskott.

### Set project and create dataset
Our first step is to set gcloud to use our poject and create a dataset where script will write the job slots usage in a table. You need to come up with a name for the dataset and the table and write this down, from here on we'll use the name {DATASET_NAME} and {TABLE_NAME}. Do also choose an appropiate location for the dataset. In this example we use "EU", you might want to use another [location](https://cloud.google.com/bigquery/docs/dataset-locations). 
```
gcloud config set project {PROJECT_ID}
bq mk --location=EU -d {PROJECT_ID}:{DATASET_NAME}
bq mk -t --time_partitioning_field=time_window --time_partitioning_type=DAY {DATASET_NAME}.{TABLE_NAME} time_window:TIMESTAMP,pending_units:INTEGER,active_units:INTEGER,project_id:BYTES,job_id:BYTES,__index_level_0__:INTEGER
```
There are few helper queries in scripts/templates directory that will be useful to aggregate slots usage and deficits at seconds and minute interval per projects. You can install those as views by just replacing PROJECT_ID, dataset, and table names. 

### Install Datastore
The script uses datastore to save some internal data and this step of create the datastore is not currently supported by the api. 
* From the UI, go to Datastore from the menu bar and select "Cloud Datastore" from the database service. Select the appropriate location and click "Create Datababase." 

### Install VM and run the script
The easiest way to deploy this application is to create a vm instance with atleast 30GB of memory and that can run python. While you may not need that much memory, in our stress test, which scanned 600K job history, the script required about 20GB at its peak. The future version of this script will optimize on the memory requirements. 

* Create 8 vCPUs  30GB VM.
* Select the Service account you created in the above steps 
* SSH into the newly created instance
* Copy requirements.txt and slots-timeline.py in the vm.
* Install python (2.7x) and pip
* Install packages in requirements.txt by doing pip install -r requirements.txt
* Run slots-timeline.py by running the following command:
```
python slots_timeline.py --sink-dataset {DATASET_NAME} --sink-table {TABLE_NAME}
```
* The first time you run this job, it defaults to getting job history from past 30 days. Subsequent runs will fetch job history from the last time it ran.
* If you want to run this on periodic basis, create a cron job to run slots-timeline.py as frequently as needed.
* You should see the data in {DATASET_NAME}.{TABLE_NAME}
* Use the view template to see aggregated data by minute and by projects.
