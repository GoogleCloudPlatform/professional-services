/*
 *  Copyright 2024 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.google.cloud.pso.migration;

import com.google.cloud.bigtable.admin.v2.BigtableInstanceAdminClient;
import com.google.cloud.bigtable.admin.v2.BigtableInstanceAdminSettings;
import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.BigtableTableAdminSettings;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.data.v2.BigtableDataClient;
import com.google.cloud.bigtable.data.v2.BigtableDataSettings;
import com.google.cloud.bigtable.data.v2.models.Query;
import com.google.cloud.pso.migration.model.InputFormat;
import com.google.cloud.pso.migration.transforms.ReadFromGCS;
import com.google.cloud.pso.migration.transforms.WriteToBigtable;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import java.io.IOException;
import java.io.InputStream;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.extensions.gcp.options.GcsOptions;
import org.apache.beam.sdk.io.FileSystems;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.Row;
import org.junit.*;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.junit.runners.MethodSorters;

@RunWith(JUnit4.class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class DataLoadPipelineTest {

  public interface DataLoadTestOptions extends PipelineOptions {
    @Description("GCS Bucket for test")
    String getTestBucket();

    void setTestBucket(String bucket);

    @Description("GCP Project ID")
    String getTestProjectId();

    void setTestProjectId(String projectId);

    @Description("Bigtable Instance ID")
    String getTestInstanceId();

    void setTestInstanceId(String instanceId);

    @Description("Bigtable Table ID")
    @Default.String("test-dynamo-bt-migration-table")
    String getTestTableId();

    void setTestTableId(String tableId);
  }

  private static final String DEFAULT_COLUMN_FAMILY = "cf";
  private static final int EXPECTED_ROW_COUNT = 3335;
  private static final String SAMPLE_ROW_KEY = "USER#b8d09699-aa59-423b-a877-7acf0c6635ba";
  private static final String SAMPLE_COLUMN_QUALIFIER = "Education.Schools";

  private static String projectId;
  private static String instanceId;
  private static String tableId;
  private static String inputFileName;
  private static BigtableDataClient bigtableDataClient;

  @BeforeClass
  public static void setUp() throws IOException {
    DataLoadTestOptions options =
        PipelineOptionsFactory.fromArgs(System.getProperty("testargs", "").split("\\s+"))
            .as(DataLoadTestOptions.class);

    // Configure test setup
    inputFileName = "gs://" + options.getTestBucket() + "/sample-dynamodb-export.json.gz";
    projectId = options.getTestProjectId();
    instanceId = options.getTestInstanceId();
    tableId = options.getTestTableId();

    // Initialize test pipeline and file systems
    TestPipeline testPipeline = TestPipeline.create();
    FileSystems.setDefaultPipelineOptions(testPipeline.getOptions().as(GcsOptions.class));

    // Upload test file to GCS
    uploadTestFileToGCS(options);
    createTable();

    // Initialize Bigtable client
    bigtableDataClient =
        BigtableDataClient.create(
            BigtableDataSettings.newBuilder()
                .setProjectId(projectId)
                .setInstanceId(instanceId)
                .build());
  }

  private static void uploadTestFileToGCS(DataLoadTestOptions options) throws IOException {
    try (InputStream inputStream =
        DataLoadPipelineTest.class
            .getClassLoader()
            .getResourceAsStream("sample-dynamodb-export.json.gz")) {

      if (inputStream == null) {
        throw new IOException("Test file not found in resources");
      }

      byte[] fileContent = inputStream.readAllBytes();
      Storage storage = StorageOptions.newBuilder().setProjectId(projectId).build().getService();

      BlobId blobId = BlobId.of(options.getTestBucket(), "sample-dynamodb-export.json.gz");
      BlobInfo blobInfo = BlobInfo.newBuilder(blobId).build();
      storage.create(blobInfo, fileContent);
    }
  }

  @AfterClass
  public static void tearDown() throws IOException {
    if (bigtableDataClient != null) {
      bigtableDataClient.close();
    }

    // Delete test table
    try (BigtableTableAdminClient tableAdminClient =
        BigtableTableAdminClient.create(
            BigtableTableAdminSettings.newBuilder()
                .setProjectId(projectId)
                .setInstanceId(instanceId)
                .build())) {

      tableAdminClient.deleteTable(tableId);
    }
  }

  @Test
  public void testADataLoadPipeline() throws InterruptedException, IOException {
    DataLoadPipeline.DataLoadOptions options =
        PipelineOptionsFactory.create().as(DataLoadPipeline.DataLoadOptions.class);

    options.setInputFilePath(inputFileName);
    options.setBigtableProjectId(projectId);
    options.setBigtableInstanceId(instanceId);
    options.setBigtableTableId(tableId);
    options.setBigtableRowKey("Username");
    options.setBigtableColumnFamily(DEFAULT_COLUMN_FAMILY);
    options.setBigtableMaxMutationsPerRow(100);

    Pipeline pipeline = Pipeline.create(options);

    PCollection<Row> inputData =
        pipeline.apply(
            "Read from Cloud Storage",
            new ReadFromGCS(
                inputFileName,
                InputFormat.DYNAMO,
                options.getBigtableRowKey(),
                options.getBigtableColumnFamily()));

    Assert.assertNotNull("Input data should not be null", inputData);

    inputData.apply(
        "Write To Bigtable", new WriteToBigtable(options.getBigtableMaxMutationsPerRow()));

    pipeline.run();

    testBigtableRowExists();
  }

  @Test
  public void testBigtableRowExists() {
    Query query = Query.create(tableId).rowKey(SAMPLE_ROW_KEY);
    var rows = bigtableDataClient.readRows(query);

    Assert.assertTrue("Row with key should exist", rows.iterator().hasNext());
  }

  @Test
  public void testBigtableRowCount() {
    Query query = Query.create(tableId);
    var rows = bigtableDataClient.readRows(query);

    int count = (int) rows.stream().count();
    Assert.assertEquals("Unexpected row count in Bigtable", EXPECTED_ROW_COUNT, count);
  }

  @Test
  public void testBigtableColumnQualifierExists() {
    Query query = Query.create(tableId).rowKey(SAMPLE_ROW_KEY);
    var rows = bigtableDataClient.readRows(query);

    boolean columnFound =
        rows.iterator().next().getCells().stream()
            .anyMatch(
                cell ->
                    cell.getFamily().equals(DEFAULT_COLUMN_FAMILY)
                        && cell.getQualifier().toStringUtf8().equals(SAMPLE_COLUMN_QUALIFIER));

    Assert.assertTrue("Column qualifier should exist", columnFound);
  }

  private static void createTable() throws IOException {
    try (BigtableInstanceAdminClient instanceAdminClient =
            BigtableInstanceAdminClient.create(
                BigtableInstanceAdminSettings.newBuilder().setProjectId(projectId).build());
        BigtableTableAdminClient tableAdminClient =
            BigtableTableAdminClient.create(
                BigtableTableAdminSettings.newBuilder()
                    .setProjectId(projectId)
                    .setInstanceId(instanceId)
                    .build())) {

      if (!tableAdminClient.exists(tableId)) {
        CreateTableRequest createTableRequest =
            CreateTableRequest.of(tableId).addFamily(DEFAULT_COLUMN_FAMILY);
        tableAdminClient.createTable(createTableRequest);
      }
    }
  }
}
