# GCP Data Services blueprints

The blueprints in this folder implement **typical data service topologies** and **end-to-end scenarios**, that allow testing specific features like Cloud KMS to encrypt your data, or VPC-SC to mitigate data exfiltration.

They are meant to be used as minimal but complete starting points to create actual infrastructure, and as playgrounds to experiment with specific Google Cloud features.

## Blueprints

### Cloud SQL instance with multi-region read replicas

<a href="./cloudsql-multiregion/" title="Cloud SQL instance with multi-region read replicas"><img src="./cloudsql-multiregion/images/diagram.png" align="left" width="280px"></a>
This [blueprint](./cloudsql-multiregion/) creates a [Cloud SQL instance](https://cloud.google.com/sql) with multi-region read replicas as described in the [Cloud SQL for PostgreSQL disaster recovery](https://cloud.google.com/architecture/cloud-sql-postgres-disaster-recovery-complete-failover-fallback) article.

<br clear="left">

### GCE and GCS CMEK via centralized Cloud KMS

<a href="./cmek-via-centralized-kms/" title="CMEK on Cloud Storage and Compute Engine via centralized Cloud KMS"><img src="./cmek-via-centralized-kms/diagram.png" align="left" width="280px"></a> This [blueprint](./cmek-via-centralized-kms/) implements [CMEK](https://cloud.google.com/kms/docs/cmek) for GCS and GCE, via keys hosted in KMS running in a centralized project. The blueprint shows the basic resources and permissions for the typical use case of application projects implementing encryption at rest via a centrally managed KMS service.

<br clear="left">

### Cloud Composer version 2 private instance, supporting Shared VPC and external CMEK key

<a href="./composer-2/" title="# Cloud Composer version 2 private instance, supporting Shared VPC and external CMEK key
"><img src="./composer-2/diagram.png" align="left" width="280px"></a>
This [blueprint](./composer-2/) creates a [Cloud Composer](https://cloud.google.com/composer/) version 2 instance on a VPC with a dedicated service account. The solution supports as inputs: a Shared VPC and Cloud KMS CMEK keys.

<br clear="left">

### Data Platform Foundations

<a href="./data-platform-foundations/" title="Data Platform Foundations"><img src="./data-platform-foundations/images/overview_diagram.png" align="left" width="280px"></a>
This [blueprint](./data-platform-foundations/) implements a robust and flexible Data Foundation on GCP that provides opinionated defaults, allowing customers to build and scale out additional data pipelines quickly and reliably.

<br clear="left">

### Data Playground starter with Cloud Vertex AI Notebook and GCS

<a href="./data-playground/" title="Data Playground project with Cloud Vertex AI Notebook, BigQuery and GCS"><img src="./data-playground/diagram.png" align="left" width="280px"></a>
This [blueprint](./data-playground/) creates a [Vertex AI
Notebook](https://cloud.google.com/vertex-ai/docs/workbench/introduction)
running on a VPC with a private IP and a dedicated Service Account. A GCS bucket and a BigQuery dataset are created to store inputs and outputs of data experiments.

<br clear="left">

### Cloud Storage to Bigquery with Cloud Dataflow with least privileges

<a href="./gcs-to-bq-with-least-privileges/" title="Cloud Storage to Bigquery with Cloud Dataflow with least privileges"><img src="./gcs-to-bq-with-least-privileges/images/diagram.png" align="left" width="280px"></a> This [blueprint](./gcs-to-bq-with-least-privileges/) implements resources required to run GCS to BigQuery Dataflow pipelines. The solution rely on a set of Services account created with the least privileges principle.

<br clear="left">

### SQL Server Always On Availability Groups

<a href="./sqlserver-alwayson/" title="SQL Server Always On Availability Groups"><img src="https://cloud.google.com/compute/images/sqlserver-ag-architecture.svg" align="left" width="280px"></a>
This [blueprint](./data-platform-foundations/) implements SQL Server Always On Availability Groups using Fabric modules. It builds a two node cluster with a fileshare witness instance in an existing VPC and adds the necessary firewalling. The actual setup process (apart from Active Directory operations) has been scripted, so that least amount of manual works needs to performed.

<br clear="left">
