# Cloud Asset Inventory Import To BigQuery

![bigquery console](https://storage.googleapis.com/professional-services-tools-asset-inventory/images/bq.png "Cloud Asset Inventory In BigQuery")

This tools allows import resource and iam policy records exporting by the [Cloud Asset Inventory API](https://cloud.google.com/resource-manager/docs/cloud-asset-inventory/overview) into [BigQuery](https://cloud.google.com/bigquery). Once in BigQuery it's possible to use complex SQL expressions to answer interesting questions like :

- How many disks ar running for each sourceImage broken out by machineType:

    ```
    SELECT instance.timestamp,  REGEXP_EXTRACT(instance.resource.data.machineType, '.*/(.*)') AS machine_type, REGEXP_EXTRACT(disk.resource.data.sourceImage, '.*/(.*)') AS source_image, count(*) as num_disks
    FROM `project-name.cai_assets.google_compute_Instance` AS instance
    JOIN UNNEST(instance.resource.data.disks) AS instance_disk
    JOIN `project-name.cai_assets.google_compute_Disk` AS disk
    ON instance_disk.source = disk.resource.data.selfLink and instance.timestamp = disk.timestamp
    where instance.resource.data.status = 'RUNNING' and disk.resource.data.sourceImage is not null
    and instance.timestamp = (select max(instance.timestamp) from `bmenasha-1.cai_assets.google_compute_Instance` AS instance)
    group by timestamp,  machine_type, source_image
    ```

- All the external IP addresses currently assigned to my load balancers cloud sql, and compute instances?

    ```
    WITH max_timestamp AS ( SELECT MAX(timestamp) AS timestamp FROM `project-name.cai_assets.google_compute_Instance`)

    SELECT sql_instance.resource.data.selfLink AS resource, address.ipAddress AS address
    FROM `project-name.cai_assets.google_cloud_sql_Instance` AS sql_instance
    JOIN UNNEST(sql_instance.resource.data.ipAddresses) AS address
    JOIN max_timestamp
    ON sql_instance.timestamp = max_timestamp.timestamp
    WHERE address.ipAddress IS NOT NULL

    UNION ALL

    SELECT forwarding_rule.resource.data.selfLink AS resource, forwarding_rule.resource.data.IPAddress AS address
    FROM `project-name.cai_assets.google_compute_ForwardingRule` AS forwarding_rule
    JOIN max_timestamp
    ON forwarding_rule.timestamp = max_timestamp.timestamp
    WHERE forwarding_rule.resource.data.loadBalancingScheme = 'EXTERNAL'

    UNION ALL

    SELECT instance.resource.data.selfLink AS resource, access_config.natIP AS address
    FROM `project-name.cai_assets.google_compute_Instance` AS instance
    JOIN UNNEST(instance.resource.data.networkInterfaces) AS network_interface
    JOIN UNNEST(network_interface.accessConfigs) AS access_config
    JOIN max_timestamp
    ON instance.timestamp = max_timestamp.timestamp
    WHERE access_config.natIP IS NOT NULL
    ```

And many more!

## Install Steps

It's suggested to create a new project to hold the asset inventory resources. Especially if using App engine to perform the export as it will require assigning the App Engine service account the `roles/cloudasset.viewer` role and all App Engine jobs in a single project run with the same credentials.

1. Create a new project and gcloud configuration to host our service (optional, you can use an existing project and gcloud configuration.)

    ```
    export PROJECT_ID=<my-project-id>
    gcloud projects create $PROJECT_ID
    export CONFIG_ACCOUNT=`gcloud config get-value account`
    export CONFIG_ZONE=`gcloud config get-value compute/zone`
    export CONFIG_REGION=`gcloud config get-value compute/region`
    # create a new gcloud configuration for the project, not necessary if running in the cloud shell.
    gcloud config configurations create $PROJECT_ID
    gcloud config set account $CONFIG_ACCOUNT
    gcloud config set compute/zone $CONFIG_ZONE
    gcloud config set compute/region $CONFIG_REGION
    gcloud config set project $PROJECT_ID
    gcloud beta billing projects link $PROJECT_ID  --billing-account=`gcloud beta billing accounts list --format='value(ACCOUNT_ID)' --limit 1`
    ```

1. Get the organization ID,  It's possible to export resources of a Project instead of organization if an organization doesn't exist or we lack access to the organization.

    ```
    export ORGANIZATION_ID=`gcloud projects describe $PROJECT_ID --format='value(parent.id)'`
    ```

1. Create a GCS bucket in the project. The export requires that the bucket bet in the same project as the service account performing the export, even if the service account has access to the bucket in a different project the export will fail.

    ```
    export BUCKET=gs://${ORGANIZATION_ID}-assets
    gsutil mb $BUCKET
    ```

1. Create the dataset to hold the resource tables in BigQuey.

    ```
    bq mk asset_inventory
    ```

## There are two different options from this point:
1. Use Google App Engine to perform cron scheduled exports from the Cloud Asset Inventory API, and imports into BigQuery using a Dataflow template.
1. A more traditional command line driven process which can be performed from anywhere if App Engine is not an option for some reason.

## 1. Automated Scheduled Imports By Deploying to App Engine

This requires downloading this source repository, changing a config file and deploying an app engine application and granting necessary privileges to the App Engine Default service account.

- The App Engine service account needs asset inventory export privileges for the organization/project,
- The Dataflow service account running the pipeline jobs needs the ability to write to the GCS bucket and load data and update schema into BigQuery, and delete/create BigQuery tables if using write_disposition=WRITE_EMPTY.
- The GCS bucket being written to needs to be owned by the same project that owns the app engine application (or grant the Asset Inventory Agent service account to the bucket, see Troubleshooting step #1).
- the Dataflow agent service account needs the ability to read the GCS bucket and use the VPC subnetwork the workers run on (if using a shared VPC).

The deployment steps are:

1. Clone this repository:

    ```
    git clone git@github.com:GoogleCloudPlatform/professional-services.git
    ```

1. Edit the configuration file `professional-services/tools/asset-inventory/gae/config.yaml` and supply values for your setup.

    ```
    cd professional-services/tools/asset-inventory/gae/
    sed -i  "s|<ENTER-BUCKET-URL>|$BUCKET|" config.yaml
    sed -i  "s|<ENTER-PARENT>|organizations/$ORGANIZATION_ID|" config.yaml
    sed -i  "s|<ENTER-DATASET>|asset_inventory|" config.yaml
    sed -i  "s|<ENTER-STAGE>|$BUCKET/stage|" config.yaml
    sed -i  "s|<ENTER-PROJECT>|$PROJECT_ID|" config.yaml
    ```

1. If using a Shared VPC to run the Dataflow job you must supply the `network` and `subnetwork` values in the import_pipeline_runtime_environment json map in the `config.yaml` file as described [here](https://cloud.google.com/dataflow/docs/guides/specifying-networks). Additionally the Dataflow Agent Service Account `service-<PROJECT-NUMBER>@dataflow-service-producer-prod.iam.gserviceaccount.com` needs the compute.networkUser role on the Shared VPC subnet. The dataflow job requires the ability to make external calls to `https://*.googleapis.com/$discovery/rest?version=*` endpoints in order to download discovery documents.

1. The config.yaml limits Dataflow jos to one worker. This is because the VPC used might not allow internal communication between Dataflow workers as described [here](https://cloud.google.com/dataflow/docs/guides/routes-firewall). If you follow those steps or are using the default VPC and don't see a warning about missing firewall rules you can safely increase the maxWorkers configuration.

1. Vendor the asset_inventory package with the app engine application:

    ```
    pip install --no-deps ../ -t lib
    ```

1. Create the App Engine application in our project and grant the default service account asset export viewer roles.

    ```
    gcloud app create
    gcloud organizations add-iam-policy-binding $ORGANIZATION_ID --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" --role='roles/cloudasset.viewer'
    ```

   If the this service account lacks the default Project Editor role, you'll also need to grant it the `roles/dataflow.admin`, `roles/bigquery.user`, and `roles/bigquery.dataEditor` in the project.

    ```
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/dataflow.admin'
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/bigquery.user'
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/bigquery.dataEditor'
    ```

1. Deploy the application to App Engine.

    ```
    gcloud app deploy app.yaml
    ```

1. Deploy the cron task definition to invoke the process every 4 hours (edit the config to whatever schedule you want):

    ```
    gcloud app deploy cron.yaml
    ```

1. Goto the [App Engine cron page](https://console.cloud.google.com/appengine/cronjobs) and manually invoke the cron process to ensure everything works. It will run for a while (a few minutes) as it performs the export starts a Dataflow job.    That's it!

    ![App Engine Cron](https://storage.googleapis.com/professional-services-tools-asset-inventory/images/cron.png "App Engine Cron")



## Command Line Driven Export/Import

The fastest way to Get data into BigQuery is to invoke the export resources to GCS and invoke the [Dataflow template](https://cloud.google.com/dataflow/docs/guides/templates/overview). You don't even need to download this repository! First, export the assets.

1. Ensure you have the necessary privileges at the organization level. This requires at a minimum the roles to:

    * Create a service account.
    * Grant the service account the ability to export Cloud Asset Inventory. (Apply either roles/viewer or roles/cloudasset.viewer to the project or organization )
    * BigQuery write privileges to create a dataset, create and delete tables.
    * Start Dataflow Jobs.

1. Ensure necessary APIs (compute, asset inventory, bigquery, dataflow) are enabled on the project.

    ```
    gcloud services enable cloudasset.googleapis.com dataflow.googleapis.com compute.googleapis.com bigquery-json.googleapis.com
    ```

1. Create a service account and authenticate gcloud with it. It's currently ONLY possible to invoke the Cloud Asset Inventory Export API with a service account. A user account will give permission denied errors when writing to the bucket or when the API is called.

    ```
    gcloud iam service-accounts create asset-exporter-service-account
    gcloud iam service-accounts describe asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com
    ```

1. Grant the service account the ability to read asset inventory from the organization, start dataflow jobs and load data into BigQuery.

    ```
    gcloud organizations add-iam-policy-binding $ORGANIZATION_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/cloudasset.viewer'
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/dataflow.admin'
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/bigquery.user'
    gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com" --role='roles/bigquery.dataEditor'

    ```

1. We need to send requests as this service account. The safest way is to create a compute engine VM with a service account then SSH into it.

    ```
    gcloud compute instances create asset-inventory-instance-1 --service-account asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com --scopes cloud-platform
    gcloud compute ssh asset-inventory-instance-1
    # once on the VM it's necessary to define our environment variables again:
    export PROJECT_ID=`gcloud config get-value project`
    export ORGANIZATION_ID=`gcloud projects describe $PROJECT_ID --format='value(parent.id)'`
    export BUCKET=gs://${ORGANIZATION_ID}-assets
    ```

    Another approach is to download the private key and activate the service account to run locally  but this generated key must be kept secure.

    ```
    gcloud iam service-accounts keys create --iam-account=asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com ~/asset-exporter-service-account.json
    gcloud auth activate-service-account  asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com --key-file ~/asset-exporter-service-account.json
    ```

1. Export both the `resource` and `iam_policy` assets of a project or organization to the bucket.  If you have organization level access and wish to export all resources within the organization then define the parent to be:

    ```
    export PARENT="--organization $ORGANIZATION_ID"
    ```

    Or if you only have project level access or wish to export all resources within the project run:

    ```
    export PARENT="--project $PROJECT_ID"
    ```

    We'll need to be running gcloud version __228.0.0 or later. (alpha 2018.11.09)__ Ensure you have the alpha components for gcloud installed with the alpha component.

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

1. Then import the assets into BigQuery with the Dataflow template.

    ```
    export LOAD_TIME=`date +"%Y-%m-%dT%H:%M:%S%:z"`
    export JOB_NAME=cloud-asset-inventory-import-`echo $LOAD_TIME | tr : - | tr '[:upper:]' '[:lower:]' | tr + _`
    gcloud dataflow jobs run $JOB_NAME --region $CONFIG_REGION --gcs-location gs://professional-services-tools-asset-inventory/latest/import_pipeline --parameters="^|^input=$BUCKET/*.json|stage=$BUCKET/stage|load_time=$LOAD_TIME|group_by=ASSET_TYPE|dataset=asset_inventory|write_disposition=WRITE_APPEND|num_shards=*=1,resource=100,google.cloud.bigquery.Table=100" --staging-location $BUCKET/staging
    ```



    This will output a job id like `2019-01-07_13_48_24-2706414343179069654`

    You can check the status of this job with the command:

    ```
    gcloud dataflow jobs show  `gcloud dataflow jobs list --filter="name=$JOB_NAME" --limit 1 --format 'value(JOB_ID)'`
    ```

    It's also possible to view the job status as well as launch the Dataflow job from the template with the cloud console at: https://console.cloud.google.com/dataflow

    That's it!, your data is in BigQuey.
    You can logout and delete the instance we used to authenticate as the service account:

    ```
    exit
    gcloud compute instances delete asset-inventory-instance-1
    ```

    Goto the BigQuery [page](https://console.cloud.google.com/bigquery) to explore the data or run queries like this from the command line:

    ```
    bq query --nouse_legacy_sql  'select timestamp, instance.resource.data.name from `asset_inventory.google_compute_Instance` as instance where instance.resource.data.status = "RUNNING"  and  timestamp = (select max(timestamp) from `asset_inventory.google_compute_Instance`) limit 1000'
    ```

    The BigQuery dataset will contain a table for each asset type. The timestamp column on each row is when the asset inventory snapshot was created.



## Directly running the pipeline. (For those that can't use Dataflow runner)

This repository contains some command line tools that let you run the export/import process with an Apache Beam runner, including the direct runner. This can be useful if the Dataflow runner isn't an option, and for local development.

1. Run setup.py in develop mode.See [full instructions](https://beam.apache.org/get-started/quickstart-py/#set-up-your-environment) for setting up an Apache Beam development environment:

    ```
    cd professional-services/tools/asset-inventory
    mkdir ~/.venv
    python -m venv ~/.venv/asset-inventory
    source ~/.venv/asset-inventory/bin/activate
    pip install -e .
    pip install -r requirements.txt
    ```

1. Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the service account json key that will be used to invoke the Cloud Asset Inventory API and invoke the Beam runner. Or run within GCE and rely on the service account of the compute engine instance. Also grant it the bigquery.user role to modify BigQuery tables.

    ```
    gcloud iam service-accounts keys create --iam-account=asset-exporter-service-account@$PROJECT_ID.iam.gserviceaccount.com ~/asset-exporter-service-account.json
    export GOOGLE_APPLICATION_CREDENTIALS=~/asset-exporter-service-account.json
    ```

1. Run the main.py program:

    ```
    python asset_inventory/main.py --parent organizations/$ORGANIZATION_ID --gcs-destination $BUCKET --dataset asset_inventory  --runner direct
    ```


1. To create a new Dataflow template from your pipeline run a command like thisto save the template in gs://$BUCKET/latest/import_pipeline.

   ```
   python ./asset_inventory/import_pipeline.py  --runner dataflow --project $PROJECT  --temp_location gs://$BUCKET/export_resources_temp --staging_location gs://$BUCKET/export_resources_staging_location --template_location gs://$BUCKET/latest/import_pipeline --save_main_session   --setup_file ./setup.py
   ```


## Input Schema Changes

Sometimes the import schema will change. This can happen upstream when a backwards incompatible change is made to an API, such as a change in the datatype of a value or when the code in the pipeline changes the import format. This can cause imports with ```write_disposition=WRITE_APPEND``` to fail with an error simliar to this:

  ```
  "./asset_inventory/import_pipeline.py", line 422, in finish_bundle raise e
  File "./asset_inventory/import_pipeline.py", line 419, in finish_bundle load_job.result()
  File "/usr/local/lib/python3.7/site-packages/google/cloud/bigquery/job.py", line 733, in result return super(_AsyncJob, self).result(timeout=timeout)

  File "/usr/local/lib/python3.7/site-packages/google/api_core/future/polling.py", line 127, in result raise self._exception google.api_core.exceptions.BadRequest: 400 Provided Schema does not match Table project-1:assets.run_googleapis_com_Revision. Field resource.data.spec.containers.livenessProbe.handler.exec.command has changed mode from NULLABLE to REPEATED [while running 'load_to_bigquery/load_to_bigquery']
  ```

To resume the import process there are three options.

### 1. Delete the dataset and recreate it.

The simplest option, this will discard all your data losing prior history but will let you continue the import. You can also try deleting the tables that fail to import if just a few of them.


  ```
  bq rm my_dataset_name
  bq mk my_dataset_name
  ```

### 1. Copy the data to a new dataset, delete and recreate the existing dataset.

This will preserve all your data in separate tables so no data is lost by copying the tables to a new datset using the bigquery transfer service.

  ```
  # enable BigQuery Transfer Service (only needs to be done once)
  gcloud services enable bigquerydatatransfer.googleapis.com

  # create new dataset to copy tables to
  bq mk my_new_dataset_name
  bq mk --transfer_config  --data_source=cross_region_copy --target_dataset=my_new_dataset_name  --display_name=copy --params='{"source_dataset_id":"my_dataest_name","source_project_id":"my-project-id","overwrite_destination_table":"false"}'

  # wait for transfer config to be completed.
  bq show --transfer_config projects/123/locations/us/transferConfigs/my-tranferconfigid
  ....

  # delete old tables by deleting and recreating the dataset.
  bq rm my_dataset_name
  bq mk my_dataset_name
  ```

### 1. Change import configurations.

to import to a new dataset, or set write_disposition=WRITE_EMPTY.
Changing the dataset the pipeline imports to will create new tables or setting write_disposition to WRITE_EMPTY (which will delete existing data) will allow imports to resume. This is done by changing either the ```config.yaml``` if using the scheduled import process or the ```--parameters`` value in the gcloud command when invoking the template via gcloud.

## Upgrading from version 1.0.0 to 2.0.0

The 2.0.0 pipeline release unfortunately changed the import schema to resolve [issue #533](https://github.com/GoogleCloudPlatform/professional-services/issues/533). Now some user specified and dynamic properties are represented as record arrays of key value pairs rather then just flat records. This was done to keep a more regular schema and prevent accumulation of columns from overflowing table limits. This change could require changes in how you query the data for example, previously to query the App Engine traffic split across two versions you would write:

```
SELECT resource.data.split.allocations._20190115t172957,
       resource.data.split.allocations._20190921t233039
FROM `asset_inventory.appengine_googleapis_com_Service`
```

The new query would look like:

```
SELECT allocations.value
FROM `asset_inventory.appengine_googleapis_com_Service` join
       unnest(resource.data.split.allocations) allocations
WHERE  allocations.name='_20190115t172957' or allocations.name = '_20190921t233039'
```

## Troubleshooting.

1. The Cloud Asset Inventory  export operation failed with the error: "PERMISSION_DENIED. Failed to write to: gs://<my-export-path>" yet I know I have write permissions?

    You need to invoke the export API with a service account that's owned by the same project that owns the bucket. See Step 1.1 where you can have gcloud authenticate with a service account. When using the command line tools like asset_inventory/export.py or asset_inventory/main.py  use the  GOOGLE_APPLICATION_CREDENTIALS environment variable to point to the service account key or run then within a compute engine instance with a service account that has the required privileges (see access control section).

    Another possible problem is that the write operation will be performed by the Asset Inventory Agent service account which should have the name: `service-<project-number>@gcp-sa-cloudasset.iam.gserviceaccount.com`. It's this service account which must have write privileges to the bucket we are performing the export too. By default it will have storageAdmin on the project on which the Asset Inventory API was enabled but


1. The Cloud Asset Inventory  export operation failed with the error:  "PermissionDenied: 403 Your application has authenticated using end user credentials from the Google Cloud SDK"

    You have to use a service account and can't use a regular user's credentials.

1. When using the Dataflow runner I get the error:

    ```
    File "/usr/local/lib/python2.7/dist-packages/dill/_dill.py", line 465, in find_class
      return StockUnpickler.find_class(self, module, name)
    File "/usr/lib/python2.7/pickle.py", line 1130, in find_class
      __import__(module)
    ImportError: No module named asset_inventory.import_pipeline
    or
    ImportError: No module named asset_inventory.api_schema

    ```

    You likely forgot the "--setup_file ./setup.py" arguments try something like:

    ```
    python asset_inventory/main.py --parent projects/$PROJECT --gcs-destination $BUCKET --dataset $DATASET --write_disposition WRITE_APPEND --project $PROJECT --runner dataflow --temp_location gs://$BUCKET_temp --save_main_session   --setup_file ./setup.py
    ```

1. When deploying the App Engine application with "gcloud app deploy app.yaml" I get the error:

    ```
    Build error details: Access to bucket "staging.gcpdentity-asset-export-1.appspot.com" denied. You must grant Storage Object Viewer permission to 159063514943@cloudbuild.gserviceaccount.com.
    ```

   This can occur when the App Engine application was just created. Please try running the "gcloud app deploy" command again after waiting a moment.

1. I get the App Engine error:

    ```
    File "/srv/main.py", line 44, in <module> from asset_inventory import pipeline_runner
    File "/srv/lib/asset_inventory/pipeline_runner.py", line 20, in <module> from googleapiclient.discovery import build
    File "/srv/lib/googleapiclient/discovery.py", line 52, in <module> import httplib2
    File "/srv/lib/httplib2/__init__.py", line 988 raise socket.error, msg
    SyntaxError: invalid syntax
    ```

    You have installed the python2.7 version of httplib2. We need the python3 version. Perhaps you didn't supply the "--no-deps" argument to pip command and you have python2 installed locally. Try removing the gae/lib directory contents and running the pip command with the "-no-deps" argument.

1. The Dataflow job fails to start because it lacks access to the Shared VPC subnet.

    When using a Shared VPC, it necessary to grant the Dataflow Agent Service Account access to the subnet. This service account is created for you when you enable the Dataflow API and is called `service-<PROJECT-NUMBER>@dataflow-service-producer-prod.iam.gserviceaccount.com`.

1. How can I speed up the import process?

   If you have a large number of a particular asset type like BigQuery tables, or Kubernetes pods you can configure the pipeline to process and load multiple shards with the 'num_shards' parameter. Try configuring it in the  of `asset-inventory/gae/config.yaml` file. For example:

   ```num_shards: *=1,resource=100,google.cloud.bigquery.Table=100```

   Within the the import_pipeline_runtime_environment value remove the `maxWorkers` limit to let the job autoscale, configure larger instance types by setting the `machineType` property to `n1-standard-16` and try enabling the the [Dataflow Shuffler](https://cloud.google.com/dataflow/docs/guides/deploying-a-pipeline#cloud-dataflow-shuffle) by adding `"additionalExperiments": ["shuffle_mode=service"]`.
