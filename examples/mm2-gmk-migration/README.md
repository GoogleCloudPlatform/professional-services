# mm2-gmk-migration
Migrate to Google Managed Kafka using MirrorMaker2

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fmandeeptrehan%2Fmm2-gmk-migration.git)

## Setup Terraform Workspace

1. Update modules/environments/production/backends.tf
```
Example (Please update actuals)

bucket  = "YOUR_GCS_BUCKET"
```
2. run terraform init
```
cd terraform/modules/environments/production
terraform init
```

## Deploy Google Cloud Managed Service for Apache Kafka (GMK)
1. Please Navigate to Update modules/environments/production/deploy_kafka.tf (One for each src and dest cluster)and update the required variables
```
Example (Please update actuals)

project_id = "YOUR_PROJECT_ID"
region = "us-central1"

Please change following if needed to update the kafka parameters (name, topic name )
```
2. Run terraform plan for kafka module
```
cd terraform/modules/environments/production
terraform plan -target=module.deploy_kafka
```
3. Run terraform apply for kafka module
```
cd terraform/modules/environments/production
terraform apply -target=module.deploy_kafka
```

Please Note It May take upto 30 minutes for the cluster to come up
```
module.google-managed-kafka.google_managed_kafka_cluster.cluster: Creation complete after 28m37s [id=projects/mbawa-sandbox/locations/us-central1/clusters/kafka-dev]
module.google-managed-kafka.google_managed_kafka_topic.example-topic: Creating...
module.google-managed-kafka.google_managed_kafka_topic.example-topic: Creation complete after 6s [id=projects/mbawa-sandbox/locations/us-central1/clusters/kafka-dev/topics/kafka-topic]
```

## Deploy Kafka Producer Enviorment
1. Please Navigate to Update modules/environments/production/deploy_producer.tf and update the required variables
2. Run terraform plan for producer module
```
cd terraform/modules/environments/production
terraform plan -target=module.deploy_producer
```
3. Run terraform apply for producer module
```
cd terraform/modules/environments/production
terraform apply -target=module.deploy_producer
```

4. SSH to the `kafka-producer` google compute engine instance.
bootstrap derived from [here](https://cloud.google.com/managed-service-for-apache-kafka/docs/quickstart-python)
we have bootstrapped the same using a start-up script


5. Edit/Upload the `producer.py` script and run the same using `python producer.py` to generate data


## Deploy Stand Alone Mirror Maker 2

Launch a stand alone Mirror Maker 2 node
1. create a GCS bucket to store mirror maker 2 binaries
2. run deploy.sh script
    ```
    bash deploy.sh mm2-binaries-bucket
    ```
3. Update the `terraform/modules/mirror-maker2-standalone/variables.tf` with corresponding default values
   Update the `terraform/modules/environments/production/deploy_mm2-standalone.tf` with corresponding values
    ```
    Example (Please update actuals)
    
    project_id = "YOUR_PROJECT_ID"
    region = "us-central1"
    zone = "us-central1-a"
    service_account_email = "compute@developer.gserviceaccount.com"
    kafka_cluster_src_broker = "bootstrap.kafka-src-new.us-central1.managedkafka.mbawa-sandbox.cloud.goog:9092"
    kafka_cluster_dest_broker = "bootstrap.kafka-dest-new.us-central1.managedkafka.mbawa-sandbox.cloud.goog:9092"
    ```

4. terraform initialization
    ```
    cd terraform/modules/environments/production
    terraform init
    ```

5. terraform plan to check the resources being created

   ```
    cd terraform/modules/environments/production
    terraform plan -target=module.deploy_mm2-standalone
   ```

6. deploy the resources
   ```
    cd terraform/modules/environments/production
    terraform apply -target=module.deploy_mm2-standalone
   ```

## Deploy Google Managed Kafka Connect and  Mirror Maker 2 Connectors

Launch a Google Managed Kafka Connect Cluster and Mirror Maker 2 Connectors
1. Fetch the latest google terraform module
    ```
    terraform init -upgrade
    ```
  
2. Update the `terraform/modules/google-managed-kafkaconnect-mirror-maker2/variables.tf` with corresponding default values
   Update the `terraform/modules/environments/production/deploy_kafka_connect_mm2.tf` with corresponding values
    ```
    Example (Please update actuals)
    
    project_id = "test-sandbox"
    region = "us-central1"
    zone = "us-central1-a"
    mkc_cluster_name = "mkc-mm2-tf"
    mkc_dest_cluster_id = "kafka-dest-new"
    mkc_src_cluster_id = "kafka-src-new"
    gmk_src_region = "us-central1"
    gmk_dst_region = "us-central1"                            
    shared_vpc_name = ""
    shared_vpc_subnetwork = ""                            
    service_account_email = "compute@developer.gserviceaccount.com"
    kafka_cluster_src_broker = "bootstrap.kafka-src-new.us-central1.managedkafka.test-sandbox.cloud.goog:9092"
    kafka_cluster_dest_broker = "bootstrap.kafka-dest-new.us-central1.managedkafka.test-sandbox.cloud.goog:9092"
    ```


Please note you would need to update user name and password based on [GMK SASL/PLAIN authentication](https://cloud.google.com/managed-service-for-apache-kafka/docs/authentication-kafka#sasl-plain)



  

3. terraform initialization
    ```
    cd terraform/modules/environments/production
    terraform init
    ```

4. terraform plan to check the resources being created

   ```
    cd terraform/modules/environments/production
    terraform plan -target=module.kafka-connect-mm2
   ```

5. deploy the resources
   ```
    cd terraform/modules/environments/production
    terraform apply -target=module.kafka-connect-mm2
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

shlokk@mm2-standalone:~$ curl localhost:3600 | grep -i kafka-src-topic

kafka_consumer_fetch_manager_records_consumed_total{clientId="\"source->target|MirrorSourceConnector-0|replication-consumer\"",topic="kafka-src-topic",} 0.0
kafka_connect_mirror_source_connector_replication_latency_ms{destination="target",partition="0",topic="source.kafka-src-topic",} 0.0
kafka_connect_mirror_source_connector_replication_latency_ms_max{destination="target",partition="1",topic="source.kafka-src-topic",} NaN
```
