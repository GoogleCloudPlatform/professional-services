#/
# Copyright (C) 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License. You may obtain a copy of
# the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations under
# the License.
#/
Feature: Dataflow Integration testing
  End to End testing for the Dataflow GCS to BQ

  Background:

  Scenario: Download the jar to test. The same jar will be used to test all the scenarios below.
    Given A jar at URL "<<GCS location for the jar>>"
    Then Download the jar to "data/code/" as "dataflow.jar"
    And Check the jar is downloaded successfully

  @IngestionE2ESmokeTest
  Scenario: Data is ingested successfully
    Given Using the "dataflow.jar" and the following properties
      | project          | <<PROJECT_ID>>                    |
      | serviceAccount   | <<SERVICE_ACCOUNT>>               |
      | dataset          | <<DATASET>>                       |
      | tempLocation     | gs://<<GCS_TEMP_BUCKET>>/temp     |
      | runner           | Dataflowrunner                    |
      | inputFilePattern | gs://<<GCS_INPUT_LOCATION>>/*.csv |
      | tableName        | <<TABLE_NAME>>                    |
      | errorTableName   | <<ERROR_TABLE_NAME>>              |
    And BQ dataset exits
    And GCS bucket for inputFilePattern exits
    And GCS temporary location exits
    When Copy "data/input/IngestionE2ESmokeTest/data1.csv" to inputFilePattern bucket
    And Run dataflow application main class being "com.demo.dataflow.GoBikeToBigQuery" with proper parameters
    Then Wait for the Dataflow application to complete, maximum wait time 10 minutes
    And Check the query "SELECT count(*) as count FROM %s.%s" returns "21" records
    And The Query "SELECT count(*) as count FROM %s.%s" returns "5" records

  @IngestionE2EDataValidation
  Scenario: Check the correctness of data
    Given Using the "dataflow.jar" and the following properties
      | project          | <<PROJECT_ID>>                    |
      | serviceAccount   | <<SERVICE_ACCOUNT>>               |
      | dataset          | <<DATASET>>                       |
      | tempLocation     | gs://<<GCS_TEMP_BUCKET>>/temp     |
      | runner           | Dataflowrunner                    |
      | inputFilePattern | gs://<<GCS_INPUT_LOCATION>>/*.csv |
      | tableName        | <<TABLE_NAME>>                    |
      | errorTableName   | <<ERROR_TABLE_NAME>>              |
    And BQ dataset exits
    And GCS bucket for inputFilePattern exits
    And GCS temporary location exits
    When Copy "data/input/IngestionE2EDataValidation/data1.csv" to inputFilePattern bucket
    And Run dataflow application main class being "com.demo.dataflow.GoBikeToBigQuery" with proper parameters
    Then Wait for the Dataflow application to complete, maximum wait time 10 minutes
    And Save the file and check the based on the content "SELECT * FROM `%s.%s` order by duration_sec, end_station_id, start_time, end_time, start_station_id, start_station_name, end_station_name, bike_id"
