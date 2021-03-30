
## Intro

This Terraform module will automate the creation of infrastructure components needed for the data pipeline.

Currently it has a [BigQuery](modules/bigquery) submodule that automate the creation of
* A dataset
* A set of tables with their schema defined in [Schema folder](/schema)

The BigQuery dataset name could be passed as a parameter. However, a default value is set in [variables.tf](variables.tf)

Terraform automation is configured to use a gcs bucket as a backend. So it assumes the bucket defined in [backend.tf](backend.tf) is created and the account running terraform scripts has enough permissions to access it.

## Usage

* Export variables
```
export GCP_PROJECT=<projact ID>
export REGION=<GCP region>
export BQ_DATASET=<BigQuery Dataset Name>
```

* Update the Terraform backend bucket name in [backend.tf](backend.tf) (if necessary) and create a bucket with the same name
```
gsutil mb -l $REGION -p $GCP_PROJECT gs://<bucket name as in backend.tf> 
```

* From the **repo root folder**, set up the environment via Cloud Build
```
gcloud builds submit --config=cloudbuild_tf.yaml --substitutions=_PROJECT_ID=$GCP_PROJECT,_BQ_DATASET=$BQ_DATASET

```

## Production Considerations
* The Terraform module could be extended to include other infrastructure components required by the pipeline (e.g. Buckets, Permissions, etc)

* For the sake of simplicity we placed this Terraform module in the same folder as the data pipeline. In a production environment, it's recommend to place infrastructure automation (i.e. Terraform) in a the separate repository to be able to modify the infrastructure and the pipeline independently. Automated Cloud Build triggers could be configured on such a separate repository to update the infrastructure on code commits.