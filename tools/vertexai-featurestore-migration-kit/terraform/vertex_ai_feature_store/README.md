# Vertex AI Feature Store Terraform Setup

This repository contains a Terraform configuration to provision a Google Cloud Vertex AI Feature Store with optimized or Bigtable storage, a dedicated serving endpoint, and an optional feature view for vector search.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Resources](#resources)
- [Configuration](#configuration)
- [Outputs](#outputs)

## Overview

This Terraform configuration deploys:
- A Google Cloud Vertex AI Feature Store with configurable storage (optimized or Bigtable).
- A dedicated serving endpoint with optional Private Service Connect.
- A Feature View for vector search with configurable BigQuery source and vector search parameters.

## Prerequisites

1. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Terraform v1.0 or later
3. A Google Cloud project with billing enabled
4. Ensure that your user has permissions for the following:
   - Vertex AI Admin (`roles/aiplatform.admin`)
   - BigQuery Data Viewer (`roles/bigquery.dataViewer`) for accessing BigQuery sources.
   - Service Usage Admin (`roles/serviceusage.serviceUsageAdmin`) to enable required APIs.

## Resources

This configuration creates:
- **Vertex AI Feature Store**: Stores features for online and offline access.
- **Dedicated Serving Endpoint**: Configured with optional Public/Private Service Connect.
- **Feature View**: Links a BigQuery table for vector search use cases.



## Configuration

### Variables

| Variable                         | Description                                        | Default Value                          |
|----------------------------------|----------------------------------------------------|----------------------------------------|
| `project_id`                     | Google Cloud Project ID                            | `"caip-feature-store-testing"`         |
| `region`                         | Region for Vertex AI resources                     | `"us-central1"`                        |
| `feature_store_name`             | Name of the Vertex AI Feature Store                | `"vector_fs_optimized_embedding_512_100m"` |
| `feature_view_id`                | Feature view identifier                            | `"vector_fv_optimized_embedding_512_100m"` |
| `storage_type`                   | Type of storage: `"optimized"` or `"bigtable"`     | `"optimized"`                          |
| `bigquery_dataset_id`            | Dataset ID for BigQuery source                     | `"embedding_test_us_central1"`         |
| `bigquery_table_id`              | Table ID for BigQuery source                       | `"embedding_512_10m"`                  |
| `embedding_column`               | Column name for vector embedding                   | `"embedding_512"`                      |
| `embedding_dimension`            | Embedding dimension                                | `512`                                  |
| `distance_measure_type`          | Distance measure type for vector search            | `"DOT_PRODUCT_DISTANCE"`               |
| `sync_schedule`                  | Cron schedule for sync                             | `"0 0 * * *"` (daily at midnight)      |
| `enable_dedicated_serving_endpoint` | Enable a dedicated serving endpoint             | `true`                                 |
| `enable_private_service_connect` | Enable Private Service Connect for the endpoint    | `false`                                |
| `bigtable_min_node_count`        | Min nodes for Bigtable autoscaling                 | `1`                                    |
| `bigtable_max_node_count`        | Max nodes for Bigtable autoscaling                 | `5`                                    |
| `bigtable_cpu_utilization_target`| Target CPU utilization for autoscaling             | `0.8`                                  |

### Dynamic Configuration

- **Optimized Storage**: Set `storage_type` to `"optimized"`.
- **Bigtable Storage**: Set `storage_type` to `"bigtable"` and configure Bigtable autoscaling variables.
- **Feature View with Vector Search**: Ensure `embedding_column` is set. Optionally configure `filter_columns` and `crowding_column` if required.

## Outputs

| Output                           | Description                                            |
|----------------------------------|--------------------------------------------------------|
| `feature_store_id`               | Full resource name of the feature store                |
| `feature_store_state`            | Current state of the feature store                     |
| `storage_type`                   | The type of storage used (optimized or Bigtable)       |
| `bigtable_config`                | Configuration details for Bigtable (if applicable)     |
| `public_endpoint_domain_name`    | Domain name of the public endpoint                     |
| `feature_view_id`                | Full resource name of the feature view                 |
| `feature_view_create_time`       | Creation time of the feature view                      |
| `sync_schedule`                  | Configured sync schedule                               |
| `entity_id_columns`              | Configured entity ID columns                           |
| `embedding_config`               | Vector search configuration details                    |
