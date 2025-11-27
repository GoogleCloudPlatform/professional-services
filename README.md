# Professional Services

Common solutions and tools developed by Google Cloud's Professional Services
team.

## Disclaimer

This repository and its contents are not an officially supported Google product.

## License

All solutions within this repository are provided under the
[Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0) license. Please see
the [LICENSE](/LICENSE) file for more detailed terms and conditions.

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2FGoogleCloudPlatform%2Fprofessional-services.git)

## Examples

The examples folder contains example solutions across a variety of Google Cloud
Platform products. Use these solutions as a reference for your own or extend
them to fit your particular use case.

*   [Anthos Service Mesh Multi-Cluster](examples/anthos-service-mesh-multicluster) -
    Solution to federate two private GKE clusters using Anthos Service Mesh.
*   [Anthos CICD with Gitlab](examples/anthos-cicd-with-gitlab) - A step-by-step
    guide to create an example CI/CD solution using Anthos and Gitlab.
*   [Audio Content Profiling](examples/ml-audio-content-profiling) - A tool that
    builds a pipeline to scale the process of moderating audio files for
    inappropriate content using machine learning APIs.
*   [Bigdata generator](tools/bigdata-generator/) -
    Solution that generates large amounts of data for stress-testing bigdata solutions (e.g BigQuery).
    For each of the fields you want to generate, you can specify rules for generating their values. The generated data can stored in BigQuery or GCS (Avro, CSV).
