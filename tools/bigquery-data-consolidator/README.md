# GCP BigQuery Table Consolidator

## Introduction

This is an Utility application to consolidate multiple tables from different projects into single project and dataset in BigQuery, under the same GCP organization. 
This application is seful for Cloud FinOps use cases or for any other Data engineering needs. 

Part of this utility:

- We create the required Project and BigQuery dataset as our "target" for consolidating all other tables in all other GCP projects under the same organization. 
- Further we create the Service account with Viewer Role on Organization level, so that we can easily find/copy the tables which we require. 
- Lastly, we run the application by authenticating and by installing the requisite Python libraries. 

## Environment

For known/unknown reasons, many of our reusable tools do not work well in local environments even with gcloud SDK setup. 

Hence, we suggest using the application/utility as of now primarily USING GCLOUD SHELL. Accordingly, all the command line options and commands mentioned in this guide are to be executed either from within the Cloud Shell or from Local system as preferred (with all relevant SDKs being installed as an additional pre-requisite). 

Once in Cloud Shell via Google Cloud UI/Console, please download the contents of this repository, by cloning it. 
We recommend Forking the repository and then adding SSH keys for authentication, before using the relevant "git clone" commands. 

## GCP Projects

Other than the various different projects in our organization where we already have tons of tables and datasets in BigQuery, we need to manually create a BigQuery dataset for data consolidation purposes. 

This BigQuery dataset should ideally be created in a separate project (considering proper access management can be applied using IAM permissions). 

Once this is created, please take a note of the project-id and dataset-id for further use in this application. 

Note, that part of the application's run(s), the tables will be created automatically, hence please refrain from creating any initial tables, although this would not stop or halt the application programmatically during execution. 

## Python Requirements

Since this utility is majorly written in Python, we require the below set of libraries to authenticate and use Google Cloud platform services. 

- google-api-core                       2.11.0
- google-api-python-client              2.77.0
- google-auth                           2.16.0
- google-auth-httplib2                  0.1.0
- google-auth-oauthlib                  0.4.6
- google-cloud-bigquery                 3.5.0
- google-cloud-core                     2.3.2
- google-cloud-logging                  3.5.0
- google-cloud-resource-manager         1.8.1
- google-cloud-storage                  2.7.0
- googleapis-common-protos              1.58.0
- grpc-google-iam-v1                    0.12.6
- oauth2client                  	    4.1.3

Since all of the above requirements are part of our requirements.txt file, the installation section (below/further) will contain the steps to install all of the required libraries automatically. 

## Service Account

For the application to run smoothly, we need a service account, with Viewer Role (Basic) at the organization level. 

One way to enable so is as follows:

1. Open or select the destination project where we would like to consolidate all the tables data. 
2. Create a service account under IAM section in this consolidation project. No roles are required to be given at this point in time. 
3. Once created, as an organization admin, add the Service account with the following permissions (ideally in form of a Custom Role) from IAM option, be selecting the organization instead of the project. 

```
bigquery.datasets.get
bigquery.tables.create
bigquery.tables.list
resourcemanager.projects.get
resourcemanager.projects.list
```

4. Finally, and MOST IMPORTANTLY, create a JSON key of this service account, and save it in the folder outside the "src" folder of this application. 

Note: All above activities are to be performed (as of now, manually) using the Google Cloud console UI. 

## Installation

The first step of installation is actually already completed - we now have a service account in our GCP Organization to programmatically list all the BigQuery tables that we would like to consolidate into the target consolidation dataset. 

Next, is to install the Python dependencies. It is STRONGLY RECOMMENDED to have the full "gcloud" SDK suite installed first. Post so, run the below command (from outside the "src" folder) to install all the Python dependencies. 

`pip install -r ./requirements.txt`

Optionally, we can create a separate Python 3 Environment, and switch to this new environment, before installing these dependencies for cleaner execution. 

## How To Run? 

Now that we are set with the Service Account on GCP and the Python dependencies are installed, we can run the utility using "main.py" program provided inside the "src" folder.

This would need you to pass the command line arguements, or if not provided, it would give an error and exit. 

The details required to run the Application, at this stage, are: 

- Organization ID
- Destination project-id
- Destination dataset-id
- Destination table-id (which this utility will create) 
- Table Search String
- Path to the Service Account JSON Key

The last-to-last parameter is very important, and interesting! For example, if we want to search for tables starting with names like "gke_cost_export", then this piece of text becomes our Table Search string. Using this, our application finds the tables to be copied, and then copies them one after the other. 

Note, that the Organization ID is available from the IAM page, under Settings option, when we select the Organization from the drop down menu in Google Cloud Console UI. 


Also, at this stage, we recommend setting the project to the destination project-id using command similar to below: 

```
export GOOGLE_CLOUD_PROJECT=<destination-project-id>
```

A sample command to run the utility, finally, is as under: 

```
python3 main.py 123456789876 my-dest-project my-dest-dataset my-dest-table gke_cluster_resource /tmp/my_key.json
```

In the above example, "gke_cluster_resource" is our Table Search String while "/tmp/my_key.json" is our Service Account JSON Key. 
Rest of the input parameters are quite self explanatory. 

## Containerized & Schedulable Version!

As of date, we also have a containerized version of this utility, so that we can run this as a **Cloud Run** application in Google Cloud Platform, by using **Google Cloud Container Registry** to save our image, and schedule the application to run at regular intervals by using **Cloud Scheduler**. The best way, as we have found, is to create a Docker image of our tool, and upload it into GCR. 

