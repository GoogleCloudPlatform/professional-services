# BigQuery Region Switch

## Overview

This stored procedure orchestrates the process of switching primary and secondary regions for BigQuery datasets in a Cross-Region Replication (CRR) setup. It promotes the designated secondary region to become the new primary region.

## Procedure Details

**Procedure Name:** `<project_id>.DR_ADMIN.dr_switch`

**Input Parameters:**

* `var_project_id`: The ID of the Google Cloud project. (STRING, Required)
* `var_execution_region_id`: The region where the procedure is executed. (STRING, Required)
* `p_error_load_batch_id`: An ID for tracking errors. (STRING, Output)
* `p_out_status`: The status of the procedure execution. (STRING, Output)

## Usage

This procedure is designed to be executed in the secondary region that is intended to be promoted to primary. It relies on the configuration settings in the `DR_ADMIN.dr_region_config` table.

**Configuration:**

* `DR_ADMIN.dr_region_config`: Stores the primary region, secondary region, promotion flag, error bucket name, and other relevant settings.

**Execution:**

1. Ensure the `DR_ADMIN.dr_region_config` table is correctly populated with the desired settings.
2. Execute the procedure in the secondary region.

## Notes

* The procedure updates reservation settings to reflect the new primary region.
* It includes error handling and logging to a Google Cloud Storage bucket.
* The procedure assumes that the datasets are located in the specified region.
* The estimated replication time is an approximation and may vary depending on actual network conditions and other factors.
* The default network speed is 1 GB/s, and the default buffer percentage is 20%.
* The procedure considers only datasets with the ‘dr’ label set to ‘true’.