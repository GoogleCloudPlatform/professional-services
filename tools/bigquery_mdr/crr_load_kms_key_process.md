# KMS Key Configuration for BigQuery Cross-Region Replication

## Overview

This stored procedure manages the configuration of KMS (Key Management Service) keys for BigQuery datasets that are replicated using Cross-Region Replication (CRR). It facilitates the encryption of replicated datasets with customer-managed encryption keys (CMEK), enhancing data security and control.

## Procedure Details

**Procedure Name:** `DR_ADMIN.crr_load_kms_key_process`

**Input Parameters:**

* `var_project_id`: The ID of the Google Cloud project. (STRING, Required)
* `var_execution_region_id`: The region where the procedure is executed. (STRING, Required)
* `US_CENTRAL1_KMS_KEY`: The KMS key path for the US_CENTRAL1 region. (STRING, Required)
* `US_WEST1_KMS_KEY`: The KMS key path for the US_WEST1 region. (STRING, Required)
* `gcs_bucket_name`: The name of the Google Cloud Storage bucket for staging data. (STRING, Required)
* `load_flag`: A flag indicating whether to generate the configuration file (FALSE) or load the configuration (TRUE). (BOOL, Required)

## Usage

This procedure involves a two-step process:

**Step 1: Generate Configuration File**

1. Execute the procedure in the primary region with `load_flag` set to FALSE.
2. This generates a CSV file containing the KMS key configuration for each dataset and stores it in the specified Google Cloud Storage bucket.

**Step 2: Load Configuration**

1. Execute the procedure in the secondary region with `load_flag` set to TRUE.
2. This loads the configuration from the CSV file in the Google Cloud Storage bucket into the `DR_ADMIN.replica_kms_key_config` table.

## Notes

* The procedure requires a Google Cloud Storage bucket for staging the configuration data.
* The procedure configures KMS keys for datasets that have the `dr` label set to `true` and are classified as `highly-confidential`.
* The `DR_ADMIN.replica_kms_key_config` table stores the KMS key configuration for each dataset.
* The procedure assumes that the datasets are located in the specified region.
* The estimated replication time is an approximation and may vary depending on actual network conditions and other factors.
* The default network speed is 1 GB/s, and the default buffer percentage is 20%.
* The procedure considers only datasets with the ‘dr’ label set to ‘true’.