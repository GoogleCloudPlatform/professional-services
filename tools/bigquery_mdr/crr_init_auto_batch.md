# Cross-Region Replication (CRR) Auto Batch Initialization for BigQuery

## Overview

This stored procedure initializes Cross-Region Replication (CRR) for BigQuery datasets. It automates the creation of replicas for specified datasets in a secondary region. It also handles the deletion of replicas that are no longer needed.

## Procedure Details

**Procedure Name:** `<project_id>.DR_ADMIN.crr_init_auto_batch`

**Input Parameters:**

* `var_project_id`: The ID of the Google Cloud project. (STRING, Required)
* `var_execution_region_id`: The region where the procedure is executed. (STRING, Required)
* `p_error_load_batch_id`: An ID for tracking errors. (STRING, Output)
* `p_out_status`: The status of the procedure execution. (STRING, Output)

## Usage

This procedure is designed to be executed in the primary region of your BigQuery environment. It requires configuration in the `DR_ADMIN.dr_region_config` and `DR_ADMIN.replica_inscope_projects` tables.

**Configuration:**

* `DR_ADMIN.dr_region_config`: Stores the primary region, secondary region, promotion flag, error bucket name, and reference backfill size.
* `DR_ADMIN.replica_inscope_projects`: Lists the projects that are in scope for replication.

**Execution:**

1. Ensure the configuration tables are correctly populated.
2. Execute the procedure in the primary region.

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