Setting Up Python for Google Cloud:
==================================

Set Up Google Cloud SDK:
=======================

In order to work from command line and connect to Google Cloud from CLI we have to set Up Google Cloud SDK:

pip install google-cloud-storage

Set up a GCP Console project from Command Line:
==============================================

gcloud init #by this you select your project and region and connect to it.

Create Service Account:
======================

https://cloud.google.com/iam/docs/creating-managing-service-account-keys

E.g.Steps can be like below for the service account name: data-piper-folder-test:

gcloud iam service-accounts create data-piper-folder-test
gcloud iam service-accounts keys create ../.gcp/data-piper-folder-test_key.json --iam-account data-piper-folder-test@data-piper-folder-test.iam.gserviceaccount.com

Assign multiple roles to Service Account based on your need:
===========================================================

gcloud projects add-iam-policy-binding data-piper-folder-test --member serviceAccount:data-piper-folder-test@data-piper-folder-test.iam.gserviceaccount.com --role roles/
resourcemanager.organizationAdmin

gcloud projects add-iam-policy-binding data-piper-folder-test --member serviceAccount:data-piper-folder-test@data-piper-folder-test.iam.gserviceaccount.com --role roles/browser

gcloud projects add-iam-policy-binding data-piper-folder-test --member serviceAccount:data-piper-folder-test@data-piper-folder-test.iam.gserviceaccount.com --role roles/owner

Python Packages that need to be installed from command line:
===========================================================

To work with cloud resource manager and google APIs: 
pip install google-cloud-resource-manager 
pip install google-api-python-client
pip install httplib2
pip install oauth2client
pip install --upgrade google-api-python-client
pip install --upgrade google-cloud-bigquery

If you are using google spreadsheet to input file
pip install gspread oauth2client

Also share your spreadsheet with service account email address, which can be found in key file that you download from 
console.

Enable APIs from Cloud Console:
==============================
Enable Cloud Resource Manager API by going to the console and 
1. click on API and Services
2. Click on the : +Enable APIs and Services , on the right of the API and Services
3. This will lead to Welcome to API Library
4. Search for "Cloud Resource Manager", click on it and then it will take to the Cloud Resource Manager API page and "Enable API" there. This needs to be done for python program to get Google Cloud authorization.



