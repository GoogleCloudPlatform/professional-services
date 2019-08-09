Purpose:
========
Add/Update labels on GCP project, compute engine, storage, bigtable and bigquery


Environment Set Up
==================
- Google Cloud SDK must be set up in the machine from where the script will be run.
- Google Cloud Service Account must be created and service account key file needs to be stored securely in the machine
as that will be used by the program for authorization. Please follow the steps in 
[Click here to go to Python SetUp Document](Set_Up_Python_Env.md)
- Also few python packages need to be installed as mentioned. Please follow the steps in ./Set_Up_Python_Env.md


Main Scripts
============
Script name : main.py
Parameter : update_labels.config


Example Config file
===================
Please refer to update_labels.config 

Example Input Label File
===================
The labels should be in lower case. The google sheet must be shared with the service account user id for the scripts 
to find it. A sample google sheet and sample screenshot are below: 

https://docs.google.com/spreadsheets/d/1mmn5wShPqgFQeM9bRRZONWY30FmP9EZBWQOyACZtGGE/edit#gid=0

![](./sample_label_file.png)

How to execute
===============

sh run.sh


Log files:
=========
The main.py script also creates a log file for the entire process and an error file if any update fails:

main.log
main.err
gcp_update_labels.report

Troubleshooting:
===============
If the process completes successfully, the log file ends with "All resources updated successfully." 
Please check cloud console to verify if resources' labels got updated.

Few common errors that you might face:
- Key file not found : Google Cloud Service Account key file is not downloaded or cannot be found in the location.
- Problem in input label file. Any required field might be missing, which may get caught by validation method.
- If any resource needs permission before update, there will be error message in gcp_update_labels.log and 
gcp_update_labels.err files. You will need to enable corresponding APIs or giving "owner"/"editor" permission to the 
Service Account Id.
