# BigQuery Managed Disaster Recovery Toolkit

## Overview

This repository provides a collection of SQL scripts and procedures designed to streamline the management and monitoring of BigQuery datasets replicated using Cross-Region Replication (CRR). These tools automate essential tasks, enhancing the efficiency and reliability of your CRR setup.

## Features

* **Estimate Initial Replication Time:** Calculate the estimated time required for initial dataset replication, aiding in planning and resource allocation.
* **Validate Replicated Data:** Verify the consistency of replicated data by comparing record counts between primary and secondary regions.
* **Switch Primary and Secondary Regions:** Orchestrate the process of promoting a secondary region to primary, ensuring seamless failover and recovery.
* **Initialize CRR:** Automate the setup and configuration of Cross-Region Replication for new datasets.
* **Track Replication History:** Monitor the status and history of replication events for enhanced visibility and troubleshooting.
* **Configure KMS Encryption Keys:** Manage customer-managed encryption keys (CMEK) for replicated datasets, ensuring data security and compliance.

## Benefits

* **Automation:** Reduce manual effort and potential errors in managing CRR.
* **Efficiency:** Optimize replication processes and resource utilization.
* **Reliability:** Enhance the resilience of your BigQuery environment with robust failover capabilities.
* **Monitoring:** Gain insights into replication status and identify potential issues proactively.
* **Security:** Strengthen data protection with CMEK integration.

## Usage

The scripts are designed to be executed within your BigQuery environment. Refer to the individual `README.md` files for each procedure for detailed usage instructions and configuration details.

## Notes

* The scripts assume the use of specific labels like `dr` and `dr_backfill_priority` to manage the replication process.
* Error handling and logging mechanisms are incorporated for robust operation.
* Batching capabilities optimize performance for large datasets.
* Comprehensive reporting features aid in monitoring and analysis.
