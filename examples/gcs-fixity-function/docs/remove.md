# Setup
Clone this repository and run locally, or use Cloud Shell to walk through the steps:

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.png)](https://ssh.cloud.google.com/cloudshell/open?page=shell&cloudshell_git_repo=https://github.com/GoogleCloudPlatform/professional-services&cloudshell_tutorial=examples%2Fgcs-fixity-function%2Fdocs%2Fremove.md)

## Prepare
To setup this function, run through these instructions from the root of the repository or using Cloud Shell. 

Set the following environment variables, replacing the values with those for your project and bucket:
```bash
export PROJECT_ID=<my-project-id>
```
```bash
export BUCKET_NAME=<my-target-bucket-name>
```
Then run the following command as-is:
```bash
gcloud config set project $PROJECT_ID
```

## Remove
Run the following to remove Fixity functions.
```bash
make remove
```
