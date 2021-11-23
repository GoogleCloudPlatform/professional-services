# Professional Services
Common solutions and tools developed by Google Cloud's Professional Services team.

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FGoogleCloudPlatform%2Fprofessional-services.git)

## Examples
The examples folder contains example solutions across a variety of Google Cloud Platform products. Use these solutions as a reference for your own or extend them to fit your particular use case.

* [Anthos Service Mesh Multi-Cluster](examples/anthos-service-mesh-multicluster) - Solution to federate two private GKE clusters using Anthos Service Mesh.
* [Anthos CICD with Gitlab](examples/anthos-cicd-with-gitlab) - A step-by-step guide to create an example CI/CD solution using Anthos and Gitlab.
* [Audio Content Profiling](examples/ml-audio-content-profiling) - A tool that builds a pipeline to scale the process of moderating audio files for inappropriate content using machine learning APIs.
* [Cloud Audit Log Samples](examples/audit-log-examples/) - A sample collection of Audit Logs for Users and Customers to better the structure, contents, and values contained in various log events.
* [BigQuery Audit Log Dashboard](examples/bigquery-audit-log) - Solution to help audit BigQuery usage using Data Studio for visualization and a sample SQL script to query the back-end data source consisting of audit logs.
* [BigQuery Audit Log Anomaly Detection](examples/bigquery-auditlog-anomaly-detection) - Sample of using BigQuery audit logs for automated anomaly detection and outlier analysis. Generates user friendly graphs for quick bq environment analysis.
* [BigQuery Automated Email Exports](examples/bq-email-exports) - Serverless solution to automate the sending of BigQuery export results via email on a scheduled interval. The email will contain a link to a signed or unsigned URL, allowing the recipient to view query results as a JSON, CSV, or Avro file.
* [BigQuery Billing Dashboard](examples/bigquery-billing-dashboard) - Solution to help displaying billing info using Data Studio for visualization and a sample SQL script to query the back-end billing export table in BigQuery.
* [BigQuery Cross Project Slot Monitoring](examples/bigquery-cross-project-slot-monitoring) - Solution to help monitoring slot utilization across multiple projects, while breaking down allocation per project.
* [BigQuery Group Sync For Row Level Access](examples/bigquery-row-access-groups) - Sample code to synchronize group membership from G Suite/Cloud Identity into BigQuery and join that with your data to control access at row level.
* [BigQuery Table Access Pattern Analysis](examples/bigquery-table-access-pattern-analysis) - Sample code to analyse data pipeline optimisation points, by pinpointing suboptimal pipeline scheduling between tables in a data warehouse ELT job.
* [BigQuery Pipeline Utility](tools/bqpipeline)  - Python utility class for defining data pipelines in BigQuery.
* [BigQuery to XML Export](tools/bigquery-to-xml) - Python tool that takes a BigQuery query and returns the output as an XML string.
* [Bigtable Dataflow Cryptocurrencies Exchange RealTime Example](examples/cryptorealtime) - Apache Beam example that reads from the Crypto Exchanges WebSocket API as Google Cloud Dataflow pipeline and saves the feed in Google Cloud Bigtable. Real time visualization and query examples from GCP Bigtable running on Flask server are included.
* [Bigtable Dataflow Update Table Key Pipeline](examples/bigtable-change-key) - Dataflow pipeline with an example of how to update the key of an existing table. It works with any table, regardless the schema. It shows how to update your key for a table with existing data, to try out different alternatives to improve performance.
* [BigQuery Automated Schema Management](tools/bqman) - Command-line utility for automated provisioning and management of BigQuery datasets and tables.
* [Cloud Composer Examples](examples/cloud-composer-examples) - Examples of using Cloud Composer, GCP's managed Apache Airflow service.
* [Cloud Composer CI/CD](examples/cloud-composer-cicd) - Examples of using Cloud Build to deploy airflow DAGs to Cloud Composer.
* [Cloud Data Fusion Functions and Plugins](examples/cloud-datafusion-functions-plugins) - Examples of Cloud Data Fusion Functions and Plugins.
* [Cloud Function VM Delete Event Handler Example](examples/gcf-pubsub-vm-delete-event-handler) - Solution to automatically delete A records in Cloud DNS when a VM is deleted.  This solution implements a [Google Cloud Function][gcf] [Background Function][gcf-bg] triggered on `compute.instances.delete` events published through [Stackdriver Logs Export][logs-export].
* [Cloud SQL Custom Metric](examples/cloud-sql-custom-metric) - An example of creating a Stackdriver custom metric monitoring Cloud SQL Private Services IP consumption.
* [CloudML Bank Marketing](examples/cloudml-bank-marketing) - Notebook for creating a classification model for marketing using CloudML.
* [CloudML Bee Health Detection](examples/cloudml-bee-health-detection) - Detect if a bee is unhealthy based on an image of it and its subspecies.
* [CloudML Churn Prediction](examples/cloudml-churn-prediction) - Predict users' propensity to churn using Survival Analysis.
* [CloudML Customer Support and Complaint Handling](examples/cloudml-support-routing) - BigQuery + AutoML pipeline classifying customer complaints based on expected resolution; adaptable to other support communications use cases.
* [CloudML Deep Collaborative Filtering](examples/cloudml-collaborative-filtering) - Recommend songs given either a user or song.
* [CloudML Energy Price Forecasting](examples/cloudml-energy-price-forecasting) - Predicting the future energy price based on historical price and weather.
* [CloudML Fraud Detection](examples/cloudml-fraud-detection) - Fraud detection model for credit-cards transactions.
* [CloudML Sentiment Analysis](examples/cloudml-sentiment-analysis) - Sentiment analysis for movie reviews using TensorFlow `RNNEstimator`.
* [CloudML Scikit-learn Pipeline](examples/cloudml-sklearn-pipeline) - This is a example for building a scikit-learn-based machine learning pipeline trainer that can be run on AI Platform. The pipeline can be trained locally or remotely on AI platform. The trained model can be further deployed on AI platform to serve online traffic.
* [CloudML TensorFlow Profiling](examples/tensorflow-profiling-examples) - TensorFlow profiling examples for training models with CloudML
* [Cost Optimization DataStudio Dashboard](examples/cost-optimization-dashboard) - SQL scripts to help build Cost Optimization DataStudio Dashboard.
* [Data Generator](examples/dataflow-data-generator) - Generate random data with a custom schema at scale for integration tests or demos.
* [Dataflow BigQuery Transpose Example](examples/dataflow-bigquery-transpose) - An example pipeline to transpose/pivot/rotate a BigQuery table.
* [Dataflow Elasticsearch Indexer](examples/dataflow-elasticsearch-indexer) - An example pipeline that demonstrates the process of reading JSON documents from Cloud Pub/Sub, enhancing the document using metadata stored in Cloud Bigtable and indexing those documents into [Elasticsearch](https://www.elastic.co/).
* [Dataflow Python Examples](examples/dataflow-python-examples) - Various ETL examples using the Dataflow Python SDK.
* [Dataflow Scala Example: Kafka2Avro](examples/dataflow-scala-kafka2avro) - Example to read objects from Kafka, and persist them encoded in Avro in Google Cloud Storage, using Dataflow with SCIO.
* [Dataflow Streaming Benchmark](examples/dataflow-streaming-benchmark) - Utility to publish randomized fake JSON messages to a Cloud Pub/Sub topic at a configured QPS.
* [Dataflow DLP Hashpipeline](examples/dataflow-dlp-hash-pipeline) - Match DLP Social Security Number findings against a hashed dictionary in Firestore. Use Secret Manager for the hash key.
* [Dataflow Template Pipelines](https://github.com/GoogleCloudPlatform/DataflowTemplates) - Pre-implemented Dataflow template pipelines for solving common data tasks on Google Cloud Platform.
* [Dataflow Production Ready](examples/dataflow-production-ready) - Reference implementation for best practices around Beam, pipeline structuring, testing and continuous deployment.
* [Dataflow XML to BigQuery](examples/dataflow-xmlio-to-bq) - Example of loading XML data into BigQuery with DataFlow via XMLIO.
* [Dataproc GCS Connector](examples/dataproc-gcs-connector) - Install and test unreleased features on the GCS Connector for Dataproc.
* [Dataproc Persistent History Server for Ephemeral Clusters](examples/dataproc-persistent-history-server) - Example of writing logs from an ephemeral cluster to GCS and using a separate single node cluster to look at Spark and YARN History UIs.
* [dbt-on-cloud-composer](examples/dbt-on-cloud-composer) - Example of using dbt to manage BigQuery data pipelines, utilizing Cloud Composer to run and schedule the dbt runs.
* [Dialogflow Webhook Example](examples/dialogflow-webhook-example) - Webhook example for dialogflow in Python.
* [Dialogflow Entities Creation and Update](examples/dialogflow-entities-example) - Creation and update of entities for Dialogflow in Python.
* [DLP API Examples](examples/dlp) - Examples of the DLP API usage.
* [GCE Access to Google AdminSDK](examples/gce-to-adminsdk) - Example to help manage access to Google's AdminSDK using GCE's service account identity
* [Home Appliance Status Monitoring from Smart Power Readings](examples/e2e-home-appliance-status-monitoring) - An end-to-end demo system featuring a suite of Google Cloud Platform products such as IoT Core, ML Engine, BigQuery, etc.
* [IAP User Profile](examples/iap-user-profile) - An example to retrieve user profile from an IAP-enabled GAE application.
* [IoT Nirvana](examples/iot-nirvana) - An end-to-end Internet of Things architecture running on Google Cloud Platform.
* [Kubeflow Pipelines Sentiment Analysis](examples/kubeflow-pipelines-sentiment-analysis) - Create a Kubeflow Pipelines component and pipelines to analyze sentiment for New York Times front page headlines using Cloud Dataflow (Apache Beam Java) and Cloud Natural Language API.
* [Kubeflow Fairing Example](examples/kubeflow-fairing-example) - Provided three notebooks to demonstrate the usage of Kubeflow Faring to train machine learning jobs (Scikit-Learn, XGBoost, Tensorflow) locally or in the Cloud (AI platform training or Kubeflow cluster).
* [Python CI/CD with Cloud Builder and CSR](examples/python-cicd-with-cloudbuilder) - Example that uses Cloud Builder and Cloud Source Repositories to automate testing and linting.
* [Pub/Sub Client Batching Example](examples/pubsub-publish-avro-example) - Batching in Pub/Sub's Java client API.
* [QAOA](examples/qaoa) - Examples of parsing a max-SAT problem in a proprietary format.
* [Redis Cluster on GKE Example](examples/redis-cluster-gke) - Deploying Redis cluster on GKE.
* [Spanner Interleave Subquery](examples/spanner-interleave-subquery) - Example code to benchmark Cloud Spanner's subqueries for interleaved tables.
* [Spinnaker](examples/spinnaker) - Example pipelines for a Canary / Production deployment process.
* [TensorFlow Serving on GKE and Load Testing](examples/tf-load-testing) - Examples how to implement Tensorflow model inference on GKE and to perform a load testing of such solution.
* [TensorFlow Unit Testing](examples/tensorflow-unit-testing) - Examples how to write unit tests for TensorFlow ML models.
* [Terraform Internal HTTP Load Balancer](examples/terraform-ilb) - Terraform example showing how to deploy an internal HTTP load balancer.
* [Uploading files directly to Google Cloud Storage by using Signed URL](examples/direct-upload-to-gcs) - Example architecture to enable uploading files directly to GCS by using [Signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls).
* [Vertex AI MLOps Pipeline](examples/vertex_pipeline) - Demonstrates end-to-end MLOps process using Vertex AI platform and Smart Analytics technology capabilities.

## Tools
The tools folder contains ready-made utilities which can simplify Google Cloud Platform usage.

* [Agile Machine Learning API](tools/agile-machine-learning-api) - A web application which provides the ability to train and deploy ML models on Google Cloud Machine Learning Engine, and visualize the predicted results using LIME through simple post request.
* [Airpiler](tools/airpiler) - A python script to convert Autosys JIL files to dag-factory format to be executed in Cloud Composer (managed airflow environment).
* [Anthos Bare Metal Installer](tools/anthosbm-ansible-module) - An [ansible](https://www.ansible.com/resources/get-started) playbook that can be used to install [Anthos Bare Metal](https://cloud.google.com/anthos/clusters/docs/bare-metal).
* [Apache Beam Client Throttling](tools/apachebeam-throttling) - A library that can be used to limit the number of requests from an Apache Beam pipeline to an external service. It buffers requests to not overload the external service and activates client-side throttling when the service starts rejecting requests due to out of quota errors.
* [API Key Rotation Checker](tools/api-key-rotation) - A tool that checks your GCP organization for API keys and compares them to a customizable rotation period. Regularly rotating API keys is a Google and industry standard recommended best practice.
* [AssetInventory](tools/asset-inventory) - Import Cloud Asset Inventory resourcs into BigQuery.
* [Ansible Module for Anthos on Bare Metal](tools/anthosbm-ansible-module) - Ansible module for installation of Anthos on Bare Metal
* [BigQuery Discount Per-Project Attribution](tools/kunskap) - A tool that automates the generation of a BigQuery table that uses existing exported billing data, by attributing both CUD and SUD charges on a per-project basis.
* [BigQuery Query Plan Exporter](tools/bigquery-query-plan-exporter) - Command line utility for exporting BigQuery query plans in a given date range.
* [BigQuery Query Plan Visualizer](tools/bq-visualizer) - A web application which provides the ability to visualise the execution stages of BigQuery query plans to aid in the optimization of queries.
* [BigQuery z/OS Mainframe Connector](tools/bigquery-zos-mainframe-connector) - A utility used to load COBOL MVS data sets into BigQuery and execute query and load jobs from the IBM z/OS Mainframe.
* [BigQuery Policy Tag Utility](tools/bqtag) - Utility class for tagging BQ Table Schemas with Data Catalog Taxonomy Policy Tags. Create BQ Authorized Views using Policy Tags. Helper utility to provision BigQuery Dataset, Data Catalog Taxonomy and Policy Tags.
* [Boolean Organization Policy Enforcer](tools/boolean-org-policy-enforcer) - A tool to find the projects that do not set a boolean organization policy to its expected state, subsequently, set the organization policy to its expected set.
* [CloudConnect](tools/cloudconnect) - A package that automates the setup of dual VPN tunnels between AWS and GCP.
* [Cloudera Parcel GCS Connector](tools/cloudera-parcel-gcsconnector) - This script helps you create a Cloudera parcel that includes Google Cloud Storage connector. The parcel can be deployed on a Cloudera managed cluster. This script helps you create a Cloudera parcel that includes Google Cloud Storage connector. The parcel can be deployed on a Cloudera managed cluster.
* [Cloud AI Vision Utilities](tools/cloud-vision-utils) - This is an installable
  Python package that provides support tools for Cloud AI Vision. Currently
  there are a few scripts for generating an AutoML Vision dataset CSV file from
  either raw images or image annotation files in PASCAL VOC format.
* [CUD Prioritized Attribution](tools/cuds-prioritized-attribution) - A tool that allows GCP customers who purchased Committed Use Discounts (CUDs) to prioritize a specific scope (e.g. project or folder) to attribute CUDs first before letting any unconsumed discount float to other parts of an organization.
* [Custom Role Manager](tools/custom-role-manager) - Manages organization- or project-level custom roles by combining predefined roles and including and removing permissions with wildcards. Can run as Cloud Function or output Terraform resources.
* [DNS Sync](tools/dns-sync) - Sync a Cloud DNS zone with GCE resources. Instances and load balancers are added to the cloud DNS zone as they start from compute_engine_activity log events sent from a pub/sub push subscription. Can sync multiple projects to a single Cloud DNS zone.
* [Firewall Enforcer](tools/firewall-enforcer) - Automatically watch & remove illegal firewall rules across organization. Firewall rules are monitored by a Cloud Asset Inventory Feed, which trigger a Cloud Function that inspects the firewall rule and deletes it if it fails a test.
* [GCE Disk Encryption Converter](tools/gce-google-keys-to-cmek) - A tool that converts disks attached to a GCE VM instance from Google-managed keys to a customer-managed key stored in Cloud KMS.
* [GCE Quota Sync](tools/gce-quota-sync) - A tool that fetches resource quota usage from the GCE API and synchronizes it to Stackdriver as a custom metric, where it can be used to define automated alerts.
* [GCE Usage Log](tools/gce-usage-log) - Collect GCE instance events into a BigQuery dataset, surfacing your vCPUs, RAM, and Persistent Disk, sliced by project, zone, and labels.
* [GCP Architecture Visualizer](https://github.com/forseti-security/forseti-visualizer) - A tool that takes CSV output from a Forseti Inventory scan and draws out a dynamic hierarchical tree diagram of org -> folders -> projects -> gcp_resources using the D3.js javascript library.
* [GCP Organization Hierarchy Viewer](tools/gcp-org-hierarchy-viewer) - A CLI utility for visualizing your organization hierarchy in the terminal.
* [GCPViz](tools/gcpviz) - a visualization tool that takes input from [Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/overview),
creates relationships between assets and outputs a format compatible with [graphviz](http://graphviz.gitlab.io/).
* [GCS Bucket Mover](tools/gcs-bucket-mover) - A tool to move user's bucket, including objects, metadata, and ACL, from one project to another.
* [GCS Usage Recommender](tools/gcs-usage-recommender) - A tool that generates bucket-level intelligence and access patterns across all projects for a GCP project to generate recommended object lifecycle management.
* [GCS to BigQuery](tools/gcs2bq) - A tool fetches object metadata from all Google Cloud Storage buckets and exports it in a format that can be imported into BigQuery for further analysis.
* [GKE Billing Export](tools/gke-billing-export) - Google Kubernetes Engine fine grained billing export.
* [Google Cloud Support Slackbot](tools/google-cloud-support-slackbot) - Slack application that pulls Google Cloud support case information via the Cloud Support API and pushes the information to Slack 
* [GSuite Exporter Cloud Function](tools/gsuite-exporter-cloud-function/) - A script that deploys a Cloud Function and Cloud Scheduler job that executes the GSuite Exporter tool automatically on a cadence.
* [GSuite Exporter](tools/gsuite-exporter/) - A Python package that automates syncing Admin SDK APIs activity reports to a GCP destination. The module takes entries from the chosen Admin SDK API, converts them into the appropriate format for the destination, and exports them to a destination (e.g: Stackdriver Logging).
* [Hive to BigQuery](tools/hive-bigquery/) - A Python framework to migrate Hive table to BigQuery using Cloud SQL to keep track of the migration progress.
* [IAM Recommender at Scale](tools/iam-recommender-at-scale) - A python package that automates applying iam recommendations.
* [LabelMaker](tools/labelmaker) - A tool that reads key:value pairs from a json file and labels the running instance and all attached drives accordingly.
* [Machine Learning Auto Exploratory Data Analysis and Feature Recommendation](tools/ml-auto-eda) - A tool to perform comprehensive auto EDA, based on which feature recommendations are made, and a summary report will be generated.
* [Maven Archetype Dataflow](tools/maven-archetype-dataflow) - A maven archetype which bootstraps a Dataflow project with common plugins pre-configured to help maintain high code quality.
* [Netblock Monitor](tools/netblock-monitor) - An Apps Script project that will automatically provide email notifications when changes are made to Google’s IP ranges.
* [Permission Discrepancy Finder](tools/permission-discrepancy-finder) - A tool to find the principals with missing permissions on a resource within a project, subsequently, grants them the missing permissions.
* [Pubsub2Inbox](tools/pubsub2inbox) - A generic Cloud Function-based tool that takes input from Pub/Sub messages and turns them into email, webhooks or GCS objects.
* [Quota Manager](tools/quota-manager) - A python module to programmatically update GCP service quotas such as bigquery.googleapis.com.
* [Secret Manager Helper](tools/secret-manager-helper) - A Java library to make it easy to replace placeholder strings with Secret Manager secret payloads.
* [Site Verification Group Sync](tools/site-verification-group-sync) - A tool to provision "verified owner" permissions (to create GCS buckets with custom dns) based on membership of a Google Group.
* [SLO Generator](tools/slo-generator/) - A Python package that automates computation of Service Level Objectives, Error Budgets and Burn Rates on GCP,  and export the computation results to available exporters (e.g: PubSub, BigQuery, Stackdriver Monitoring), using policies written in JSON format.
* [Snowflake_to_BQ](tools/snowflake2bq/) - A shell script to transfer tables (schema & data) from Snowflake to BigQuery.
* [STS Job Manager](tools/sts-job-manager/) - A petabyte-scale bucket migration tool utilizing [Storage Transfer Service](https://cloud.google.com/storage-transfer-service)
* [VPC Flow Logs Analysis](tools/vpc-flowlogs-analysis) - A configurable Log sink + BigQuery report that shows traffic attributed to the projects in the Shared VPCs.
* [VPC Flow Logs Enforcer](tools/vpc-flowlogs-enforcer) - A Cloud Function that will automatically enable VPC Flow Logs when a subnet is created or modified in any project under a particular folder or folders.
* [VPC Flow Logs Top Talkers](tools/vpc-flowlogs-toptalkers) - A configurable Log sink + BigQuery view to generate monthly/daily aggregate traffic reports per subnet or host, with the configurable labelling of IP ranges and ports.
* [VM Migrator](tools/vm-migrator) - This utility automates migrating Virtual Machine instances within GCP. You can migrate VM's from one zone to another zone/region within the same project or different projects while retaining all the original VM properties like disks, network interfaces, ip, metadata, network tags and much more.
* [Webhook Ingestion Data Pipeline](tools/webhook-ingestion-pipeline) - A deployable app to accept and ingest unauthenticated webhook data to BigQuery.
* [gmon](tools/gmon/) - A command-line interface (CLI) for Cloud Monitoring written in Python.
* [Quota Monitoring and Alerting](tools/quota-monitoring-alerting) - An easy-to-deploy Data Studio Dashboard with alerting capabilities, showing usage and quota limits in an organization or folder.

## Contributing
See the contributing [instructions](/CONTRIBUTING.md) to get started contributing.

## License
All solutions within this repository are provided under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) license. Please see the [LICENSE](/LICENSE) file for more detailed terms and conditions.

## Disclaimer
This repository and its contents are not an official Google Product.

## Contact
Questions, issues, and comments should be directed to
[professional-services-oss@google.com](mailto:professional-services-oss@google.com).

[gcf]: https://cloud.google.com/functions/
[gcf-bg]: https://cloud.google.com/functions/docs/writing/background
[logs-export]: https://cloud.google.com/logging/docs/export/
