# Cloud Asset Inventory Import To BigQuery

This tools allows import resource and iam policy records exporting by the [Cloud Asset Inventory API](https://cloud.google.com/resource-manager/docs/cloud-asset-inventory/overview) into [BigQuery](https://cloud.google.com/bigquery). Once in BigQuery it's possible to use complex SQL expressions to answer interesting questions like :

- VPC subnets that have more then 80% utilization of their CIDR range?
- All resources that refer a user in their IAM policy?
- All the external IP addresses currently assigned to me.
- How many Cloud SQL, compute engine instance are currently running?

And many more.

## Quick Start

The fastest way to Get data into BigQuery is to invoke the export resources to GCS and invoke the Dataflow template. You don't even need to download this repository! First, export the assets.

1. Ensure you have the necessary privileges at the organization level. This requires at a minimum the roles to:
   * Create a service account.
   * Grant the service account the ability to export Cloud Asset Inventory. (Apply either roles/viewer or roles/cloudasset.viewer to the project or organization )
   * BigQuery write privileges to create a dataset, create and delete tables.
   * Start Dataflow Jobs.

1. Create a service account and authenticate gcloud with it. It's currently ONLY possible to invoke the Cloud Asset Inventory Export API with a service account. A user account will give permission denied errors when writing to the bucket or when the API is called.

    ```
    gcloud auth activate-service-account --key-file  project-id-0f9e758963c4.json
    ```

    Alternatively create SSH to a compute engine VM with a service account that has the necessary IAM roles.

1. Create bucket to hold the asset exports. This bucket __MUST__ exist in the same project that owns the service account.

    ```
    export BUCKET=gs://make-up-a-bucket-name-to-hold-your-assets
    gsutil mb $BUCKET
    ```

1. Export both the resource and iam_policy assets of a project or organization to the bucket.  If you have organization level access and wish to export all resources within the organization then define the parent to be:

    ```
    export PARENT="--organization [your-organization-id]
    ```

    or if you only have project level access and wish to export all resources within the project then

    ```
    export PARENT="--project [your-project-id]"
    ```

    We'll need to be running gcloud version __228.0.0 or later. (alpha 2018.11.09)__ Ensure you have the alpha components for gcloud installed by running:

    ```
    gcloud components alpha install
    gcloud components upddate
    ```

    Now perform the export:
    ```
     for CONTENT_TYPE in resource iam-policy; do
       gcloud alpha asset export --output-path=$BUCKET/${CONTENT_TYPE}.json --content-type=$CONTENT_TYPE $PARENT
       done;
    ```

    Run the commands output by gcloud to verify the export worked, for example:
    ```
    gcloud alpha asset operations describe projects/1234567890/operations/ExportAssets/23230328344834
    ```

1. Then import assets into BigQuery. But first create a BigQuery dataset to hold the data:
    ```
    export DATASET=asset-inventory-resource
    bq mk $DATASET
    ```

    Then invoking the dataflow template
    ```
    export LOAD_TIME=`date -Is`
    export JOB_NAME=cloud-asset-inventory-import-`echo $LOAD_TIME | tr : - | tr '[:upper:]' '[:lower:]'`
    export PROJECT=`gcloud config get-value project`
    gcloud dataflow jobs run $JOB_NAME  --gcs-location gs://professional-services-tools-asset-inventory/latest/import_pipeline --parameters="input=$BUCKET,stage=$BUCKET/stage,load_time=$LOAD_TIME,group_by=ASSET_TYPE,dataset=$DATASET,write_disposition=WRITE_APPEND"
    ```

    This will output a job id like `2019-01-07_13_48_24-2706414343179069654`

    You can check the status of this job with the command

    ```
    gcloud dataflow jobs show  2019-01-07_13_48_24-2706414343179069654
    ```

    It's also possible to view the job status as well as launch the Dataflow job from the template with the cloud console at: https://console.cloud.google.com/dataflow

That's it!, now your data is hopefully now in BigQuey.


## Automated Scheduled Imports By Deploying to App Engine

It's easy to configure a processes to perform these steps every 4 hours so that there is fresh snapshot in BigQuery and also a historical record of prior assets and policies.  This requires downloading this source repository, changing a config file and deploying an app engine application.

Keep in mind that the App Engine Default service account credentials will be used when running the process which means

- The default App Engine service account needs asset inventory export privileges for the organization/project,
- The default dataflow service account running the pipeline jobs needs the ability to write to the GCS bucket and load data and update schema into BigQuery, and delete/create BigQuery tables if using write_disposition=WRITE_EMPTY.
- The GCS bucket being written to needs to be owned by the same project that owns the app engine application.


The deployment steps are:

1. Clone this repository

    ```
    git clone git@github.com:GoogleCloudPlatform/professional-services.git
    ```

1. Edit the configuration file `professional-services/tools/asset-inventory/gae/config.yaml` and supply values for your setup.

1. Vendor the asset_inventory package with the app engine application:

    ```
    cd professional-services/tools/asset-inventory/gae/
    pip install ../ -t lib
    ```

1. Deploy the application to  App Engine

    ```
    gcloud app deploy app.yaml
    ```

1. Deploy the cron task definition to invoke the process every 4 hours (edit the config to whatever schedule you want):

    ```
    gcloud app deploy cron.yaml
    ```

1. Goto the [App Engine cron page](https://console.cloud.google.com/appengine/cronjobs) and manually invoke the cron process to ensure everything works:


## Directly running the pipeline.

This repository  contains some command line tools that let you run the export/import process with a Apache Beam runniner, including the direct runner. This can be useful when you want a more "traditional" way of running the import/export process like via crontab on a machine or for local development.

1. Run setup.py in develop mode.

    ```
    cd professional-services/tools/asset-inventory
    python setup.py develop
    ```

1. Install the beam SDK locally: (full instructions [here](https://beam.apache.org/get-started/quickstart-py/#set-up-your-environment): )

    ```
    pip install --ignore-requires-python -r requirements.txt  -t lib
    ```

1. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the service account json key that will be used to invoke the export API and invoke the Beam runner. Or run within GCE and rely on the service account of the compute engine instance.

    ```
    export GOOGLE_APPLICATION_CREDENTIALS=<path-to-downloaded-json-key>
    ```

1. Run the main.py program:

    ```
    python asset_inventory/main.py --parent projects/$PROJECT --gcs-destination $BUCKET --dataset $DATASET --runner direct
    ```


## Troubleshooting.

1. The Cloud Asset Inventory  export operation failed with the error: "PERMISSION_DENIED. Failed to write to: gs://<my-export-path>" yet I know I have write permissions?

    You need to invoke the export API with a service account that's owned by the same project that owns the bucket. See Step 1.1 where you can have gcloud authenticate with a service account. When using the command line tools like asset_inventory/export.py or asset_inventory/main.py  use the  GOOGLE_APPLICATION_CREDENTIALS environment variable to point to the service account key or run then within a compute engine instance with a service account that has the required privileges (see access control section).

2. I'm getting a "PermissionDenied: 403 Your application has authenticated using end user credentials from the Google Cloud SDK or Google Cloud Shell which are not supported by the cloudasset.googleapis.com. We recommend that most server applications use service accounts instead. For more information about service accounts and how to use them in your application, see https://cloud.google.com/docs/authentication/."

    What the error says, you have to use a service account and can't use a regular user's credentials.


3. When using the Dataflow runner I get an error like:

    ```
      File "/usr/local/lib/python2.7/dist-packages/dill/_dill.py", line 465, in find_class
        return StockUnpickler.find_class(self, module, name)
      File "/usr/lib/python2.7/pickle.py", line 1130, in find_class
        __import__(module)
    ImportError: No module named asset_inventory.import_pipeline
    ```

    You likely forgot the "--setup_file ./setup.py" arguments try something like:

    ```
    python asset-inventory/asset_inventory/main.py --parent projects/$PROJECT --gcs-destination $BUCKET --dataset $DATASET --write_disposition WRITE_APPEND --project $PROJECT --runner dataflow --temp_location gs://$BUCKET_temp --save_main_session   --setup_file ./setup.py
    ```