*   [BigQuery Analyze Realtime Reddit Data](examples/bigquery-analyze-realtime-reddit-data/) -
    Solution to deploy a ([reddit](https://www.reddit.com)) social media data collection
    architecture on Google Cloud Platform.  Analyzes reddit comments in realtime and
    provides free natural-language processing / sentiment.
*   [BigQuery Audit Log Dashboard](examples/bigquery-audit-log) - Solution to
    help audit BigQuery usage using Data Studio for visualization and a sample
    SQL script to query the back-end data source consisting of audit logs.
*   [BigQuery Audit Log Anomaly Detection](examples/bigquery-auditlog-anomaly-detection) -
    Sample of using BigQuery audit logs for automated anomaly detection and
    outlier analysis. Generates user friendly graphs for quick bq environment
    analysis.
*   [BigQuery Automated Email Exports](examples/bq-email-exports) - Serverless
    solution to automate the sending of BigQuery export results via email on a
    scheduled interval. The email will contain a link to a signed or unsigned
    URL, allowing the recipient to view query results as a JSON, CSV, or Avro
    file.
*   [BigQuery Automated Schema Management](tools/bqman) - Command-line utility
    for automated provisioning and management of BigQuery datasets and tables.
*   [BigQuery Billing Dashboard](examples/bigquery-billing-dashboard) - Solution
    to help displaying billing info using Data Studio for visualization and a
    sample SQL script to query the back-end billing export table in BigQuery.
*   [BigQuery Cross Project Slot Monitoring](examples/bigquery-cross-project-slot-monitoring) -
    Solution to help monitoring slot utilization across multiple projects, while
    breaking down allocation per project.
*   [BigQuery Data Consolidator](tools/bigquery-data-consolidator) - Solution to
    consolidate data within an organization from multiple projects into one target
    Dataset/Table where all Source tables are of same schema (like Billing Exports!); specifically
    useful for data consolidation and further reporting in Cloud FinOps engagements.
*   [BigQuery DDL Validator](examples/bigquery-ddl-validator) -
    A utility that will read the Legacy DDL and compare it against the previously extracted DDL and
    produce an output with the name of the objects where the DDL is no longer matching.
*   [BigQuery Group Sync For Row Level Access](examples/bigquery-row-access-groups) -
    Sample code to synchronize group membership from G Suite/Cloud Identity into
    BigQuery and join that with your data to control access at row level.
*   [BigQuery Long Running Optimization Utility](examples/bigquery-long-running-optimizer) -
    A utility that reads the entire SQL and provides a list of suggestions that would help to optimize the query and avoid the long running issues.
*   [BigQuery Oracle DDL Migration Utility](examples/bigquery-oracle-ddl-migration-utility) -
    Oracle DDL Migration Utility to migrate the tables schema (DDL) from Oracle DB to BigQuery.
    The utility leverages BigQuery Translation API and offers additional features
    such as adding partitioning, clustering, metadata columns and prefixes to table names.
*   [BigQuery Pipeline Utility](tools/bqpipeline) - Python utility class for
    defining data pipelines in BigQuery.
*   [BigQuery Remote Function](examples/bq-remote-function) - It allows user to implement custom
    services or libraries in languages other than SQL or Javascript which are not part of UDFs.
    The utility contains sample string format Java code to deploy cloud run gen2 instance and invoke
    the service from BigQuery using remote function.
*   [BigQuery Amazon S3 Migration Tool](tools/bigquery-s3tobq) - Bigquery Migration Tool to transfer data
    from files in Amazon S3 to BigQuery Tables based on configuration provided.
*   [BigQuery Snowflake TabRle Migration Tool](examples/bigquery-snowflake-tables-migration-utility) -
    BigQuery Snowflake Table Migration Tool helps to migrate the table DDL's from Snowflake to BigQuery.
    The utility leverages BigQuery Translation API and offers additional features
    such as adding partitioning, clustering, metadata columns and prefixes to table names.
*   [BigQuery Table Access Pattern Analysis](examples/bigquery-table-access-pattern-analysis) -
    Sample code to analyse data pipeline optimisation points, by pinpointing
    suboptimal pipeline scheduling between tables in a data warehouse ELT job.
*   [BigQuery Tink Toolkit](tools/bigquery-tink-toolkit) - Python utility class
    for working with Tink-based cryptography in on-prem or GCP systems in a way
    that is interoperable with BigQuery's field-level encryption. Includes a
    sample PySpark job and a script for generating and uploading KMS-encrypted
    Tink keysets to BigQuery.
*   [BigQuery to XML Export](tools/bigquery-to-xml) - Python tool that takes a
    BigQuery query and returns the output as an XML string.
*   [BigQuery Translation Validator](examples/bigquery-translation-validator-utility) - A python utility to compare 2 SQL Files and  point basic differences like column names,
    table names, joins, function names, is-Null and query syntax.
*   [BigQuery Generic DDL Migration Utility](examples/bigquery-generic-ddl-migration-utility) -
    Generic DDL Migration Utility to migrate the tables schema (DDL) from Database(Oracle, Snowflake, MSSQL, Vertica, Neteeza) DB to BigQuery.
    The utility leverages BigQuery Translation API and offers additional features
    such as adding partitioning, clustering, metadata columns and prefixes to table names.
*   [Bigtable Dataflow Cryptocurrencies Exchange RealTime Example](examples/cryptorealtime) -
    Apache Beam example that reads from the Crypto Exchanges WebSocket API as
    Google Cloud Dataflow pipeline and saves the feed in Google Cloud Bigtable.
    Real time visualization and query examples from GCP Bigtable running on
    Flask server are included.
*   [Bigtable Dataflow Update Table Key Pipeline](examples/bigtable-change-key) -
    Dataflow pipeline with an example of how to update the key of an existing
    table. It works with any table, regardless the schema. It shows how to
    update your key for a table with existing data, to try out different
    alternatives to improve performance.
*   [Carbon Footprint Reporting](examples/carbon-foortprint-dashboard) - Example of
    using the prebuilt Data studio & Looker template for analysing GCP Carbon Footprint Estimates.
*   [Cloud Audit Log Samples](examples/audit-log-examples/) - A sample
    collection of Audit Logs for Users and Customers to better the structure,
    contents, and values contained in various log events.
*   [Cloud Build Application CICD Examples](examples/cloudbuild-application-cicd) -
    Cloud Build CI/CD Examples for Applications like containerization &
    deployment to Cloud Run.
*   [Cloud Build with Proxy Running in Background](examples/cloudbuild-with-tcp-proxy) -
    Examples of cloudbuild with docker-compose running tcp proxy in the
    background for all build steps.
*   [Cloud Composer CI/CD](examples/cloud-composer-cicd) - Examples of using
    Cloud Build to deploy airflow DAGs to Cloud Composer.
*   [Cloud Composer Deployment in Shared VPC](examples/composer-shared-vpc) -
    Terraform code to deploy cloud composer in shared VPC environment.
*   [Cloud Composer Dependency Management](examples/cloud-composer-dependency-management-example) - Example of
    Cloud Composer Dependency Management designed to orchestrate complex task dependencies within Apache Airflow which addresses the challenge of managing parent-child DAG relationships across varying temporal frequencies (yearly, monthly, weekly etc)
*   [Cloud Composer Examples](examples/cloud-composer-examples) - Examples of
    using Cloud Composer, GCP's managed Apache Airflow service.
*   [Cloud Data Fusion Functions and Plugins](examples/cloud-datafusion-functions-plugins) -
    Examples of Cloud Data Fusion Functions and Plugins.
*   [Cloud DNS load balancing](examples/cloud-dns-load-balancing) - Multi-region HA setup for GCE VMs and Cloud Run based applications utilizing Cloud DNS load balancing and multiple Google Cloud load balancer types.
*   [Cloud DNS public zone monitoring](examples/cloud-dns-public-zone-dashboard) - Visualizing Cloud DNS public zone query data using log-based metrics and Cloud Monitoring.
*   [Cloud Function Act As](examples/cloud-function-act-as) - Example of
    executing a Cloud Function on behalf and with IAM permissions of the GitHub
    Workload Identity caller.
*   [Cloud Function VM Delete Event Handler Example](examples/gcf-pubsub-vm-delete-event-handler) -
    Solution to automatically delete A records in Cloud DNS when a VM is
    deleted. This solution implements a [Google Cloud Function][gcf]
    [Background Function][gcf-bg] triggered on `compute.instances.delete` events
    published through [Stackdriver Logs Export][logs-export].
*   [Certificate Authority Service Hierarchy](examples/certificate-authority-service-hierarchy) - Root and Subordinate Certificate Authority Service CA Pools and CAs with examples for domain ownership validation and sample load test script.
*   [Cloud Run to BQ](examples/cloudrun-to-bq) - Solution to accept events/data
    on HTTP REST Endpoint and insert into BQ.
*   [Cloud Run CRL Monitor](examples/cloudrun-crl-monitor) - Cloud Run based solution for continuous monitoring of CRL distribution endpoints including CRL validity verification and alerting.
*   [Cloud SQL Custom Metric](examples/cloud-sql-custom-metric) - An example of
    creating a Stackdriver custom metric monitoring Cloud SQL Private Services
    IP consumption.
*   [Cloud Support API](examples/cloud-support) - Sample code using Cloud
    Support API
*   [CloudML Bank Marketing](examples/cloudml-bank-marketing) - Notebook for
    creating a classification model for marketing using CloudML.
*   [CloudML Bee Health Detection](examples/cloudml-bee-health-detection) -
    Detect if a bee is unhealthy based on an image of it and its subspecies.
*   [CloudML Churn Prediction](examples/cloudml-churn-prediction) - Predict
    users' propensity to churn using Survival Analysis.
*   [CloudML Customer Support and Complaint Handling](examples/cloudml-support-routing) -
    BigQuery + AutoML pipeline classifying customer complaints based on expected
    resolution; adaptable to other support communications use cases.
*   [CloudML Deep Collaborative Filtering](examples/cloudml-collaborative-filtering) -
    Recommend songs given either a user or song.
*   [CloudML Energy Price Forecasting](examples/cloudml-energy-price-forecasting) -
    Predicting the future energy price based on historical price and weather.
*   [CloudML Fraud Detection](examples/cloudml-fraud-detection) - Fraud
    detection model for credit-cards transactions.
*   [CloudML Scikit-learn Pipeline](examples/cloudml-sklearn-pipeline) - This is
    a example for building a scikit-learn-based machine learning pipeline
    trainer that can be run on AI Platform. The pipeline can be trained locally
    or remotely on AI platform. The trained model can be further deployed on AI
    platform to serve online traffic.
*   [CloudML Sentiment Analysis](examples/cloudml-sentiment-analysis) -
    Sentiment analysis for movie reviews using TensorFlow `RNNEstimator`.
*   [CloudML TensorFlow Profiling](examples/tensorflow-profiling-examples) -
    TensorFlow profiling examples for training models with CloudML
*   [🚀 Creative Studio](examples/creative-studio) - Creative Studio is a comprehensive, all-in-one Generative AI platform designed as a deployable solution for your own Google Cloud project. It serves as a powerful reference implementation and creative suite, showcasing the full spectrum of Google's state-of-the-art generative AI models on Vertex AI.
Built for creators, marketers, and developers, this application provides a hands-on, interactive experience with cutting-edge multimodal capabilities.
*   [Data Generator](examples/dataflow-data-generator) - Generate random data
    with a custom schema at scale for integration tests or demos.
*   [Dataflow BigQuery Transpose Example](examples/dataflow-bigquery-transpose) -
    An example pipeline to transpose/pivot/rotate a BigQuery table.
*   [Dataflow Custom Templates Example](examples/dataflow-custom-templates) - An
    example that demonstrates how to build custom Dataflow templates.
*   [Dataflow Elasticsearch Indexer](examples/dataflow-elasticsearch-indexer) -
    An example pipeline that demonstrates the process of reading JSON documents
    from Cloud Pub/Sub, enhancing the document using metadata stored in Cloud
    Bigtable and indexing those documents into
    [Elasticsearch](https://www.elastic.co/).
*   [Dataflow BigQuery to AlloyDB](examples/dataflow-bigquery-to-alloydb/) -
    Example that shows how to move data from BigQuery to an AlloyDB table using Dataflow.
*   [Dataflow Flex Template in Restricted Networking Env](examples/dataflow-flex-python/) -
    Example implements a python flex template which can be run in an environment
    where workers can not download python packages due to egress traffic restrictions.
*   [Dataflow Python Examples](examples/dataflow-python-examples) - Various ETL
    examples using the Dataflow Python SDK.
*   [Dataflow Streaming Benchmark](examples/dataflow-streaming-benchmark) -
    Utility to publish randomized fake JSON messages to a Cloud Pub/Sub topic at
    a configured QPS.
*   [Dataflow Streaming Schema Changes Handler](examples/dataflow-streaming-schema-handler) -
    Dataflow example to handle schema changes using schema enforcement and DLT
    approach
*   [Dataflow Streaming XML to GCS](examples/dataflow-xml-pubsub-to-gcs) -
    Dataflow example to handle streaming of xml encoded messages and write them to Google Cloud Storage
*   [Dataflow – DLP Flex De-ID (CSV from GCS to BigQuery)](examples/dataflow-dlp-flex-deid) - Dataflow Flex Template that batches CSV rows from Cloud Storage, de-identifies with Sensitive Data Protection (DLP), and writes to BigQuery.
*   [Dataflow DLP Hashpipeline](examples/dataflow-dlp-hash-pipeline) - Match DLP
    Social Security Number findings against a hashed dictionary in Firestore.
    Use Secret Manager for the hash key.
*   [Dataflow Template Pipelines](https://github.com/GoogleCloudPlatform/DataflowTemplates) -
    Pre-implemented Dataflow template pipelines for solving common data tasks on
    Google Cloud Platform.
*   [Dataflow Production Ready](examples/dataflow-production-ready) - Reference
    implementation for best practices around Beam, pipeline structuring, testing
    and continuous deployment.
*   [Dataflow XML to BigQuery](examples/dataflow-xmlio-to-bq) - Example of
    loading XML data into BigQuery with DataFlow via XMLIO.
*   [Data Loss Prevention hybrid inspection for MongoDB](examples/mongodb-hybrid-dlp) -
    A Cloud Function using MongoDB Change Streams that uses Sensitive Data Protection's
    hybrid Data Loss Prevention inspection API in near real-time.
*   [Dataproc Spanner](examples/dataproc-spanner) - Dataproc cluster write to Spanner using Apache Spark in Scala.
*   [Dataproc GCS Connector](examples/dataproc-gcs-connector) - Install and test
    unreleased features on the GCS Connector for Dataproc.
*   [Dataproc Job Optimization Guide](examples/dataproc-job-optimization-guide) - Step-by-step
    guide for optimizing a sample Dataproc Job.
*   [Dataproc Persistent History Server for Ephemeral Clusters](examples/dataproc-persistent-history-server) -
    Example of writing logs from an ephemeral cluster to GCS and using a
    separate single node cluster to look at Spark and YARN History UIs.
*   [Dataproc Lifecycle Management via Composer](examples/dataproc-lifecycle-via-composer) - Ephemeral Dataproc lifecycle management and resources optimization via Composer, Terraform template to deploy Composer and additional reqs, Dynamically generated DAGs from jobs config files.
*   [Dataproc Running Notebooks](examples/dataproc-running-notebooks) - Orchestrating the workflow of running Jupyter Notebooks on a Dataproc cluser via PySpark job
*   [dbt-on-cloud-composer](examples/dbt-on-cloud-composer) - Example of using
    dbt to manage BigQuery data pipelines, utilizing Cloud Composer to run and
    schedule the dbt runs.
*   [Data Format Description Language (DFDL) Processesor with Firestore and
    Pubsub](examples/dfdl-firestore-pubsub-example) - Example to process a
    binary using DFDL definition and Daffodil libraries. The DFDL definition is
    stored in firestore, the request to process is done through a pubsub
    subcription and the output is published is a JSON format in a Pubsub topic.
*   [Data Format Description Language (DFDL) Processesor with Bigtable and
    Pubsub](examples/dfdl-bigtable-pubsub-example) - Example to process a binary
    using DFDL definition and Daffodil libraries. The DFDL definition is stored
    in bigtable, the request to process is done through a pubsub subcription and
    the output is published is a JSON format in a Pubsub topic.
*   [Dialogflow Webhook Example](examples/dialogflow-webhook-example) - Webhook
    example for dialogflow in Python.
*   [Dialogflow CX Private Webhook Example](examples/dialogflowcx-private-webhook-example) -
    Webhook example for Dialogflow CX in Python.
*   [Dialogflow Middleware Example](examples/ccai-dialogflow-middleware) -
    Dialogflow middleware example in Java.
*   [Dialogflow Entities Creation and Update](examples/dialogflow-entities-example) -
    Creation and update of entities for Dialogflow in Python.
*   [DLP API Examples](examples/dlp) - Examples of the DLP API usage.
*   [Ephemeral Projects](examples/ephemeral-projects) - Creating short lived gcp projects for sandbox purposes.
*   [GCE Access to Google AdminSDK](examples/gce-to-adminsdk) - Example to help
    manage access to Google's AdminSDK using GCE's service account identity
*   [GCS Client Side Encryption via Sidecar](examples/gcs-client-encrypt/) - Example to show how to implement GCS client side encyrption via a sidecar
*   [GCS Hive External Table File Optimization](examples/gcs-hive-external-table-file-optimization) -
    Example solution to showcase impact of file count, file size, and file
    type on Hive external tables and query speeds.
*   [GCS to BQ using serverless services](examples/gcs-to-bq-serverless-services) -
    Example to ingest GCS to BigQuery using serverless services such as Cloud
    Function, Pub/Sub and Serverless Spark.
*   [GDCE Terraform Example](examples/gdce-terraform-example) - Example for provisioning GDCE
    resources using terraform.
*   [GKE Control Plane Authority](examples/gke-control-plane-authority/) -
    Example for running advanced controls with bring your own keys and certificate authorities and related logs for control plane functions
*   [GKE HA setup using spot VMs](examples/gke-ha-setup-using-spot-vms/) -
    Example for running an application with high availability requirements on
    GKE spot nodes using on-demand nodes as fallback
*   [Grpc Server connected to Spanner Database](examples/grpc_spanner_example) -
    Basic example of a Grpc server that is connected to a Spanner database.
*   [Grpc Server connected to Redis](examples/grpc_redis_example) - Basic
    example of a Grpc server that is connected to Redis.
*   [Gitlab KAS agent for GKE](examples/gitlab-kas-gke) - Terraform solution for          deploying a Gitlab KAS agent for synchronizing container deployments from Gitlab repos into a GKE cluster
*   [Home Appliance Status Monitoring from Smart Power Readings](examples/e2e-home-appliance-status-monitoring) -
    An end-to-end demo system featuring a suite of Google Cloud Platform
    products such as IoT Core, ML Engine, BigQuery, etc.
*   [IAM Deny Policies with Terraform](examples/iam-deny/) - Demonstrates the use of IAM Deny and Organization Policies to enforce security guardrails.
*   [IAP User Profile](examples/iap-user-profile) - An example to retrieve user
    profile from an IAP-enabled GAE application.
*   [IoT Nirvana](examples/iot-nirvana) - An end-to-end Internet of Things
    architecture running on Google Cloud Platform.
*   [Kubeflow Pipelines Sentiment Analysis](examples/kubeflow-pipelines-sentiment-analysis) -
    Create a Kubeflow Pipelines component and pipelines to analyze sentiment for
    New York Times front page headlines using Cloud Dataflow (Apache Beam Java)
    and Cloud Natural Language API.
*   [Kubeflow Fairing Example](examples/kubeflow-fairing-example) - Provided
    three notebooks to demonstrate the usage of Kubeflow Faring to train machine
    learning jobs (Scikit-Learn, XGBoost, Tensorflow) locally or in the Cloud
    (AI platform training or Kubeflow cluster).
*   [Left-Shift Validation Pre-Commit Hook](examples/left-shift-validation-pre-commit-hook/) -
    An example that uses a set of Bash scripts to set up a pre-commit hook that
    validates Kubernetes resources with Gatekeeper constraints and constraint
    templates from your choice of sources.
*   [LookerStudio Cost Optimization Dashboard](examples/cost-optimization-dashboard) -
    SQL scripts to help build Cost Optimization LookerStudio Dashboard.
*   [Migrate Kafka to GMK using MM2](examples/mm2-gmk-migration) -  Terraform code to deploy resources to migrate data between two Google Managed Kafka clustes using MirrorMaker2
*   [Personal Workbench Notebooks Deployer](examples/personal-workbench-notebooks-deployer) - Terraform sample modules to provision Dataproc Hub using personal auth clusters, and workbench managed notebooks for individual analytical users.
*   [Project factory with Terragrunt](examples/terragrunt-project-factory-gcp/) -
    This implements a `State-Scalable` project factory pattern for creating Google Cloud Platform projects using Terragrunt and public Terraform modules
*   [Python CI/CD with Cloud Builder and CSR](examples/python-cicd-with-cloudbuilder) -
    Example that uses Cloud Builder and Cloud Source Repositories to automate
    testing and linting.
*   [Pub/Sub Client Batching Example](examples/pubsub-publish-avro-example) -
    Batching in Pub/Sub's Java client API.
*   [QAOA](examples/qaoa) - Examples of parsing a max-SAT problem in a
    proprietary format, for Quantum Approximate Optimization Algorithm (QAOA)
*   [React single-page app on Cloud Run + Cloud Storage](examples/react-spa-app) - End-to-end example of deploying
    a React SPA on serverless Google Cloud services.
*   [Redis Cluster on GKE Example](examples/redis-cluster-gke) - Deploying Redis
    cluster on GKE.
*   [Risk Analysis Asset](examples/risk-analysis-asset) - Deploying Reliability Risk analysis tool on Cloud Run.
*   [Spanner Interleave Subquery](examples/spanner-interleave-subquery) -
    Example code to benchmark Cloud Spanner's subqueries for interleaved tables.
*   [Spanner Change Stream to BigQuery using Dataflow](examples/spanner-changestreams-bigquery) -
    Terraform code to deploy Spanner change stream and publish changes to BigQuery using Dataflow Streaming Job.
*   [Spinnaker](examples/spinnaker) - Example pipelines for a Canary /
    Production deployment process.
*   [STS Metrics from STS Notification](examples/sts-metrics) - Example code to
    generate custom metrics from STS notification.
*   [TensorFlow Serving on GKE and Load Testing](examples/tf-load-testing) -
    Examples how to implement Tensorflow model inference on GKE and to perform a
    load testing of such solution.
*   [TensorFlow Unit Testing](examples/tensorflow-unit-testing) - Examples how
    to write unit tests for TensorFlow ML models.
*   [Terraform Internal HTTP Load Balancer](examples/terraform-ilb) - Terraform
    example showing how to deploy an internal HTTP load balancer.
*   [Terraform NetApp CVS](examples/tf-netapp-cvs) - This example shows how to deploy NetApp CVS volumes using
    terraform.
*   [Terraform Resource Change Policy Library](examples/terraform-resource-change-policy-library) -
    Contains a library of policies written in the
    [OPA Constraint Framework](https://github.com/open-policy-agent/frameworks/blob/master/constraint/README.md)
    format to be used by `gcloud beta terraform vet` to validate Terraform resource
    changes in a CI/CD pipeline.
*   [Uploading files directly to Google Cloud Storage by using Signed URL](examples/direct-upload-to-gcs) -
    Example architecture to enable uploading files directly to GCS by using
    [Signed URL](https://cloud.google.com/storage/docs/access-control/signed-urls).
*   [TSOP object transfer Log prosessor](examples/tsop-log-processor/) - This example shows
    how to log object transfer logs by TSOP to Cloud Logging.
*   [GCS CSV files to BigQuery](https://github.com/GoogleCloudPlatform/DataflowTemplates/blob/main/v1/README_GCS_CSV_to_BigQuery.md) - This example shows how to load files in CSV format stored in GCS to load to BigQuery tables. The files can be uncompressed or be compressed in formats such as Bzip2, GZIP and etc. See https://beam.apache.org/releases/javadoc/current/org/apache/beam/sdk/io/Compression.html for the list of support compression method.
*   [MCP Toolbox & Claude Integration](examples/mcptoolbox-bq-claude-slack-agent) - A Hotel's booking specialized GenAI agent for Slack built using Spring Boot AI, BigQuery, CloudRun, MCP Toolbox and Claude LLM.


## Tools

The tools folder contains ready-made utilities which can simplify Google Cloud
Platform usage.

*   [Agile Machine Learning API](tools/agile-machine-learning-api) - A web
    application which provides the ability to train and deploy ML models on
    Google Cloud Machine Learning Engine, and visualize the predicted results
    using LIME through simple post request.
*   [Airflow DAG Metadata Generator](tools/airflow-dag-metadata-generator) - Use Google's
    generative models to analyze Airflow DAGs and supplement them with generated `description`,
    `tags`, and `doc_md` values.
*   [Airflow States Collector](tools/airflow-states-collector) -
      A tool that creates and uploads an airflow dag to the dags GCS folder. The dag incrementally collect airflow task states and stores to BQ. It also autogenerates a LookerStudio dashboard querying the BQ view.
*   [Airpiler](tools/airpiler) - A python script to convert Autosys JIL files to
    dag-factory format to be executed in Cloud Composer (managed airflow
    environment).
*   [Ansible Module for Anthos on Bare Metal](tools/anthosbm-ansible-module) -
    Ansible module for installation of Anthos on Bare Metal
*   [Anthos Bare Metal Installer](tools/anthosbm-ansible-module) - An
    [ansible](https://www.ansible.com/resources/get-started) playbook that can
    be used to install
    [Anthos Bare Metal](https://cloud.google.com/anthos/clusters/docs/bare-metal).
*   [Apache Beam Client Throttling](tools/apachebeam-throttling) - A library
    that can be used to limit the number of requests from an Apache Beam
    pipeline to an external service. It buffers requests to not overload the
    external service and activates client-side throttling when the service
    starts rejecting requests due to out of quota errors.
*   [API Key Rotation Checker](tools/api-key-rotation) - A tool that checks your
    GCP organization for API keys and compares them to a customizable rotation
    period. Regularly rotating API keys is a Google and industry standard
    recommended best practice.
*   [AssetInventory](tools/asset-inventory) - Import Cloud Asset Inventory
    resourcs into BigQuery.
*   [BigQuery Discount Per-Project Attribution](tools/kunskap) - A tool that
    automates the generation of a BigQuery table that uses existing exported
    billing data, by attributing both CUD and SUD charges on a per-project
    basis.
*   [BigQuery Policy Tag Utility](tools/bqtag) - Utility class for tagging BQ
    Table Schemas with Data Catalog Taxonomy Policy Tags. Create BQ Authorized
    Views using Policy Tags. Helper utility to provision BigQuery Dataset, Data
    Catalog Taxonomy and Policy Tags.
*   [BigQuery Query Plan Exporter](tools/bigquery-query-plan-exporter) - Command
    line utility for exporting BigQuery query plans in a given date range.
*   [BigQuery Query Plan Visualizer](tools/bq-visualizer) - A web application
    which provides the ability to visualise the execution stages of BigQuery
    query plans to aid in the optimization of queries.
*   [BigQuery z/OS Mainframe Connector](tools/bigquery-zos-mainframe-connector) -
    A utility used to load COBOL MVS data sets into BigQuery and execute query
    and load jobs from the IBM z/OS Mainframe.
*   [Boolean Organization Policy Enforcer](tools/boolean-org-policy-enforcer) -
    A tool to find the projects that do not set a boolean organization policy to
    its expected state, subsequently, set the organization policy to its
    expected set.
*   [Capacity Planner CLI](tools/capacity-planner-cli) - A stand-alone tool to
    extract peak resource usage values and corresponding timestamps for a given
    GCP project, time range and timezone.
*   [Capacity Planner Sheets Extension](tools/capacity-planner-sheets-extension) -
    A Google Sheets extension to extract peak resource usage values and corresponding
    timestamps for a given GCP project, time range and timezone.
*   [CloudConnect](tools/cloudconnect) - A package that automates the setup of
    dual VPN tunnels between AWS and GCP.
*   [Cloudera Parcel GCS Connector](tools/cloudera-parcel-gcsconnector) - This
    script helps you create a Cloudera parcel that includes Google Cloud Storage
    connector. The parcel can be deployed on a Cloudera managed cluster. This
    script helps you create a Cloudera parcel that includes Google Cloud Storage
    connector. The parcel can be deployed on a Cloudera managed cluster.
*   [Cloud AI Vision Utilities](tools/cloud-vision-utils) - This is an
    installable Python package that provides support tools for Cloud AI Vision.
    Currently there are a few scripts for generating an AutoML Vision dataset
    CSV file from either raw images or image annotation files in PASCAL VOC
    format.
*   [Cloud Composer Backup and Recovery](tools/cloud-composer-backup-restore) - A
    command line tool for applying backup and recovery operations on Cloud
    Composer Airflow environments.
*   [Cloud Composer DAG Validation](tools/cloud-composer-dag-validation) - An automated process for running validation and testing against DAGs in Composer.
*   [Cloud Composer Migration Complexity Assessment](tools/cloud-composer-migration-complexity-assessment) - An Airflow DAG that uses a variety
    of tools to analyze a Cloud Composer 1 environment, determine a work estimate, and
    accelerate the conversion of airflow 1 dags to airflow 2 dags.
*   [Cloud Composer Migration Terraform Generator](tools/cloud-composer-migration-terraform-generator) - Analyzes an existing Cloud Composer 1
    / Airflow 1 environment and generates terraform. Configures new Cloud Composer 2
    environment to meet your workload demands.
*   [ComfyUI Custom Nodes for VertexAI](tools/comfyui_custom_nodes) - A collection of custom nodes for ComfyUI that allows you to use VertexAI models in ComfyUI workflows.
*   [CUD Prioritized Attribution](tools/cuds-prioritized-attribution) - A tool
    that allows GCP customers who purchased Committed Use Discounts (CUDs) to
    prioritize a specific scope (e.g. project or folder) to attribute CUDs first
    before letting any unconsumed discount float to other parts of an
    organization.
*   [Custom Module for Security Health Analytics Library](tools/custom-module-security-health-analytics-library) -
    A library of custom modules for SCC Security Health Analytics. It includes
    tools to easily generate custom modules and provisioning them on your organization.
    This library helps organization to detect configuration and compliance drifts.
*   [Custom Organization Policy Library](tools/custom-organization-policy-library) - A library
    of custom organization policy constraints and samples. It includes tools to easily generate policies for provisioning across your organization using either Google Cloud (gcloud) or Terraform.
*   [Custom Role Analyzer](tools/custom-roles-analyzer) - This tool will provide
    useful insights with respect to custom roles at organization level as well
    as project level to find predefined roles from which the custom role is
    built.
*   [Custom Role Manager](tools/custom-role-manager) - Manages organization- or
    project-level custom roles by combining predefined roles and including and
    removing permissions with wildcards. Can run as Cloud Function or output
    Terraform resources.
*   [Dataproc Event Driven Spark Recommendations](tools/dataproc-event-driven-spark-recommendations/) -
    Use Google Cloud Functions to analyze Cloud Dataproc clusters and recommend
    best practices for Apache Spark jobs.  Also logs cluster configurations for
    future reference.
*   [Dataproc Scheduled Cluster Sizing](tools/dataproc-scheduled-cluster-sizing/) -
    Use Google Cloud Scheduler an Google Cloud Functions to schedule the resizing
    of a Dataproc cluster.  Changes the primary and secondary worker count.
*   [DataStream Deployment Automation](tools/datastream-deployment-python-automation) -
    Python script to automate the deployment of Google Cloud DataStream. This
    script will create connection profiles, create stream and start stream.
*   [DLP to Data Catalog](tools/dlp-to-data-catalog/) - Inspect your tables using Data Loss  Prevention for PII data and automatically tag it on Data Catalog using Python.
*   [DNS Sync](tools/dns-sync) - Sync a Cloud DNS zone with GCE resources.
    Instances and load balancers are added to the cloud DNS zone as they start
    from compute_engine_activity log events sent from a pub/sub push
    subscription. Can sync multiple projects to a single Cloud DNS zone.
*   [DynamoDB to Bigtable Migration](tools/dynamodb-bigtable-migration) -
    DynamoDB to Bigtable Migration tool is a powerful solution designed to streamline data transfer
    from DynamoDB to Cloud Bigtable.
    This tool automates schema translation, ensuring your data structure is mapped to Bigtable.
    It also provides options to accelerate and scale data transfer efficiently using dataflow,
    minimizing downtime and maximizing performance.
*   [Firewall Enforcer](tools/firewall-enforcer) - Automatically watch & remove
    illegal firewall rules across organization. Firewall rules are monitored by
    a Cloud Asset Inventory Feed, which trigger a Cloud Function that inspects
    the firewall rule and deletes it if it fails a test.
*   [GCE Disk Encryption Converter](tools/gce-google-keys-to-cmek) - A tool that
    converts disks attached to a GCE VM instance from Google-managed keys to a
    customer-managed key stored in Cloud KMS.
*   [GCE switch disk-type](tools/gce-change-disktype) - A tool that changes type
    of disks attached to a GCE instance.
*   [GCE Quota Sync](tools/gce-quota-sync) - A tool that fetches resource quota
    usage from the GCE API and synchronizes it to Stackdriver as a custom
    metric, where it can be used to define automated alerts.
*   [GCE Usage Log](tools/gce-usage-log) - Collect GCE instance events into a
    BigQuery dataset, surfacing your vCPUs, RAM, and Persistent Disk, sliced by
    project, zone, and labels.
*   [GCP Architecture Visualizer](https://github.com/forseti-security/forseti-visualizer) -
    A tool that takes CSV output from a Forseti Inventory scan and draws out a
    dynamic hierarchical tree diagram of org -> folders -> projects ->
    gcp_resources using the D3.js javascript library.
*   [GCP AWS HA VPN Connection terraform ](tools/gcp-aws-ha-vpn) - Terraform
    script to setup HA VPN between GCP and AWS.
*   [GCP Azure HA VPN Connection Terraform](tools/gcp-azure-ha-vpn) - Terraform
    code to setup HA VPN between GCP and Microsoft Azure.
*   [GCP Organization Hierarchy Viewer](tools/gcp-org-hierarchy-viewer) - A CLI
    utility for visualizing your organization hierarchy in the terminal.
*   [GCPViz](tools/gcpviz) - a visualization tool that takes input from
    [Cloud Asset Inventory](https://cloud.google.com/asset-inventory/docs/overview),
    creates relationships between assets and outputs a format compatible with
    [graphviz](http://graphviz.gitlab.io/).
*   [GCS Bucket Mover](tools/gcs-bucket-mover) - A tool to move user's bucket,
    including objects, metadata, and ACL, from one project to another.
*   [GCS to BigQuery](tools/gcs2bq) - A tool fetches object metadata from all
    Google Cloud Storage buckets and exports it in a format that can be imported
    into BigQuery for further analysis.
*   [GCS Usage Recommender](tools/gcs-usage-recommender) - A tool that generates
    bucket-level intelligence and access patterns across all projects for a GCP
    project to generate recommended object lifecycle management.
*   [GCVE2BQ](tools/gcve2bq) - A tool for scheduled exports of VM, datastore and ESXi
    utilization data from vCenter to BigQuery for billing and reporting use cases.
*   [GenAI-Powered Code Modification Cloud Function](tools/genai-code-mod-auto) - A deployable Google Cloud Function that, powered by the Vertex AI Gemini API, automates code modification. It reads files from GitHub, processes them with an LLM to generate new versions, and then saves those modifications back to the repositories.
*   [GKE AutoPSC Controller](tools/gke-autopsc-controller) - Google Kubernetes Engine
    controller, to setup PSC ServiceAttachment for Gateway API managed Forwarding Rules.
*   [Global DNS -> Zonal DNS Project Bulk Migration](tools/gdns-zdns-project-bulk-migration) -
    A shell script for gDNS-zDNS project bulk migration.
*   [GKE Billing Export](tools/gke-billing-export) - Google Kubernetes Engine
    fine grained billing export.
*   [GKE GPU Driver Version](tools/gke-gpu-driver-version) - A tool to find the supported GPU driver version for a given GKE cluster version and GPU type.
*   [gmon](tools/gmon/) - A command-line interface (CLI) for Cloud Monitoring
    written in Python.
*   [Google Cloud Support Slackbot](tools/google-cloud-support-slackbot) - Slack
    application that pulls Google Cloud support case information via the Cloud
    Support API and pushes the information to Slack
*   [GSuite Exporter Cloud Function](tools/gsuite-exporter-cloud-function/) - A
    script that deploys a Cloud Function and Cloud Scheduler job that executes
    the GSuite Exporter tool automatically on a cadence.
*   [GSuite Exporter](tools/gsuite-exporter/) - A Python package that automates
    syncing Admin SDK APIs activity reports to a GCP destination. The module
    takes entries from the chosen Admin SDK API, converts them into the
    appropriate format for the destination, and exports them to a destination
    (e.g: Stackdriver Logging).
*   [Hive to BigQuery](tools/hive-bigquery/) - A Python framework to migrate
    Hive table to BigQuery using Cloud SQL to keep track of the migration
    progress.
*   [IAM Permissions Copier](tools/iam-permissions-copier) - This tool allows
    you to copy supported GCP IAM permissions from unmanaged users to managed
    Cloud Identity users.
*   [IAM Recommender at Scale](tools/iam-recommender-at-scale) - A python
    package that automates applying iam recommendations.
*   [Instance Mapper](tools/instance_mapper) - Maps different IaaS VM instance
    types from EC2 and Azure Compute to Google Cloud Platform instance types
    using a customizable score-based method. Also supports database instances.
*   [IPAM Autopilot](tools/ipam-autopilot) - A simple tool for managing IP
    address ranges for GCP subnets.
*   [K8S-2-GSM](tools/k8s-2-gsm) - A containerized golang app to migrate Kubernetes
    secrets to Google Secrets Manger
    (to leverage [CSI secret driver](https://secrets-store-csi-driver.sigs.k8s.io/)).
    [LabelMaker](tools/labelmaker) - A tool that reads key:value pairs from a
    json file and labels the running instance and all attached drives
    accordingly.
*   [Logbucket Global to Regional](tools/logbucket-global-to-regional) - Utility
    to change _Default sink destination to regional log buckets
*   [Machine Learning Auto Exploratory Data Analysis and Feature Recommendation](tools/ml-auto-eda) -
    A tool to perform comprehensive auto EDA, based on which feature
    recommendations are made, and a summary report will be generated.
*   [Maven Archetype Dataflow](tools/maven-archetype-dataflow) - A maven
    archetype which bootstraps a Dataflow project with common plugins
    pre-configured to help maintain high code quality.
*   [Netblock Monitor](tools/netblock-monitor) - An Apps Script project that
    will automatically provide email notifications when changes are made to
    Google’s IP ranges.
*   [OpenAPI to Cloud Armor converter](tools/openapi-to-cloud-armor) - A simple
    tool to generate Cloud Armor policies from OpenAPI specifications.
*   [Permission Discrepancy Finder](tools/permission-discrepancy-finder) - A
    tool to find the principals with missing permissions on a resource within a
    project, subsequently, grants them the missing permissions.
*   [Pubsub2Inbox](tools/pubsub2inbox) - A generic Cloud Function-based tool
    that takes input from Pub/Sub messages and turns them into email, webhooks
    or GCS objects.
*   [Quota Manager](tools/quota-manager) - A python module to programmatically
    update GCP service quotas such as bigquery.googleapis.com.
*   [Quota Monitoring and Alerting](tools/quota-monitoring-alerting) - An
    easy-to-deploy Data Studio Dashboard with alerting capabilities, showing
    usage and quota limits in an organization or folder.
*   [RAG Application Using Vector Search](tools/rag-application-using-vector-search) - It serves
    primarily to demonstrate the capabilities of the underlying backend services, and as a reference
    architecture for customer deployments. This tool deploys a backend system for Retrieval-Augmented
    Generation (RAG) on Google Cloud, fully managed by Infrastructure as Code (IaC) via Terraform. It
    enables querying private documents with Large Language Models (LLMs), powerfully augmented by context
    from Vertex AI RAG Engine and Vector Search. While a simple Streamlit UI is included, it serves
    primarily to demonstrate the capabilities of the underlying backend services.
*   [Ranger Hive Assessment for BigQuery/BigLake IAM migration](tools/ranger-to-bigquery-biglake-assessment) -
    A tool that assesses which Ranger authorization rules can be migrated
    or not to BigQuery/BigLake IAM.
*   [Reddit Comment Streaming](tools/reddit-comment-streaming/) -
    Use PRAW, TextBlob, and Google Python API to collect and analyze
    reddit comments. Pushes comments to a Google Pub/sub Topic.
*   [Secret Manager Helper](tools/secret-manager-helper) - A Java library to
    make it easy to replace placeholder strings with Secret Manager secret
    payloads.
*   [Service Account Provider](tools/service-account-provider) - A tool to
    exchange GitLab CI JWT tokens against GCP IAM access tokens, in order to
    allow GitLab CI jobs to access Google Cloud APIs
*   [Site Verification Group Sync](tools/site-verification-group-sync) - A tool
    to provision "verified owner" permissions (to create GCS buckets with custom
    dns) based on membership of a Google Group.
*   [SLO Generator](tools/slo-generator/) - A Python package that automates
    computation of Service Level Objectives, Error Budgets and Burn Rates on
    GCP, and export the computation results to available exporters (e.g: PubSub,
    BigQuery, Stackdriver Monitoring), using policies written in JSON format.
*   [Snowflake_to_BQ](tools/snowflake2bq/) - A shell script to transfer tables
    (schema & data) from Snowflake to BigQuery.
*   [SPIFFE GCP Proxy](tools/spiffe-gcp-proxy) - A tool to ease the integration
    of [SPIFFE](https://spiffe.io/) supported On-Prem workloads with GCP APIs
    using Workload Identity Federation
*   [STS Job Manager](tools/sts-job-manager/) - A petabyte-scale bucket
    migration tool utilizing
    [Storage Transfer Service](https://cloud.google.com/storage-transfer-service)
*   [Vector Search Load Testing Framework](tools/vector-search-load-testing-framework) - This
    framework provides a streamlined solution for distributed load testing of Vertex AI
    Vector Search endpoints on Google Kubernetes Engine (GKE) using
    [Locust](https://locust.io/). It enables you to simulate production-like workloads to effectively benchmark performance, analyze scalability, and validate deployment
    configurations.
*   [Vertex AI Endpoint Tester] (tools/vertex-ai-endpoint-load-tester) - This
    utility helps to methodically test variety of Vertex AI Endpoints by their
    sizes so that one can decide the right size to deploy an ML Model on Vertex
    AI given a sample request JSON and some idea(s) on expected queries per second.
*   [Vertex AI Endpoint Tester](tools/vertex-ai-endpoint-load-tester) - This
    utility helps to methodically test variety of Vertex AI Endpoints by their
    sizes so that one can decide the right size to deploy an ML Model on Vertex
    AI given a sample request JSON and some idea(s) on expected queries per second.
*   [VM Migrator](tools/vm-migrator) - This utility automates migrating Virtual
    Machine instances within GCP. You can migrate VM's from one zone to another
    zone/region within the same project or different projects while retaining
    all the original VM properties like disks, network interfaces, ip, metadata,
    network tags and much more.
*   [VPC Flow Logs Analysis](tools/vpc-flowlogs-analysis) - A configurable Log
    sink + BigQuery report that shows traffic attributed to the projects in the
    Shared VPCs.
*   [VPC Flow Logs Enforcer](tools/vpc-flowlogs-enforcer) - A Cloud Function
    that will automatically enable VPC Flow Logs when a subnet is created or
    modified in any project under a particular folder or folders.
*   [VPC Flow Logs Top Talkers](tools/vpc-flowlogs-toptalkers) - A configurable
    Log sink + BigQuery view to generate monthly/daily aggregate traffic reports
    per subnet or host, with the configurable labelling of IP ranges and ports.
*   [Webhook Ingestion Data Pipeline](tools/webhook-ingestion-pipeline) - A
    deployable app to accept and ingest unauthenticated webhook data to
    BigQuery.
*   [XSD to BigQuery Schema Generator](tools/xsd-to-bigquery-schema) - A command
    line tool for converting an XSD schema representing deeply nested and
    repeated XML content into a BigQuery compatible table schema represented in
    JSON.
*   [Numeric Family Recommender - Oracle](tools/numeric-family-recommender-oracle) - The Numeric Family
    Recommender is a database script that recommends the best numeric data type for the NUMBER data type
    when migrating from legacy databases like Oracle to Google Cloud platforms like BigQuery, AlloyDB,
    Cloud SQL for PostgreSQL, and Google Cloud Storage.
*   [Cloud Composer Stress Testing](tools/cloud-composer-stress-testing) - A collection
    of tools aimed at testing, benchmarking, and simulating workloads within Composer. Great for
    integration testing and experimenting with different environment configurations.
*   [Cloud Composer Environment Rotator](tools/cloud-composer-environment-rotator) - Rotate Airflow
    resources from an old composer environment to a new composer environment with minimal downtime. Ideal
    for non in-place environment updates, downgrading environment versions, or migrating to different regions.
*   [Gradio and Generative AI Example](examples/genai-gradio-example) - The example code allows developers
    to create rapid Generative AI PoC applications with Gradio and Gen AI agents.
*   [Memorystore Cluster Ops Framework](tools/memorystore-cluster-ops-framework) - This is a framework that
    provides the tools to apply cluster level operations that enable capabilities like cluster backups, migration & validation, etc.
    The framework can be extended for other use cases as required.
    The framework uses RIOT to bridge current product gaps with Memorystore Clusters
*   [ML Project Generator](tools/ml-project-generator) - A utility to create a Production grade ML project template with the best productivity tools installed like auto-formatting, license checks, linting, etc.
*   [Policy Tags Engine](tools/policy-tags-engine) - The tool allows developers to automatically apply BigQuery column-level security (Policy Tags) based on metadata files uploaded to a Google Cloud Storage (GCS) bucket.


## Contributing

See the contributing [instructions](/CONTRIBUTING.md) to get started
contributing.

## Contact

Questions, issues, and comments should be directed to
[professional-services-oss@google.com](mailto:professional-services-oss@google.com).

[gcf]: https://cloud.google.com/functions/
[gcf-bg]: https://cloud.google.com/functions/docs/writing/background
[logs-export]: https://cloud.google.com/logging/docs/export/
