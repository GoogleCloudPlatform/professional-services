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

import com.google.cloud.bigtable.admin.v2.BigtableTableAdminClient;
import com.google.cloud.bigtable.admin.v2.BigtableTableAdminSettings;
import com.google.cloud.bigtable.admin.v2.models.CreateTableRequest;
import com.google.cloud.bigtable.admin.v2.models.Table;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Validator class for DataLoad pipeline options with specific validation for Bigtable
 * configurations.
 */
public class DataLoadOptionsValidator {

  /**
   * Validates all pipeline options and Bigtable configurations.
   *
   * @param options The DataLoadOptions to validate
   * @throws IllegalArgumentException If validation fails due to invalid or missing options
   */
  public static void validateOptions(DataLoadPipeline.DataLoadOptions options) {
    validateInputOptions(options);
    validateBigtableOptions(options);
    validateBigtableResources(options);
  }

  /** Validates input file path options. */
  private static void validateInputOptions(DataLoadPipeline.DataLoadOptions options) {
    if (options.getInputFilePath() == null || options.getInputFilePath().trim().isEmpty()) {
      throw new IllegalArgumentException("Cloud Storage file Path must be provided.");
    }
  }

  /** Validates Bigtable related options. */
  private static void validateBigtableOptions(DataLoadPipeline.DataLoadOptions options) {
    // Validate Bigtable configuration parameters
    if (options.getBigtableInstanceId() != null) {
      if (options.getBigtableProjectId() == null
          || options.getBigtableProjectId().trim().isEmpty()) {
        throw new IllegalArgumentException(
            "Bigtable Instance id was provided but bigtable projectid is missing.");
      }

      // Validate BigtableRowKey
      if (options.getBigtableRowKey() == null || options.getBigtableRowKey().trim().isEmpty()) {
        throw new IllegalArgumentException(
            "BigtableRowKey must be provided for mapping DynamoDB schema to Bigtable.");
      }
    }
  }

  /** Validates if the specified Bigtable resources exist. */
  private static void validateBigtableResources(DataLoadPipeline.DataLoadOptions options) {
    if (options.getBigtableInstanceId() != null) {
      try {
        // Create Bigtable admin client settings
        String projectId = options.getBigtableProjectId();
        String instanceId = options.getBigtableInstanceId();

        BigtableTableAdminSettings adminSettings =
            BigtableTableAdminSettings.newBuilder()
                .setProjectId(projectId)
                .setInstanceId(instanceId)
                .build();

        // Create admin client
        try (BigtableTableAdminClient adminClient =
            BigtableTableAdminClient.create(adminSettings)) {
          String tableId = options.getBigtableTableId();

          if (tableId == null || tableId.trim().isEmpty()) {
            // Generate table ID with current datetime
            tableId = generateTableId(adminClient, "migrated_table");

            // Create table with column family "cf1"
            CreateTableRequest createTableRequest = CreateTableRequest.of(tableId).addFamily("cf1");
            adminClient.createTable(createTableRequest);

            // Update options with the newly created table ID
            options.setBigtableTableId(tableId);
            options.setBigtableColumnFamily("cf1");
          } else {

            try {
              Table table = adminClient.getTable(tableId);
              // Check if column family is provided when table exists
              if (options.getBigtableColumnFamily() == null
                  || options.getBigtableColumnFamily().trim().isEmpty()) {
                throw new IllegalArgumentException(
                    "BigtableColumnFamily must be provided when Bigtable Table ID is specified.");
              }

              // If table exists, no need to validate column family (as per requirement)
            } catch (com.google.api.gax.rpc.NotFoundException e) {
              throw new IllegalArgumentException(
                  String.format("Table '%s' does not exist in instance '%s'", tableId, instanceId));
            }
          }
        }
      } catch (Exception e) {
        throw new IllegalArgumentException(
            "Failed to validate Bigtable resources: " + e.getMessage(), e);
      }
    }
  }

  /**
   * Generates a table ID with the given prefix and current datetime, adding a suffix if necessary
   * to ensure uniqueness.
   */
  private static String generateTableId(BigtableTableAdminClient adminClient, String prefix) {
    String baseTableId =
        prefix
            + DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
                .withZone(ZoneId.systemDefault())
                .format(Instant.now());

    String tableId = baseTableId;
    int suffix = 1;

    while (adminClient.exists(tableId)) {
      tableId = baseTableId + "_" + suffix;
      suffix++;
    }

    return tableId;
  }
}
