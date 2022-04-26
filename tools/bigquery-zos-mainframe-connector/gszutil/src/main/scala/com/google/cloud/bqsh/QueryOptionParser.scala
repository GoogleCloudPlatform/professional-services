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

object QueryOptionParser extends OptionParser[QueryConfig]("query") with ArgParser[QueryConfig] {
  override def parse(args: Seq[String], env: Map[String,String]): Option[QueryConfig] =
    parse(args, QueryConfig())

  head("query", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  // z/OS Options
  opt[String]("query_dsn")
    .optional
    .text("(optional) DSN to read query from in format HLQ.MEMBER or HLQ.PDS(MEMBER)")
    .action((x,c) => c.copy(queryDSN = x))

  opt[Seq[String]]("parameters_from_file")
    .text("Comma-separated query parameters in the form [NAME]:[TYPE]:[DDNAME]. An empty name creates a positional parameter. [TYPE] may be omitted to assume a STRING value in the form: name::ddname or ::ddname. NULL produces a null value.")
    .action((x,c) => c.copy(parametersFromFile = x))

  opt[Unit]("create_if_needed")
    .text("When specified, create destination table. The default value is false.")
    .action((x,c) => c.copy(createIfNeeded = true))

  opt[Unit]('m', "allow_multiple_queries")
    .text("Deprecated, use split_sql instead.")
    .action((x,c) => c.copy(splitSql = true))

  opt[Boolean]("split_sql")
    .text("When specified, splits input sql script on single queries. The default value is false.")
    .action((x,c) => c.copy(splitSql = x))

  // Standard Options

  opt[Unit]("allow_large_results")
    .text("When specified, enables large destination table sizes for legacy SQL queries.")
    .action((x,c) => c.copy(allowLargeResults = true))

  opt[Unit]("append_table")
    .text("When specified, append data to a destination table. The default value is false.")
    .action((x,c) => c.copy(appendTable = true))

  opt[Unit]("batch")
    .text("When specified, run the query in batch mode. The default value is false.")
    .action((_,c) => c.copy(batch = true))

  opt[Seq[String]]("clustering_fields")
    .text("If specified, a comma-separated list of columns is used to cluster the destination table in a query. This flag must be used with the time partitioning flags to create either an ingestion-time partitioned table or a table partitioned on a DATE or TIMESTAMP column. When specified, the table is first partitioned, and then it is clustered using the supplied columns.")
    .action((x,c) => c.copy(clusteringFields = x))

  opt[String]("destination_kms_key")
    .text("The Cloud KMS key used to encrypt the destination table data.")
    .action((x,c) => c.copy(destinationKmsKey = x))

  opt[String]("destination_schema")
    .text("The path to a local JSON schema file or a comma-separated list of column definitions in the form [FIELD]:[DATA_TYPE],[FIELD]:[DATA_TYPE]. The default value is ''.")
    .action((x,c) => c.copy(destinationSchema = x))

  opt[String]("destination_table")
    .text("The name of the destination table for writing query results. The default value is ''")
    .action((x,c) => c.copy(destinationTable = x))

  opt[Unit]("dry_run")
    .text("When specified, the query is validated but not run.")
    .action((_,c) => c.copy(dryRun = true))

  opt[String]("external_table_definition")
    .text("The table name and schema definition used in an external table query. The schema can be a path to a local JSON schema file or a comma-separated list of column definitions in the form [FIELD]:[DATA_TYPE],[FIELD]:[DATA_TYPE]. The format for supplying the table name and schema is: [TABLE]::[PATH_TO_FILE] or [TABLE]::[SCHEMA]@[SOURCE_FORMAT]=[CLOUD_STORAGE_URI]. Repeat this flag to query multiple tables.")
    .action((x,c) => c.copy(externalTableDefinition = x))

  opt[String]("label")
    .text("A label to apply to a query job in the form [KEY]:[VALUE]. Repeat this flag to specify multiple labels.")
    .action((x,c) => c.copy(label = x))

  opt[Long]("maximum_bytes_billed")
    .text("An integer that limits the bytes billed for the query. If the query goes beyond the limit, it fails (without incurring a charge). If not specified, the bytes billed is set to the project default.")
    .action((x,c) => c.copy(maximumBytesBilled = x))

  opt[Seq[String]]("parameters")
    .text("comma-separated query parameters in the form [NAME]:[TYPE]:[VALUE]. An empty name creates a positional parameter. [TYPE] may be omitted to assume a STRING value in the form: name::value or ::value. NULL produces a null value.")
    .validate{x =>
      if (x.exists(_.split(':').length != 3))
        failure("parameter must be in the form [NAME]:[TYPE]:[VALUE]")
      else
        success
    }
    .action((x,c) => c.copy(parameters = x))

  opt[Unit]("replace")
    .text("If specified, overwrite the destination table with the query results. The default value is false.")
    .action((_,c) => c.copy(replace = true))

  opt[Unit]("require_cache")
    .text("If specified, run the query only if results can be retrieved from the cache.")
    .action((_,c) => c.copy(requireCache = true))

  opt[Boolean]("require_partition_filter")
    .text("If specified, a partition filter is required for queries over the supplied table. This flag can only be used with a partitioned table.")
    .action((x,c) => c.copy(requirePartitionFilter = x))

  opt[Seq[String]]("schema_update_option")
    .text("When appending data to a table (in a load job or a query job), or when overwriting a table partition, specifies how to update the schema of the destination table. Possible values include:\n\n ALLOW_FIELD_ADDITION: Allow\nnew fields to be added\n ALLOW_FIELD_RELAXATION: Allow relaxing REQUIRED fields to NULLABLE")
    .action((x,c) => c.copy(schemaUpdateOption = x))

  opt[Long]("time_partitioning_expiration")
    .text("An integer that specifies (in seconds) when a time-based partition should be deleted. The expiration time evaluates to the partition's UTC date plus the integer value. A negative number indicates no expiration.")
    .action((x, c) => c.copy(timePartitioningExpiration = x))

  opt[String]("time_partitioning_field")
    .text("The field used to determine how to create a time-based partition. If time-based partitioning is enabled without this value, the table is partitioned based on the load time.")
    .action((x, c) => c.copy(timePartitioningField = x))

  opt[String]("time_partitioning_type")
    .text("Enables time-based partitioning on a table and sets the partition type. Currently, the only possible value is DAY which generates one partition per day.")
    .action((x, c) => c.copy(timePartitioningType = x))

  opt[Int]("timeOutMinutes")
    .text("An integer that sets how long client waits BigQuery job response from BigQuery API in minutes.")
    .action((x, c) => c.copy(timeoutMinutes = math.abs(x)))

  opt[Boolean]("use_cache")
    .text("When specified, caches the query results. The default value is true.")
    .action((x, c) => c.copy(useCache = x))

  opt[Unit]("use_legacy_sql")
    .text("When set to false, runs a standard SQL query. The default value is false (uses Standard SQL).")
    .action((x, c) => c.copy(useLegacySql = true))

  // Global options
  opt[String]("dataset_id")
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[Unit]("debug_mode")
    .text(GlobalConfig.debugModeText)
    .action((x,c) => c.copy(debugMode = true))

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
    .action((x,c) => c.copy(sync = x))

  opt[Boolean]("sync")
    .text(GlobalConfig.syncText)
    .action((x,c) => c.copy(sync = x))

  // Custom Options
  opt[String]("stats_table")
    .optional()
    .text("tablespec of table to insert stats")
    .action((x,c) => c.copy(statsTable = x))
}
