/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.dataflow.options;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.Default;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.ValueProvider;

/**
 * The pipeline options to customize the Dataflow job.
 */
public interface StreamToBigQueryPipelineOptions extends DataflowPipelineOptions {
    /**
     * Option to set the BigQuery dataset.
     */
    @Description("The BigQuery dataset.")
    ValueProvider<String> getBqDataset();

    void setBqDataset(ValueProvider<String> dataset);

    /**
     * Option to set the BigQuery table name.
     */
    @Description("The BigQuery table name.")
    ValueProvider<String> getBqTable();

    void setBqTable(ValueProvider<String> tableName);

    /**
     * Option to set the GCS sink bucket name.
     */
    @Description("GCS bucket to write failed inserts.")
    ValueProvider<String> getFileOutput();

    void setFileOutput(ValueProvider<String> fileOutput);

    /**
     * Option to set the JSON schema.
     */
    @Description("The initial JSON schema that will be used to create the table.")
    @Default.String("bq_schema/default.json")
    String getJsonSchema();

    void setJsonSchema(String jsonSchema);

    /**
     * Option to set the duration (in seconds) in windowing the streaming data.
     */
    @Description("The windowing duration (in seconds).")
    @Default.Long(10L)
    long getWindowingDuration();

    void setWindowingDuration(long durationInSeconds);

    /**
     * Option to set the delay (in seconds) before retrying failed insert retries.
     */
    @Description("The delay before retrying failed inserts (in minutes).")
    @Default.Long(10L)
    long getRetryFailedInsertDelay();

    void setRetryFailedInsertDelay(long delayMinutes);

    /**
     * Option to set topic for Kafka.
     */
    @Description("The topic for Kafka.")
    @Default.String("new_topic")
    String getKafkaTopic();

    void setKafkaTopic(String topic);

    /**
     * Option to set bootstrap servers.
     */
    @Description("The bootstrap servers for Kafka.")
    @Default.String("10.36.6.3:9092,10.36.6.6:9092,10.36.8.6:9092")
    String getBootstrapServers();

    void setBootstrapServers(String bootstrapServers);

    /**
     * Option to set schema registry url.
     */
    @Description("Schema registry url.")
    @Default.String("http://10.36.6.3:8081")
    String getSchemaRegistyUrl();

    void setSchemaRegistyUrl(String schemaRegistyUrl);

    /**
     * Option to set primary-key column name.
     */
    @Description("Primary-key column name")
    @Default.String("PK")
    String getPrimaryKeyColumnNmae();

    void setPrimaryKeyColumnNmae(String primaryKeyColumnNmae);

}
