Feature: Dataflow Integration testing
  End to End testing for the Dataflow GCS to BQ

  Background:
  Scenario: Download the jar to test
    Given A jar at URL "gs://<<GCS_SOURCE_BUCKET>>/snapshot/com/demo/bikeshare-csv-to-bq/1.0-SNAPSHOT/bikeshare-csv-to-bq-1.0-20200116.200619-1.jar"
    Then Download the jar to "data/code/" as "dataflow.jar"
    And Check the jar is downloaded successfully

  @IngestionE2ESmokeTest
  Scenario: Data is ingested successfully
    Given Using the "dataflow.jar" and the following properties
      | project | <<PROJECT_ID>> |
      | serviceAccount | dataflow-runner-gcs-to-bq@<<PROJECT_ID>>.iam.gserviceaccount.com  |
      | dataset        | test_e                                           |
      | tempLocation     | gs://<<TEMP_GCS_BUCKET>>/temp |
      | runner           | Dataflowrunner |
      | inputFilePattern  | gs://<<INPUT_GCS_BUCKET>>/*.csv |
      | tableName         | testTable                 |
      | errorTableName    | testTableErr               |
    Then Create dataset if not present
    And Create gcs bucket for inputFilePattern if not present
    And Copy "data/input/IngestionE2ESmokeTest/data1.csv" to inputFilePattern
    And Create tempLocation if not present
    When Run dataflow application main class being "com.demo.dataflow.GoBikeToBigQuery" with proper parameters
    Then Wait for the Dataflow application to complete, maximum wait time 10 minutes
    Then Check the query "SELECT count(*) as count FROM %s.%s" returns "21" records
    And  The Query "SELECT count(*) as count FROM %s.%s" returns "5" records
    Then Clean the temp resources such as input bucket, temp bucket and dataset

  @IngestionE2EDataValidation
  Scenario: Check the correctness of data
    Given Using the "dataflow.jar" and the following properties
      | project | <<PROJECT_ID>> |
      | serviceAccount | dataflow-runner-gcs-to-bq@<<PROJECT_ID>>.iam.gserviceaccount.com  |
      | dataset        | test_ex                                                   |
      | tempLocation     | gs://<TEMP_GCS_BUCKET>>/temp |
      | runner           | Dataflowrunner |
      | inputFilePattern  | gs://<<INPUT_GCS_BUCKET>>/*.csv |
      | tableName         | testTable                 |
      | errorTableName    | testTableErr               |
    Then Create dataset if not present
    And Create gcs bucket for inputFilePattern if not present
    And Copy "data/input/IngestionE2EDataValidation/data1.csv" to inputFilePattern
    And Create tempLocation if not present
    When Run dataflow application main class being "com.demo.dataflow.GoBikeToBigQuery" with proper parameters
    Then Wait for the Dataflow application to complete, maximum wait time 10 minutes
    Then Save the file and check the based on the content "SELECT * FROM `%s.%s` order by duration_sec, end_station_id, start_time, end_time, start_station_id, start_station_name, end_station_name, bike_id"
    Then Clean the temp resources such as input bucket, temp bucket and dataset
