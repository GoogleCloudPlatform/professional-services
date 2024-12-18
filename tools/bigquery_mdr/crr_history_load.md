# Cross-Region Replication (CRR) History Load for BigQuery

## Overview

This stored procedure captures the promotion and replication status of BigQuery datasets replicated using Cross-Region Replication (CRR) and stores this information in the `dr_replication_history` table. This allows for monitoring and tracking the state of replicated datasets.

## Procedure Details

**Procedure Name:** `<project_id>.DR_ADMIN.crr_history_load`

**Input Parameters:**

* `var_project_id`: The ID of the Google Cloud project. (STRING, Required)
* `var_execution_region_id`: The region where the procedure is executed. (STRING, Required)
* `var_reporting_flag`: A flag indicating whether to load all datasets status (TRUE) or only the replication delayed datasets (FALSE). (BOOL, Required)
* `var_delay_in_mins`: The delay in minutes to trigger a replication alert. (INT64, Required)
* `p_hist_load_batch_id`: An ID for tracking the history load process. (STRING, Output)
* `p_error_load_batch_id`: An ID for tracking errors. (STRING, Output)
* `p_out_status`: The status of the procedure execution. (STRING, Output)

## Usage

This procedure is designed to be executed in the secondary region of your BigQuery environment. It requires configuration in the `DR_ADMIN.dr_region_config` table.

**Configuration:**

* `DR_ADMIN.dr_region_config`: Stores the primary region, secondary region, promotion flag, error bucket name, and reference backfill size.

**Execution:**

1. Ensure the configuration tables are correctly populated.
2. Execute the procedure in the secondary region.

## Notes

* The procedure uses the `dr` label to identify datasets for replication.
* The `dr_backfill_priority` label is used to prioritize datasets for replication.
* The procedure batches datasets to optimize replication performance.
* Errors are logged to a Google Cloud Storage bucket.
* The procedure handles both the creation and deletion of replicas.
* The procedure assumes that the datasets are located in the specified region.
* The estimated replication time is an approximation and may vary depending on actual network conditions and other factors.
* The default network speed is 1 GB/s, and the default buffer percentage is 20%.
* The procedure considers only datasets with the ‘dr’ label set to ‘true’.