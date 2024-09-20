# Initial Replication Time Estimator for BigQuery

## Overview

This stored procedure estimates the time required for the initial replication of BigQuery datasets using Cross-Region Replication (CRR).

## Procedure Details

**Procedure Name:** `<project_id>.DR_ADMIN.initial_replication_time_estimator`

**Input Parameters:**

*   `in_project_id`: The ID of the Google Cloud project. (STRING, Required)
*   `in_execution_region`: The region where the procedure is executed. (STRING, Required)
*   `opt_Speed_in_GBS`: The estimated replication speed in GB/s. (INT64, Optional)
*   `opt_Buffer_Percentage`: Buffer percentage to add to the estimated time. (INT64, Optional)
*   `out_total_size_in_gb`: The total size of the datasets to be replicated in GB. (FLOAT64, Output)
*   `out_total_hours`: The estimated total replication time in hours. (FLOAT64, Output)
*   `out_total_days`: The estimated total replication time in days. (FLOAT64, Output)

## Usage

To use the stored procedure, follow these steps:

1.  Replace `<project_id>` with your actual project ID.
2.  Execute the procedure in the primary region with `in_compare_flag` set to FALSE to generate the primary region count file.
3.  Execute the procedure in the secondary region with `in_compare_flag` set to FALSE to generate the secondary region count file.
4.  Execute the procedure in the secondary region with `in_compare_flag` set to TRUE to compare the record counts and store the results in the `crr_dataset_validation` table.

## Notes

*   The procedure assumes that the datasets are located in the specified region.
*   The estimated replication time is an approximation and may vary depending on actual network conditions and other factors.
*   The default network speed is 1 GB/s, and the default buffer percentage is 20%.
*   The procedure considers only datasets with the ‘dr’ label set to ‘true’.