# Setup
Clone this repository and run locally, or use Cloud Shell to walk through the steps:

[![Open in Cloud Shell](https://gstatic.com/cloudssh/images/open-btn.png)](https://ssh.cloud.google.com/cloudshell/open?page=shell&cloudshell_git_repo=https://github.com/GoogleCloudPlatform/professional-services&cloudshell_tutorial=examples%2Fgcs-fixity-function%2Fdocs%2Fsetup.md)

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

## GCS Bucket Setup
If you have already created a bucket and uploaded files to the bucket, you can skip this step. Be sure that versioning is set on by running the command in step 2.

1. [Create a GCS bucket](https://cloud.google.com/storage/docs/creating-buckets#storage-create-bucket-gsutil) that will contain your file archive bag(s).
```bash
gcloud storage buckets create gs://$BUCKET_NAME
```
2. Turn on [file versioning](https://cloud.google.com/storage/docs/object-versioning) for your GCS bucket to ensure files are never overwritten.
```bash
gcloud storage buckets update --versioning gs://$BUCKET_NAME
```
3. Upload files using the structure into the `data/` directories created for each Bag. Note: It's a good idea to bulk upload files _before_ deploying/invoking the Fixity script, since each file upload will trigger a script invokation for each uploaded file if the script is deployed first.
```bash
gcloud storage cp * gs://$BUCKET_NAME/<bag_path>/data/
```
If you know the MD5 of a file before uploading you can specify it in the Content-MD5 header, which will cause the cloud storage service to reject the upload if the MD5 doesn't match the value computed by the service. See more [here](https://cloud.google.com/storage/docs/gsutil/commands/cp#checksum-validation)

## BigQuery Setup
This should be run *once* for your Project. If you have completed these steps, then you can skip this step.

Run the following:
```bash
make prepare
```
This creates the following resources:
* `fixity_data` and `fixity` datasets.
* `fixity_data.records` table to hold each individual Fixity record for every invokation.
* `fixity.current_manifest` view to show the current manifest of files for a bag.
* `fixity.file_operations` view to show all operations and diffs across time for a bag.

## Cloud Function Setup
Run this once for _each Bucket_.

Ensure `BUCKET_NAME` is set to your bucket name using `export BUCKET_NAME=<bucket-name>` and run the following:
```bash
make deploy
```
This will deploy the Cloud Functions required for the operation:

* `track-deletes`: Runs Fixity check any time a file is archived.
* `track-updates`: Runs Fixity check any time a file is created or changed.
* `manual`: Enables Fixity runs that can be scheduled or invoked manually.

## Scheduler Setup
Run this once for _each Bucket_.

Create a task in Cloud Scheduler. The default recommended schedule below will run on the 1st of every month at 8:00 am.

Set a schedule:

```bash
export SCHEDULE="1 of month 08:00"
```
Then run the following. If prompted to enable any APIs, enter `y` for Yes.
```bash
gcloud scheduler jobs create pubsub fixity-${BUCKET_NAME} --schedule="${SCHEDULE}" --topic=fixity-${BUCKET_NAME}-topic --message-body={}
```

Once the above has been created, you can run Fixity on demand by visiting [https://console.cloud.google.com/cloudscheduler].

## Complete!
🎉

Congratulation! You can run Fixity for the first time by visiting [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler). Fixity will now run whenever a file is uploaded, changed, or archived and on the schedule you defined.

Once Fixity has been run for the first time, you can view Manifest files within each bag or from [BigQuery](https://console.cloud.google.com/bigquery).
