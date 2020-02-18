Dataflow (in batch mode) reads the CSV files for Bikeshare data (https://www.bikeshare.com/data/) and write to bigquery.

`export PROJECT_ID=[PROJECT_ID]`

Create a BigQuery dataset

Expose the dataset name as environment variable `export DATASET=[BQ_DATASET]`

- `bq mk --dataset ${PROJECT_ID}:${DATASET}`

Package the application using `mvn clean install`.

export INPUT_FILE_PATTERN=[INPUT_BUCKET_NAME_IN_GCS]
export TABLE_NAME=[TABLE_NAME]
export TEMP_LOCATION=[TEMP_LOCATION_IN_GCS]
export SERVICE_ACCOUNT=[DATAFLOW_WORKER_SERVICE_ACCOUNT] #Create the service account with required permissions

Run the Dataflow application using

`java -cp target/dataflow-app-1.0-SNAPSHOT.jar com.demo.dataflow.GoBikeToBigQuery \
      --tempLocation=${TEMP_LOCATION} --project=${PROJECT_ID} \
      --serviceAccount=${SERVICE_ACCOUNT} --runner=Dataflowrunner \
      --dataset=${DATASET} --inputFilePattern=${INPUT_FILE_PATTERN} \
      --tableName=${TABLE_NAME}`
