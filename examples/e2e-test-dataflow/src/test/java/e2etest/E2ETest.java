/*
 * Copyright (C) 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package e2etest;

import com.google.cloud.bigquery.FieldValueList;
import cucumber.api.java.After;
import cucumber.api.java.en.Given;
import cucumber.api.java.en.Then;
import cucumber.api.java.en.When;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;
import java.util.logging.Logger;
import util.BQUtils;
import util.BashOutput;
import util.CompareContent;
import util.DFJobConstants;
import util.MyBashExecutor;
import util.Utils;

public class E2ETest {

  private static final Logger LOGGER = Logger.getLogger(E2ETest.class.getName());

  Map<String, String> myDataTable;
  String jarName;
  String jobId;
  String jarURL;

  @Given("A jar at URL {string}")
  public void a_jar_at_URL(String jarURL) {
    this.jarURL = jarURL;
  }

  @Then("Download the jar to {string} as {string}")
  public void download_the_jar_to_as(String localPath, String jarName) throws Exception {
    this.jarName = jarName;
    BashOutput output = Utils.copyFileFromGCSToLocal(jarURL, localPath + jarName);
    assert (output.getStatus() == 0);
  }

  @Given("Using the {string} and the following properties")
  public void using_the_and_the_following_properties(
      String jarName, io.cucumber.datatable.DataTable dataTable) throws Exception {
    this.jarName = jarName;
    myDataTable = dataTable.asMap(String.class, String.class);
  }

  @Then("Check the jar is downloaded successfully")
  public void check_the_jar_is_downloaded_successfully() {
    assert Files.exists(Paths.get("data/code/" + this.jarName)) == true;
  }

  @Given("BQ dataset exits")
  public void bq_dataset_exits() throws Exception {
    BashOutput output = Utils.createBigQueryDataset(myDataTable.get("dataset"));
    assert (output.getStatus() == 0);
  }

  @Given("GCS bucket for inputFilePattern exits")
  public void gcs_bucket_for_inputFilePattern_exits() throws Exception {
    String gcsbucket = myDataTable.get("inputFilePattern");
    String bucket = "gs://" + gcsbucket.split("/")[2];
    BashOutput output = Utils.createGCSBucket(bucket);
    assert (output.getStatus() == 0);
  }

  @Given("GCS temporary location exits")
  public void gcs_temporary_location_exits() throws Exception {
    String gcsbucket = myDataTable.get("tempLocation");
    String bucket = "gs://" + gcsbucket.split("/")[2];
    BashOutput output = Utils.createGCSBucket(bucket);
    assert (output.getStatus() == 0);
  }

  @When("Copy {string} to inputFilePattern bucket")
  public void copy_to_inputFilePattern(String files) throws Exception {
    // Write code here that turns the phrase above into concrete actions
    String inputPattern = myDataTable.get("inputFilePattern");
    String bucket = inputPattern.substring(0, inputPattern.lastIndexOf("/"));
    BashOutput output = Utils.copyFileFromLocalToGCS(bucket, files);
    assert (output.getStatus() == 0);
  }

  @When("Run dataflow application main class being {string} with proper parameters")
  public void run_dataflow_application_main_class_being_with_proper_parameters(String mainClass)
      throws Exception {

    StringBuffer sb = new StringBuffer();
    String[] feildForDataflowParams = {
      "tempLocation",
      "project",
      "serviceAccount",
      "runner",
      "dataset",
      "tableName",
      "inputFilePattern"
    };
    for (String key : feildForDataflowParams) {
      sb.append("--").append(key).append("=").append(myDataTable.get(key)).append(" ");
    }
    String command = "java -cp data/code/" + jarName + " " + mainClass + " " + sb.toString();
    BashOutput output = MyBashExecutor.executeCommand(command);

    for (String s : output.getOutput()) {
      if (s.contains("Submitted job:")) {
        jobId = s.replace("Submitted job:", "").trim();
      }
    }
    assert (output.getStatus() == 0);
  }

  @Then("Wait for the Dataflow application to complete, maximum wait time {int} minutes")
  public void wait_for_the_dataflow_application_to_complete_maximum_wait_time_minutes(Integer time)
      throws Exception {

    long startTime = System.currentTimeMillis();
    String command = String.format("gcloud dataflow jobs describe %s", jobId);
    BashOutput result;
    do {
      result = MyBashExecutor.executeCommand(command);
      Thread.sleep(10000L);
    } while ((result.getOutput().contains(DFJobConstants.doneStateRunning)
            || result.getOutput().contains(DFJobConstants.doneStatePending))
        && (System.currentTimeMillis() - startTime) < time * 60 * 1000L);

    assert (result.getOutput().contains(DFJobConstants.doneStateDone));
  }

  @Then("Check the query {string} returns {string} records")
  public void check_the_query_returns_records(String query, String count) throws Exception {
    long countData = Long.valueOf(count);
    Iterable<FieldValueList> it =
        BQUtils.getResult(
            String.format(query, myDataTable.get("dataset"), myDataTable.get("tableName")));
    long countFromResult = -1L;
    for (FieldValueList row : it) {
      countFromResult = row.get("count").getLongValue();
    }
    assert (countData == countFromResult);
  }

  @Then("The Query {string} returns {string} records")
  public void the_Query_returns_records(String query, String count) throws Exception {
    long countData = Long.valueOf(count);
    Iterable<FieldValueList> it =
        BQUtils.getResult(
            String.format(query, myDataTable.get("dataset"), myDataTable.get("errorTableName")));
    long countFromResult = -1L;
    for (FieldValueList row : it) {
      countFromResult = row.get("count").getLongValue();
    }
    assert (countData == countFromResult);
  }

  @Then("Save the file and check the based on the content {string}")
  public void save_the_file_and_check_the_based_on_the_content(String query) throws Exception {
    String filePath = "data/output/IngestionE2EDataValidation/result.csv";
    Files.delete(Paths.get(filePath));
    Utils.saveQueryResultToFile(
        String.format(query, myDataTable.get("dataset"), myDataTable.get("tableName")), filePath);
    assert (true
        == CompareContent.compareFiles(
            "data/output/IngestionE2EDataValidation/result.csv",
            "data/expected-output/IngestionE2EDataValidation/result.csv"));
  }

  @After(value = "@IngestionE2ESmokeTest or @IngestionE2EDataValidation")
  public void afterIngestionE2ESmokeTest() {
    try {
      String gcsbucket = myDataTable.get("tempLocation");
      String bucket = "gs://" + gcsbucket.split("/")[2];
      Utils.deleteGCSBucket(bucket);
    } catch (Exception e) {
    }
    try {
      String gcsbucket = myDataTable.get("inputFilePattern");
      String bucket = "gs://" + gcsbucket.split("/")[2];
      Utils.deleteGCSBucket(bucket);
    } catch (Exception e) {
    }
    try {
      String dataset = myDataTable.get("dataset");
      Utils.deleteBigQueryDataset(dataset);
    } catch (Exception e) {
    }
  }
}
