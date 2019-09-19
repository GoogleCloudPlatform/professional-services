/*
 * Copyright 2019 Google LLC All Rights Reserved.
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

package com.google.cloud.bqsh

import scopt.OptionParser

object LoadOptionParser extends OptionParser[LoadConfig]("load") with ArgParser [LoadConfig] {
  def parse(args: Seq[String]): Option[LoadConfig] =
    parse(args, LoadConfig())

  head("load", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  arg[String]("tablespec")
    .required()
    .text("Tablespec in format [PROJECT]:[DATASET].[TABLE]")
    .action((x,c) => c.copy(tablespec = x))

  arg[Seq[String]]("path")
    .required()
    .text("Comma-separated source URIs in format gs://bucket/path,gs://bucket/path")
    .action((x,c) => c.copy(path = x))

  arg[Seq[String]]("schema")
    .optional()
    .text("""Comma-separated list of column definitions in the form [FIELD]:[DATA_TYPE],[FIELD]:[DATA_TYPE].""")
    .action((x,c) => c.copy(schema = x))

  opt[Unit]("allow_jagged_rows")
    .text("""When specified, allow missing trailing optional columns in CSV data.""")
    .action((x,c) => c.copy(allow_jagged_rows = true))

  opt[Unit]("allow_quoted_newlines")
    .text("""When specified, allow quoted newlines in CSV data.""")
    .action((x,c) => c.copy(allow_quoted_newlines = true))

  opt[Unit]("autodetect")
  .text("""When specified, enable schema auto-detection for CSV and JSON data.""")
    .action((x,c) => c.copy(autodetect = true))

  opt[String]("destination_kms_key")
    .text("""The Cloud KMS key for encryption of the destination table data.""")
    .action((x,c) => c.copy(destination_kms_key = x))

  opt[String]('E',"encoding")
    .text("""The character encoding used in the data. Possible values include:
ISO-8859-1 (also known as Latin-1) UTF-8""")
    .action((x,c) => c.copy(encoding = x))

  opt[String]('F',"field_delimiter")
    .text("""The character that indicates the boundary between columns in the data. Both \t and tab are allowed for tab delimiters.""")
    .action((x,c) => c.copy(field_delimiter = x))

  opt[Unit]("ignore_unknown_values")
    .text("""When specified, allow and ignore extra, unrecognized values in CSV or JSON data.""")
    .action((_,c) => c.copy(ignore_unknown_values = true))

  opt[Int]("max_bad_records")
    .text("""An integer that specifies the maximum number of bad records allowed before the entire job fails. The default value is 0. At most, five errors of any type are returned regardless of the --max_bad_records value.""")
    .action((x,c) => c.copy(max_bad_records = x))

  opt[String]("null_marker")
    .text("""An optional custom string that represents a NULL value in CSV data.""")
    .action((x,c) => c.copy(null_marker = x))

  opt[Seq[String]]("clustering_fields")
    .text("If specified, a comma-separated list of columns is used to cluster the destination table in a query. This flag must be used with the time partitioning flags to create either an ingestion-time partitioned table or a table partitioned on a DATE or TIMESTAMP column. When specified, the table is first partitioned, and then it is clustered using the supplied columns.")
    .action((x,c) => c.copy(clusteringFields = x))

  opt[Seq[String]]("projection_fields")
    .text("""If used with --source_format set to DATASTORE_BACKUP, indicates which entity properties to load from a Cloud Datastore export as a comma-separated list. Property names are case sensitive and must refer to top-level properties. The default value is ''. This flag can also be used with Cloud Firestore exports.""")
    .action((x,c) => c.copy(projection_fields = x))

  opt[String]("quote")
    .text("""The quote character to use to enclose records. The default value is " which indicates no quote character.""")
    .action((x,c) => c.copy(quote = x))

  opt[Unit]("replace")
    .text("""When specified, existing data is erased when new data is loaded. The default value is false.""")
    .action((_,c) => c.copy(replace = true))

  opt[Unit]("append_table")
    .text("When specified, append data to a destination table. The default value is false.")
    .action((_,c) => c.copy(append = true))

  opt[Seq[String]]("schema")
    .text("""Comma-separated list of column definitions in the form [FIELD]:[DATA_TYPE],[FIELD]:[DATA_TYPE].""")
    .action((x,c) => c.copy(schema = x))

  opt[Seq[String]]("schema_update_option")
    .text("""When appending data to a table (in a load job or a query job), or when overwriting a table partition, specifies how to update the schema of the destination table. Possible values include:
ALLOW_FIELD_ADDITION: Allow new fields to be added
ALLOW_FIELD_RELAXATION: Allow relaxing REQUIRED fields to NULLABLE
Repeat this flag to specify multiple schema update options.""")
    .action((x,c) => c.copy(schema_update_option = x))

  opt[Long]("skip_leading_rows")
    .text("""An integer that specifies the number of rows to skip at the beginning of the source file.""")
    .action((x,c) => c.copy(skip_leading_rows = x))

  opt[String]("source_format")
    .text("""The format of the source data. Possible values include: CSV NEWLINE_DELIMITED_JSON AVRO DATASTORE_BACKUP PARQUET ORC (Default: ORC)""")
    .action((x,c) => c.copy(source_format = x))

  opt[Long]("time_partitioning_expiration")
    .text("""An integer that specifies (in seconds) when a time-based partition should be deleted. The expiration time evaluates to the partition's UTC date plus the integer value. A negative number indicates no expiration.""")
    .action((x,c) => c.copy(time_partitioning_expiration = x))

  opt[String]("time_partitioning_field")
    .text("""The field used to determine how to create a time-based partition. If time-based partitioning is enabled without this value, the table is partitioned based on the load time.""")
    .action((x,c) => c.copy(time_partitioning_field = x))

  opt[String]("time_partitioning_type")
    .text("""Enables time-based partitioning on a table and sets the partition type. Currently, the only possible value is DAY which generates one partition per day.""")
    .action((x,c) => c.copy(time_partitioning_type = x))

  opt[Boolean]("require_partition_filter")
    .text("If specified, a partition filter is required for queries over the supplied table. This flag can only be used with a partitioned table.")
    .action((x,c) => c.copy(requirePartitionFilter = x))

  opt[Boolean]("use_avro_logical_types")
    .text("""If sourceFormat is set to AVRO, indicates whether to convert logical types into their corresponding types (such as TIMESTAMP) instead of only using their raw types (such as INTEGER).""")
    .action((x,c) => c.copy(use_avro_logical_types = x))

  // Global options

  opt[String]("dataset_id")
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[Boolean]("debug_mode")
    .text(GlobalConfig.debugModeText)
    .action((x,c) => c.copy(debugMode = x))

  opt[String]("job_id")
    .text(GlobalConfig.jobIdText)
    .action((x,c) => c.copy(jobId = x))

  opt[String]("location")
    .text(GlobalConfig.locationText)
    .action((x,c) => c.copy(location = x))

  opt[String]("project_id")
    .text(GlobalConfig.projectIdText)
    .action((x,c) => c.copy(projectId = x))

  opt[Boolean]("synchronous_mode")
    .text(GlobalConfig.synchronousModeText)
    .action((x,c) => c.copy(synchronousMode = x))

  opt[Boolean]("sync")
    .text(GlobalConfig.syncText)
    .action((x,c) => c.copy(sync = x))

  // Custom Options
  opt[String]("stats_table")
    .optional()
    .text("tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))
}
