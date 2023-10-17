# MLOps with Vertex AI

## Set up the experimentation notebook

Once the environment has been deployed, the first step is to open the Jupyter notebook available in the [Vertex Workbench section](https://console.cloud.google.com/vertex-ai/workbench/list/managed), under the specific region (e.g. `europe-west4`).
Use the `OPEN JUPYTERLAB` button to launch the notebook. Once it is ready, you can use the menu option `Git -> Clone a Repository` to clone the Github repo.


## Set up the required tables

For the Vertex MLOps end2end example we will use the public dataset `bigquery-public-data:ml_datasets.ulb_fraud_detection` that contains anonymized credit card transactions made over 2 days in September 2013 by European cardholders, with 492 frauds out of 284,807 transactions.

```
Andrea Dal Pozzolo, Olivier Caelen, Reid A. Johnson and Gianluca Bontempi. Calibrating Probability with Undersampling for Unbalanced Classification. In Symposium on Computational Intelligence and Data Mining (CIDM), IEEE, 2015
```

If the destination dataset is located in a different region from the source dataset (US) you will need to copy the data to the desired region. You can use the Data Transfer Service or an extracing/load procedure such as the following one. 
The script `create_tables.sh` has also been provided for convenience. 
You will need to repeat this procedure for each environment. In a productive environment, it will be necessary to modify the pipeline to access the correct bigquery dataset.

```
#Set up env vars
PROJECT=<your Project ID>
SRC_TABLE=bigquery-public-data:ml_datasets.ulb_fraud_detection
BQ_DATASET_NAME=creditcards
BQ_SOURCE_TABLE=creditcards
ML_TABLE=creditcards_ml
DST_TABLE=$BQ_DATASET_NAME.$BQ_SOURCE_TABLE
BUCKET=gs://$PROJECT/data/credit_cards*

#Extract & Load
bq extract --project_id $PROJECT --destination_format PARQUET $SRC_TABLE  $BUCKET
bq load    --project_id $PROJECT --source_format=PARQUET --replace=true $DST_TABLE $BUCKET 
gsutil rm $BUCKET
```

As next steps, we will create the base table we will use for the ML process:
```
sql_script="CREATE OR REPLACE TABLE \`${PROJECT}.${BQ_DATASET_NAME}.${ML_TABLE}\` 
AS (
    SELECT 
      * EXCEPT(Class),
      CAST(Class AS FLOAT64) as Class,
      IF(ABS(MOD(FARM_FINGERPRINT(CAST(Time AS STRING)), 100)) <= 80, 'UNASSIGNED', 'TEST') AS ML_use
    FROM
      \`${PROJECT}.${BQ_DATASET_NAME}.${BQ_SOURCE_TABLE}\`
)
"

bq query --project_id $PROJECT --nouse_legacy_sql "$sql_script"
```

## Set up the Vertex managed Dataset
Run the following commands to setup the Vertex Dataset.

```

bq_uri="bq://${PROJECT}.${BQ_DATASET_NAME}.${ML_TABLE}"
echo ${bq_uri}

echo "{
  \"display_name\": \"creditcards\",
  \"metadata_schema_uri\": \"gs://google-cloud-aiplatform/schema/dataset/metadata/tabular_1.0.0.yaml\",
  \"metadata\": {
    \"input_config\": {
      \"bigquery_source\" :{
        \"uri\": \"${bq_uri}\" 
      }
    }
  }
}" > request.json


REGION=europe-west4
ENDPOINT=$REGION-aiplatform.googleapis.com

curl -X POST \
-H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
-H "Content-Type: application/json; charset=utf-8" \
-d @request.json \
"https://${ENDPOINT}/v1/projects/${PROJECT}/locations/${REGION}/datasets"

```


## Test the build process
You can test the overall build process from the Github Actions section.
- **Build Containers**: This action will create the different docker containers that will be used during the Vertex AI pipeline compilation and execution.
- **Build Vertex AI pipeline**: This action will run the unit tests and if they are executed sucesfull it will compile the Vertex pipeline.
- **Run Vertex AI pipeline**: This action will execute the Vertex pipeline. Please note that the first time it is possible that the pipeline fails with `Error: Vertex AI Service Agent`. Just re-run the pipeline and it should work.
- **Deploy model**: This action will deploy the model to a Vertex AI endpoint.


## Troubleshooting

See [Issues](./ISSUES.md)