As a best practice, we recommend creating separate Cloud Run jobs with the same/singular Docker image of this application for each category/type of tables we would like to consolidate, so that in case of any rare events of failure, one does not impact the other. Also, this simplifies the way we can execute our Automation as part of Cloud Run jobs. 

Assumption: It is assumed that the appropriate version of Docker is already installed on Local workstation(s) if the next steps are to be executed from therein. In case we are using Google Cloud Shell, then the Docker utility comes pre-packaged, hence there are no installation pre-requisites. 

Note: Please cross check the Google Cloud Platform official documentation for any or all information related to Google Container Registry and its setup and permission details. 

To make the containerized version run, first we need to create a docker container. To do so, 

1. Open Google Cloud Shell from within the Google Cloud Console UI or from Local installations, and set the project to the destination project where we want to consolidate the data/tables and where we will be storing the Image to be used in our Containers. 

```
gcloud config set project <google-cloud-project>
```

2. If not already done, download or re-pull the latest source code of this application to the home directory or any other directory of choice. 

3. Traverse to the directory where the latest source code of this application is downloaded via command line. In here, outside the "src/" folder, place the JSON Key file of the Service account which contains all the required permissions. This is **VERY IMPORTANT**, without which the rest of the steps will still work but the application's run will fail! 

4. Run the below command to build a docker image, by first **changing the project name in the Dockerfile itself** without which the setup will fail. 

(To do so, edit the Dockerfile in your choice of Text Editor, and replace the text \<your-project-name-goes-here\> with the actual project name of the consolidation dataset). 

The input to this command will be the name of the container as per user choice.

```
docker build -t <image-name-goes-here> -f Dockerfile . 
```

5. Once the docker image is built locally, we need to tag this image for further activities. To do so, run the below command:

```
docker tag <image-name-goes-here> gcr.io/<google-cloud-project>/<image-name-goes-here>:latest
```

Note: the above command may fail to execute if we do not have the Google Cloud Container Registry APIs enabled in the destination project. 

6. Lastly, we push the Docker image to the Google Cloud Container repository, using the following command:

```
docker push gcr.io/<google-cloud-project>/<image-name-goes-here>:latest
```

Above series of commands have now created our Image in Google Container Registry. In the next steps, we will use Cloud Run Jobs to run the application as an ad-hoc schedule. 

Before we do so, it is **strongly recommended** that we create a dedicated service account, on the destination project where we want to put our consolidated data, with a Custom IAM Role containing all the required permissions to run this utility. The required set of IAM permissions for this specific Service account, to run the utility, is as follows: 

```
bigquery.datasets.get
bigquery.jobs.create
bigquery.tables.create
bigquery.tables.delete
bigquery.tables.getData
bigquery.tables.list
bigquery.tables.updateData
cloudscheduler.jobs.create
cloudscheduler.jobs.get
cloudscheduler.jobs.list
cloudscheduler.jobs.pause
cloudscheduler.jobs.run
cloudscheduler.locations.get
cloudscheduler.locations.list
resourcemanager.projects.get
run.configurations.get
run.configurations.list
run.executions.get
run.executions.list
run.jobs.create
run.jobs.get
run.jobs.list
run.jobs.run
run.jobs.update
run.locations.list
run.revisions.get
run.revisions.list
run.services.create
run.services.get
run.services.list
run.services.update
```

Important Note: Enable the Cloud Run and Cloud Scheduler APIs if not already enabled in the destination project. 

Now, to create the Cloud Run Job, as simple as it sounds, we can use a command like below: 

```
gcloud beta run jobs create <our-cloud-run-job> \
	--image=gcr.io/<google-cloud-project>/<image-name-goes-here> \
	--args=<list-of-arguements-separated-by-comma> \
	--command="/usr/local/bin/python3" \
	--cpu=2 \
	--execute-now \
	--memory=4Gi \
	--region=<our-preferred-region> \
	--service-account=<our-project-specific-service-account-email-with-Cloud-Run-Permissions> \
	--async
```

From the GCP Console UI, we can now access the Cloud Run Jobs page, and check the job being created. Although we can run the job from here as many times as we want, but the ideal step further is to put the Cloud Run Job into Schedule using Cloud Scheduler. 

For this, we can use a command similar to below:

```
gcloud beta scheduler jobs create http <our-schedule-name> \
	--location=<our-preferred-region> \
	--schedule="<unix-style-schedule-time>" \
	--uri="https://<our-preferred-region>-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/<google-cloud-project>/jobs/<our-cloud-run-job>:run" \
	--description=<optional-description-to-our-schedule-to-signify-for-which-tables-this-schedule-is-meant-for> \
	--oauth-service-account-email=<our-project-specific-service-account-email-with-Cloud-Run-Permissions>
```

Going over to the Google Cloud Console/UI, we can now see the Cloud Run Job being in Schedule as per the details we have used while running the above command. 

We can also see the schedule of the Cloud Run Job from the Cloud Run UI by clicking on the Job name and selecting the Triggers option.  

## Known Issues

- For known/unknown reasons, many of our reusable tools do not work well in local environments even with gcloud SDK setup. Hence, we suggest using the application/utility as of now PRIMARILY USING Google Cloud's CLOUD SHELL environment, while running the utility manually. 

## Limitations

- As of now, we can only do transfers using this utility within the same organization. For data movement across organizations, we intend to automate the BigQuery Analytics Hub service in the upcoming versions of this utility. 
- As of now, the utility performs only sequential data loading, although since it uses Cloud SDK hence it is extremely fast and reliable. In the later versions, we aim to add Dataflow and Composer based versions of the same utility for applicable use cases. 
