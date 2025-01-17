# mm2-gmk-migration
This repository provides hands-on experience to migrate data between two Google Managed Kafka clustes using MirrorMaker2. As a part of POC, below resources are provisioned:
1. Two Google Managed Kafka clusters as a source and destination. To disable creation of the source cluster, please modify the `terraform plan` step to not include `-target=module.google-managed-kafka-src`, in the "Deploy Google Cloud Managed Service for Apache Kafka (GMK)" section of this file. To point the source cluster to one on-prem, please update [this variable](https://github.com/GoogleCloudPlatform/professional-services/blob/main/examples/mm2-gmk-migration/terraform/modules/environments/production/deploy_mm2-standalone.tf#L12) as well as [this password](https://github.com/GoogleCloudPlatform/professional-services/blob/main/examples/mm2-gmk-migration/terraform/modules/mirror-maker2-standalone/mm2standalone.tf#L129).
2. MirrorMaker2 on GCE
3. Kafka Producer node to publish messages for testing purpose

<img src="./static/Kafka Migration using MM2.png" alt="drawing" width="600"/>

Please follow below instructions to deploy resources for POC:

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fmandeeptrehan%2Fmm2-gmk-migration.git)

## Setup Terraform Workspace

1. Create a GCS bucket of your choice to store Terraform state files. 
   1. Update modules/environments/production/backends.tf
```
Example (Please update with actual values)

bucket  = "YOUR_GCS_BUCKET"
prefix  = "terraform" 
```
2. run terraform init
```
cd terraform/modules/environments/production
terraform init
```

## Deploy Google Cloud Managed Service for Apache Kafka (GMK)
1. Navigate to Update modules/environments/production/deploy_kafka.tf (One for each src and dest cluster)and update the required variables
```
Example (Please update with actual values.)

project_id = "YOUR_PROJECT_ID"
region = "us-central1"

Please change following if needed to update the kafka parameters (name, topic name)
```
2. Run terraform plan for kafka module (This will plan both source and destination kafka cluster one can trigger this individually as well)
```
cd terraform/modules/environments/production
terraform plan -target=module.google-managed-kafka-src -target=module.google-managed-kafka-dest
```
3. Run terraform apply for kafka module (This will deploy both source and destination kafka cluster one can trigger this individually as well)
```
cd terraform/modules/environments/production
terraform apply -target=module.google-managed-kafka-src -target=module.google-managed-kafka-dest
```

Please Note It May take up to 30 minutes for the cluster to create.
```
module.google-managed-kafka.google_managed_kafka_cluster.cluster: Creation complete after 28m37s [id=projects/mbawa-sandbox/locations/us-central1/clusters/kafka-dev]
module.google-managed-kafka.google_managed_kafka_topic.example-topic: Creating...
module.google-managed-kafka.google_managed_kafka_topic.example-topic: Creation complete after 6s [id=projects/mbawa-sandbox/locations/us-central1/clusters/kafka-dev/topics/kafka-topic]
```

## Deploy Kafka Producer Environment
1. Navigate to Update modules/environments/production/deploy_producer.tf and update the required variables
2. Run terraform plan for producer module
```
cd terraform/modules/environments/production
terraform plan -target=module.kafka-producer
```
3. Run terraform apply for producer module
```
cd terraform/modules/environments/production
terraform apply -target=module.kafka-producer
```

4. SSH to the `kafka-producer` google compute engine instance.
bootstrap derived from [here](https://cloud.google.com/managed-service-for-apache-kafka/docs/quickstart-python)
we have bootstrapped the same using a start-up script


5. Edit/Upload the `producer.py` script and run the same using `python producer.py` to generate data. (This is a Python3 file).


## Deploy Standalone MirrorMaker 2

Launch a standalone Mirror Maker 2 node
1. Create a GCS bucket to store mirror maker 2 binaries
2.  ```
    $BUCKET=mm2-binaries-bucket
    ```
3. run deploy.sh script
    ```
    bash deploy.sh $BUCKET
    ```
4. Update the `terraform/modules/mirror-maker2-standalone/variables.tf` with corresponding default values
   Update the `terraform/modules/environments/production/deploy_mm2-standalone.tf` with corresponding values
    ```
    Example (Please update `YOUR_PROJECT_ID` and `your-project-name` with actual values. Note that the service account should be the one used for creating a Managed Service for Apache Kafka cluster.)
    
    project_id = "YOUR_PROJECT_ID"
    region = "us-central1"
    zone = "us-central1-a"
    service_account_email = "594537533327-compute@developer.gserviceaccount.com"
    kafka_cluster_src_broker = "bootstrap.kafka-src-new.us-central1.managedkafka.your-project-name.cloud.goog:9092"
    kafka_cluster_dest_broker = "bootstrap.kafka-dest-new.us-central1.managedkafka.your-project-name.cloud.goog:9092"
    ```
Please note you would need to update username and password based on [GMK SASL/PLAIN authentication](https://cloud.google.com/managed-service-for-apache-kafka/docs/authentication-kafka#sasl-plain)

    
    ![image](https://github.com/user-attachments/assets/3fd73be8-4449-43f1-8b54-71af0a863cb8)

  

4. terraform initialization
    ```
    cd terraform/modules/environments/production
    terraform init
    ```

5. terraform plan to check the resources being created

   ```
    cd terraform/modules/environments/production
    terraform plan -target=module.mm2-standalone
   ```

6. deploy the resources
   ```
    cd terraform/modules/environments/production
    terraform apply -target=module.mm2-standalone
   ```

## Troubleshooting 

* **Startup-script Logs**
```
sudo journalctl -u google-startup-scripts.service
```

* **Mirror Maker 2 Metrics**

> TODO integrate with cloud monitoring agent 

https://cloud.google.com/stackdriver/docs/solutions/agents/ops-agent/prometheus

```
https://varunkumarpal.medium.com/kafka-monitoring-your-mirrormaker-with-prometheus-fe10d6db4d2d

# Replication Latency 
curl localhost:3600 | grep -i kafka_connect_mirror_source_connector_replication_latency_ms_max

#Other Metrics

curl localhost:3600 | grep -i kafka-src-topic

kafka_consumer_fetch_manager_records_consumed_total{clientId="\"source->target|MirrorSourceConnector-0|replication-consumer\"",topic="kafka-src-topic",} 0.0
kafka_connect_mirror_source_connector_replication_latency_ms{destination="target",partition="0",topic="source.kafka-src-topic",} 0.0
kafka_connect_mirror_source_connector_replication_latency_ms_max{destination="target",partition="1",topic="source.kafka-src-topic",} NaN
```
