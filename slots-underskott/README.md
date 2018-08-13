##Slots Deficit Estimator
#Introduction
The purpose of this application is to provide large GCP organizations with a way to monitor slots usage and **deficits** across projects. The system uses BQ query plan explanation to calculate the deficits and relies on BQ API calls to fetch the timelines. The metrics gets written in to BigQuery tables. It is made to scale to thousands of projects and only requires initial setup.
The solution consists of two main components:

- slots-timeline.py: This script uses BQ Jobs api to collect timeline information about all the BQ jobs for all the projects.
- BQ Views: There are few views that will get installed which gives you slots usage and deficit data from minutes to seconds resolution.

#Instructions
###Initial steps and CI
* First thing you need to do is to create a project within your organization. Note down the project id, within this doc we'll refer to our project id as **my-project-id**.
* Enable billing on the account.
* The solution uses datastore to save internal metrics. You will need to manually go to datastore in https://console.cloud.google.com/datastore and create the database once.
* When you've done this take this entire project (folder) and push it to your own Cloud Source Repository within the project you just created.
* Now create a build trigger in Container Builder. This will build the container with python code does the periodic job queries via api and exports the query plan explanation timeline.
* When this is done, verify that you have an image in your GCR, called slots_deficits.
* You will need to create datastore from the UI.
* Initialize gcloud with **my-project-id**

###Service account & IAM permissioning
We will need to create two custom IAM roles; One for org level and one for project level.

* Let's call org level custom role **slots-deficit-org-role** and assign the following permissions:
```
bigquery.jobs.create
bigquery.jobs.get
bigquery.jobs.list
bigquery.jobs.listAll
resourcemanager.projects.get
Resourcemanager.projects.list```
These roles are needed in order to get BigQuery jobs information from all the projects, not just the project where this solution will reside.


* Let’s call project level role **slots-deficit-project-role** and assign the following permissions:
```
storage.buckets.get
storage.buckets.list
storage.objects.get
storage.objects.list```
These permissions are needed in order for kubernetes to fetch the images from GCE registry. The images are stored in GCS.

Now create a service account, called **slots-deficits-log-service**.
Give that service account the following project level role:
```
Slots-deficit-project-role
BigQuery Data Owner
Project Editor```

Now give it the following org level role (you will need to select the org from projectt selection and add a new user with the slots-deficits-log-service’s email):

```
Project Viewer
slots-deficit-org-role```

##Installing and deploying
Now as most of the scaffolding is done it's time to run the installation script (scripts/install.sh). This script will:

1. Create a dataset in your project.
2. Create relevant empty tables and views.
3. Create a 1 (n1-standard-2) node multi-regional GKE cluster inside your project.
4. Deploy slots-deficit-one-time and run this container once.
5. Deploy slots-deficit-hourly and run this container every six hour.

The script will need two variables: Project id and location where this data will be stored.

To run the script by providing the organization id, project id and dataset name like this:
```
./install.sh  -p slots-deficit -l US
```


