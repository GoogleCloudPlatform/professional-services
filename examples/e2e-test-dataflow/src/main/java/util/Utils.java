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
package util;

import com.google.cloud.bigquery.FieldValueList;
import java.io.BufferedWriter;
import java.io.FileWriter;

/**
 * A wrapper class for general utility commands such as coping the files in GCS, creating buckets
 * and removing buckets in GCS Creating BigQuery datasets.
 */
public class Utils {

  public static BashOutput createGCSBucket(String bucketName) throws Exception {
    return MyBashExecutor.executeCommand(String.format("gsutil mb %s", bucketName));
  }

  public static BashOutput createBigQueryDataset(String datasetName) throws Exception {
    return MyBashExecutor.executeCommand(String.format("bq mk --dataset %s", datasetName));
  }

  public static BashOutput copyFileFromGCSToLocal(String gcsPath, String localPath)
      throws Exception {
    String command = String.format("gsutil cp %s %s", gcsPath, localPath);
    return MyBashExecutor.executeCommand(command);
  }

  public static BashOutput copyFileFromLocalToGCS(String gcsPath, String localPath)
      throws Exception {
    String command = String.format("gsutil cp %s %s", localPath, gcsPath);
    return MyBashExecutor.executeCommand(command);
  }

  public static BashOutput deleteGCSBucket(String gcsPath) throws Exception {
    String command = String.format("gsutil rm -r -f %s", gcsPath);
    return MyBashExecutor.executeCommand(command);
  }

  public static BashOutput deleteBigQueryDataset(String dataset) throws Exception {
    String command = String.format("bq rm -r -f %s", dataset);
    return MyBashExecutor.executeCommand(command);
  }

  public static void saveQueryResultToFile(String query, String filePath) throws Exception {
    try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath, true))) {
      for (FieldValueList row : BQUtils.getResult(query)) {
        writer.write(
            row.get(0).getStringValue()
                + ","
                + row.get(1).getStringValue()
                + ","
                + row.get(2).getStringValue()
                + ","
                + row.get(3).getStringValue()
                + ","
                + row.get(4).getStringValue()
                + ","
                + row.get(5).getStringValue()
                + ","
                + row.get(6).getStringValue()
                + ","
                + row.get(7).getStringValue()
                + ","
                + row.get(8).getStringValue()
                + ","
                + row.get(9).getStringValue()
                + ","
                + row.get(10).getStringValue()
                + ","
                + row.get(11).getStringValue()
                + ","
                + row.get(12).getStringValue()
                + ","
                + row.get(13).getStringValue()
                + "\n");
      }
    }
  }
}
