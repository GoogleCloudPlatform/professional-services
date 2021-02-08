/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.functions;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.Job;
import com.google.cloud.bigquery.JobId;
import com.google.cloud.bigquery.JobInfo;
import com.google.cloud.bigquery.QueryJobConfiguration;
import com.google.cloud.bigquery.Schema;
import com.google.cloud.bigquery.Table;
import com.google.cloud.bigquery.TableId;
import com.google.cloud.bigquery.TableResult;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** This class contains the logic to do a merge based on last update timestamp. */
public class MergeLastUpdateTSFunction {
  private static Logger LOG = LoggerFactory.getLogger(MergeLastUpdateTSFunction.class);
  private final String keyPath;
  private final String tableName;
  private final String dataset;
  private final String projectId;
  private final String primaryKey;
  private final String updateColumns;
  private final String partitionColumn;

  public MergeLastUpdateTSFunction(
      String keyPath,
      String projectId,
      String dataset,
      String tableName,
      String primaryKeyList,
      String updateColumnsList,
      String partitionColumn) {
    this.keyPath = keyPath;
    this.projectId = projectId;
    this.tableName = tableName;
    this.dataset = dataset;
    this.primaryKey = primaryKeyList;
    this.updateColumns = updateColumnsList;
    this.partitionColumn = partitionColumn;
  }

  private String getInsertSchema(Schema schema) {
    String out = "";

    if (schema == null) return out;

    List<String> fieldNames = new ArrayList<String>();
    for (Field f : schema.getFields()) {
      fieldNames.add(f.getName());
    }

    out = String.join(",", fieldNames);

    return out;
  }

  private String getPrimaryKey(String primaryKey) {
    String out = "";

    List<String> fieldNames = new ArrayList<String>();
    for (String f : primaryKey.split(",")) {
      fieldNames.add(" T." + f + "=S." + f);
    }

    out = String.join(" AND ", fieldNames);

    return out;
  }

  private String getUpdateColumns(String updateColumns) {
    String out = "";

    List<String> fieldNames = new ArrayList<String>();
    for (String f : updateColumns.split(",")) {
      fieldNames.add("T." + f + "=S." + f);
    }

    out = String.join(",", fieldNames);

    return out;
  }

  private String buildPartitionMergeQuery(
      String tableName,
      String insertSchema,
      String primaryKeyList,
      String minDate,
      String maxDate,
      String updateColumnList,
      String partitionColumn) {
    String query =
        "MERGE `{tableName}` T USING `{tableName}_LOG` S ON {primaryKeyList}\n"
            + "AND DATE(T.{partitionColumn}) BETWEEN '{minDate}' AND '{maxDate}'\n"
            + "WHEN MATCHED THEN \n"
            + "UPDATE SET {updateColumnList} \n"
            + "WHEN NOT MATCHED THEN\n"
            + "INSERT ({insertSchema}) VALUES ({insertSchema})";

    query = query.replace("{tableName}", tableName);
    query = query.replace("{insertSchema}", insertSchema);
    query = query.replace("{primaryKeyList}", primaryKeyList);
    query = query.replace("{minDate}", minDate);
    query = query.replace("{maxDate}", maxDate);
    query = query.replace("{partitionColumn}", partitionColumn);
    query = query.replace("{updateColumnList}", updateColumnList);

    return query;
  }

  private String buildMergeQuery(
      String tableName, String insertSchema, String updateColumnList, String primaryKeyList) {
    String query =
        "MERGE `{tableName}` T USING `{tableName}_LOG` S ON {primaryKeyList}\n"
            + "WHEN MATCHED THEN \n"
            + "UPDATE SET {updateColumnList} \n"
            + "WHEN NOT MATCHED THEN\n"
            + "INSERT ({insertSchema}) VALUES ({insertSchema})";

    query = query.replace("{tableName}", tableName);
    query = query.replace("{insertSchema}", insertSchema);
    query = query.replace("{primaryKeyList}", primaryKeyList);
    query = query.replace("{updateColumnList}", updateColumnList);

    return query;
  }

  public void executeMerge() throws InterruptedException {
    BigQuery bigquery = Utils.createBigQueryClient(keyPath);

    Table table = bigquery.getTable(TableId.of(this.projectId, this.dataset, this.tableName));
    TableId tableId = table.getTableId();
    Schema schema = bigquery.getTable(tableId).getDefinition().getSchema();
    String minDate = null;
    String maxDate = null;
    if (this.partitionColumn != null) {
      String minMaxDateQuery =
          "select DATE(min("
              + this.partitionColumn
              + ")) as minDate, DATE(max("
              + this.partitionColumn
              + ")) as maxDate FROM \n"
              + "`"
              + this.projectId
              + "."
              + this.dataset
              + "."
              + this.tableName
              + "_LOG`";
      LOG.info(minMaxDateQuery);
      QueryJobConfiguration minMaxDateQueryConfig =
          QueryJobConfiguration.newBuilder(minMaxDateQuery).setUseLegacySql(false).build();
      JobId minMaxDateJobId = JobId.of(UUID.randomUUID().toString());

      Job minMaxDateQueryJob =
          bigquery.create(
              JobInfo.newBuilder(minMaxDateQueryConfig).setJobId(minMaxDateJobId).build());
      minMaxDateQueryJob.waitFor();
      LOG.info("minMaxDateQuery is done: {}", minMaxDateQueryJob.isDone());

      if (minMaxDateQueryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (minMaxDateQueryJob.getStatus().getError() != null) {
        throw new RuntimeException(minMaxDateQueryJob.getStatus().getError().toString());
      }
      TableResult result = minMaxDateQueryJob.getQueryResults();

      for (FieldValueList row : result.iterateAll()) {
        minDate = row.get("minDate").getStringValue();
        maxDate = row.get("maxDate").getStringValue();
      }

      String query =
          buildPartitionMergeQuery(
              this.projectId + "." + this.dataset + "." + this.tableName,
              getInsertSchema(schema),
              getPrimaryKey(this.primaryKey),
              minDate,
              maxDate,
              getUpdateColumns(this.updateColumns),
              this.partitionColumn);

      LOG.info("Going to execute merge query: {}", query);

      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();
      JobId jobId = JobId.of(UUID.randomUUID().toString());

      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();
      LOG.info("Query is done: {}", queryJob.isDone());

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }
    } else if (this.partitionColumn == null) {
      String query =
          buildMergeQuery(
              this.projectId + "." + this.dataset + "." + this.tableName,
              getInsertSchema(schema),
              getUpdateColumns(this.updateColumns),
              getPrimaryKey(this.primaryKey));

      LOG.info("Going to execute merge query: {}", query);

      QueryJobConfiguration queryConfig =
          QueryJobConfiguration.newBuilder(query).setUseLegacySql(false).build();
      JobId jobId = JobId.of(UUID.randomUUID().toString());

      Job queryJob = bigquery.create(JobInfo.newBuilder(queryConfig).setJobId(jobId).build());
      queryJob.waitFor();
      LOG.info("Query is done: {}", queryJob.isDone());

      if (queryJob == null) {
        throw new RuntimeException("Job no longer exists");
      } else if (queryJob.getStatus().getError() != null) {
        throw new RuntimeException(queryJob.getStatus().getError().toString());
      }
    }
  }
}
