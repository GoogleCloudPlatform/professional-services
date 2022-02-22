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

import java.net.URI

import scopt.OptionParser

import scala.util.Try

object MkOptionParser extends OptionParser[MkConfig]("mk") with ArgParser[MkConfig] {
  private val DefaultConfig = MkConfig()
  def parse(args: Seq[String]): Option[MkConfig] = parse(args, DefaultConfig)

  head("mk", Bqsh.UserAgent)

  help("help")
    .text("prints this usage text")

  arg[String]("tablespec")
    .required()
    .text("[PROJECT_ID]:[DATASET].[TABLE]")
    .action{(x,c) => c.copy(tablespec = x)}

  opt[Seq[String]]("clustering_fields")
    .text("A comma-separated list of column names used to cluster a table. This flag is currently available only for partitioned tables. When specified, the table is partitioned and then clustered using these columns.")
    .action{(x,c) => c.copy(clusteringFields = x)}

  opt[Unit]('d',"dataset")
    .text("When specified, creates a dataset. The default value is false.")
    .action{(_,c) => c.copy(dataset = true)}

  opt[Int]("default_partition_expiration")
    .text("An integer that specifies the default expiration time, in seconds, for all partitions in newly-created partitioned tables in the dataset. A partition's expiration time is set to the partition's UTC date plus the integer value. If this property is set, it overrides the dataset-level default table expiration if it exists. If you supply the --time_partitioning_expiration flag when you create or update a partitioned table, the table-level partition expiration takes precedence over the dataset-level default partition expiration.")
    .action{(x,c) => c.copy(defaultPartitionExpiration = x)}

  opt[Int]("default_table_expiration")
    .text("An integer that specifies the default lifetime, in seconds, for newly-created tables in a dataset. The expiration time is set to the current UTC time plus this value.")
    .action{(x,c) => c.copy(defaultTableExpiration = x)}

  opt[String]("description")
    .text("The description of the dataset or table.")
    .action{(x,c) => c.copy(description = x)}

  opt[String]("destination_kms_key")
    .text("The Cloud KMS key used to encrypt the table data.")
    .action{(x,c) => c.copy(destinationKmsKey = x)}

  opt[Long]("expiration")
    .text("An integer that specifies the table or view's lifetime in milliseconds. The expiration time is set to the current UTC time plus this value.")
    .action{(x,c) => c.copy(expiration = x)}

  opt[String]('e',"external_table_definition")
    .text("Specifies a table definition to used to create an external table. The format of an inline definition is format=uri. Example: ORC=gs://bucket/table_part1.orc/*,gs://bucket/table_part2.orc/*")
    .validate{s =>
      val uris = extractUris(s)
      if (!s.startsWith("ORC=")){
        failure(s"'$s' invalid format")
      } else if (uris.isEmpty){
        failure(s"'$s' invalid uri")
      }
      success
    }
    .action{(x,c) =>
      c.copy(externalTableDefinition = x, externalTableUri = extractUris(x))
    }

  private def extractUris(x: String): Seq[URI] = {
    x.stripPrefix("ORC=")
      .split(",")
      .flatMap(x => Try(new URI(x)).toOption)
      .filter(x => x.getScheme == "gs" && x.getAuthority.nonEmpty && x.getPath.nonEmpty)
  }

  opt[Unit]('f', "force")
    .text("When specified, if a resource already exists, the exit code is 0. The default value is false.")
    .action{(_,c) => c.copy(force = true)}

  opt[Seq[String]]("label")
    .text("A label to set on the table. The format is [KEY]:[VALUE]. Repeat this flag to specify multiple labels.")
    .action{(x,c) => c.copy(label = x)}

  opt[Boolean]("require_partition_filter")
    .text("When specified, this flag determines whether to require a partition filter for queries over the supplied table. This flag only applies to partitioned tables. The default value is true.")
    .action{(x,c) => c.copy(requirePartitionFilter = x)}

  opt[Seq[String]]("schema")
    .text("The path to a local JSON schema file or a comma-separated list of column definitions in the form [FIELD]:[DATA_TYPE],[FIELD]:[DATA_TYPE]. The default value is ''.")
    .action{(x,c) => c.copy(schema = x)}

  opt[Unit]('t', "table")
    .text("When specified, create a table. The default value is false.")
    .action{(_,c) => c.copy(table = true)}

  opt[Long]("time_partitioning_expiration")
    .text("An integer that specifies (in seconds) when a time-based partition should be deleted. The expiration time evaluates to the partition's UTC date plus the integer value. A negative number indicates no expiration.")
    .action{(x,c) => c.copy(timePartitioningExpiration = x)}

  opt[String]("time_partitioning_field")
    .text("The field used to determine how to create a time-based partition. If time-based partitioning is enabled without this value, the table is partitioned based on the load time.")
    .action{(x,c) => c.copy(timePartitioningField = x)}

  opt[String]("time_partitioning_type")
    .text("Enables time-based partitioning on a table and sets the partition type. Currently, the only possible value is DAY which generates one partition per day. (default: DAY")
    .action{(x,c) => c.copy(timePartitioningType = x)}

  opt[Unit]("use_legacy_sql")
    .text("When set to false, uses a standard SQL query to create a view. The default value is false (uses Standard SQL).")
    .action{(_,c) => c.copy(useLegacySql = true)}

  opt[Unit]("view")
    .text("When specified, creates a view. The default value is false.")
    .action{(_,c) => c.copy(view = true)}

  // Global options

  opt[String]("dataset_id")
    .text(GlobalConfig.datasetIdText)
    .action((x,c) => c.copy(datasetId = x))

  opt[Unit]("debug_mode")
    .text(GlobalConfig.debugModeText)
    .action((_,c) => c.copy(debugMode = true))

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
