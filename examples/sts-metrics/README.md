# Storage Transfer Service(STS) Metrics
[Google Cloud STS](https://cloud.google.com/storage-transfer/docs/overview) provides options to move data between buckets or from other cloud providers more easier. Users can schedule recurring or ad-hoc STS  jobs to move data for data backup, synchronization, and replication. As a managed service, STS provides some [metrics](https://cloud.google.com/monitoring/api/metrics_gcp#gcp-storagetransfer) out of box in Cloud Monitoring. However, there are many use cases for which users need to create their own metrics as provided could metrics are not adequate, and the metrics often need to be ingested into monitoring systems other than Cloud Monitoring.  The example demonstrates how STS metrics can be instrumented using [STS notification](https://cloud.google.com/storage-transfer/docs/pub-sub-transfer) and exported to [Prometheus](https://prometheus.io/docs/concepts/data_model/) format for ingestion to the most popular monitoring systems that support the format.

## How it works
The example is a Java application and you can run it locally. The app uses [OpenCensus](https://opencensus.io/) metrics framework and its Prometheus [exporter](https://opencensus.io/exporters/supported-exporters/java/prometheus/).  There are two main threads when the app runs:

- JobGeneration -- Generate X number of immediately run STS jobs every Y seconds.
- NotificationHandler -- Subscribe to STS notification pubsub topic. Process notifications and record the time series data point.

The app exposes Prometheus formatted metrics via /metrics endpoint.

The app collects the following metrics for demonstration purpose:

- Operation Number -- The number of operations. When a STS job runs, it's an operation.
- Operation Latency -- The time it takes to complete an operation.
- Object Number - The number of objects copied from source to destination per operation.
- Bytes -- The number of bytes copied from source to destination per operation.

All the metrics have the following tags(labels):

- Project ID -- GCP project in which STS jobs are configured and run.
- Source Bucket -- Where source data reside.
- Destination Bucket -- Where data are copied to.
- Status -- The status of the operation.



## GCP Resources
The example requires the following GCP resources in a single project:

- Source Bucket -- A GCS bucket as source
- Destination Bucket -- A GCS bucket as destination
- Pubsub Topic -- A topic for STS notifications
- Service Account
    - STS Account -- The service account is created by Google when STS jobs are configured. The account should have the read permission on the source bucket and write on the destination bucket.
    - App Account -- The service account that the example run as. The service account are given the permission to manage STS jobs and receive messages from the STS notification topic.

## How to run
Once you have all the GCP resources created and properly configured, you can run the example as below:

1. Get the repo
   `git clone git@github.com:GoogleCloudPlatform/professional-services.git`
2. Go to the root of the example
   `cd professional-services/examples/sts-metrics`
3. Build the jar
   `mvn clean install package`
4. Start the app
   `java -jar target/sts-metrics-jar-with-dependencies.jar`

You can check the metric by accessing localhost:8888/metrics in your browser. You could also use the watch.sh script to poll the url periodically.

## Logs
**Java App Log**
You will see the log like the following:

> [INFO ] 2022-12-18 11:33:06.250 [pool-7-thread-1] StsJobHelper - Creating one time transfer job in STS: {description=eshen-test, name=transferJobs/a-eshen-1671391986249, notificationConfig={payloadFormat=JSON, pubsubTopic=projects/eshen-test-3/topics/eshen-sts-metrics-topic}, projectId=eshen-test-3, schedule={scheduleEndDate={day=16, month=12, year=2022}, scheduleStartDate={day=16, month=12, year=2022}}, status=ENABLED, transferSpec={gcsDataSink={bucketName=eshen-sts-metrics-dest}, gcsDataSource={bucketName=eshen-sts-metrics-src}, objectConditions={includePrefixes=[dummy-prefix]}, transferOptions={deleteObjectsFromSourceAfterTransfer=true, overwriteObjectsAlreadyExistingInSink=true}}}
> ...............
> [INFO ] 2022-12-18 11:33:08.111 [Gax-7] StsJobNotificationHandler - <MessageId=6458694416888096>: {"name":"transferOperations/transferJobs-a-eshen-1671344241375-12338117834211986926","projectId":"eshen-test-3","transferSpec":{"gcsDataSource":{"bucketName":"eshen-sts-metrics-src"},"gcsDataSink":{"bucketName":"eshen-sts-metrics-dest"},"objectConditions":{"includePrefixes":["dummy-prefix"]},"transferOptions":{"overwriteObjectsAlreadyExistingInSink":true,"deleteObjectsFromSourceAfterTransfer":true}},"startTime":"2022-12-18T06:17:22.225396152Z","endTime":"2022-12-18T06:17:32.653094766Z","status":"SUCCESS","counters":{},"transferJobName":"transferJobs/a-eshen-1671344241375","notificationConfig":{"pubsubTopic":"projects/eshen-test-3/topics/eshen-sts-metrics-topic","payloadFormat":"JSON"},"reportedCounters":[{"name":"walltime_microseconds","value":"36092"}]}
[INFO ] 2022-12-18 11:33:08.358 [Gax-7] StsJobNotificationHandler - <MessageId=6458694416888096>: operation=transferOperations/transferJobs-a-eshen-1671344241375-12338117834211986926 sourceBucket=eshen-sts-metrics-src destBucket=eshen-sts-metrics-dest, status=SUCCESS latency=88,755.54 objectsCopied=742 bytesCopied=137974222

**Watch Script Log**

> \# HELP object_deleted_num The number of deleted objects
\# TYPE object_deleted_num counter
object_deleted_num{destBucketId="eshen-sts-metrics-dest",projectId="esher-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",} 2768.0
\# HELP object_deleted_bytes The number of bytes deleted
\# TYPE object_deleted_bytes counter
object_deleted_bytes{destBucketId="eshen-sts-metrics-dest",projectId="ashen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",} 1.295246533E9
\# HELP sts_operation_num The number of STS operations
\# TYPE sts_operation_num counter
sts_operation_num{destBucketId="eshen-sts-metrics-dest",projectId="eshen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",} 7.0
\# HELP sts_operation_latency The latency of STS operations
\# TYPE sts_operation_latency histogram
sts_operation_latency_bucket{destBucketId="eshen-sts-metrics-dest",projectId="eshen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",le="60000.0",} 2.0
sts_operation_latency_bucket{destBucketId="eshen-sts-metrics-dest",projectId="eshen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",le="300000.0",} 7.0
sts_operation_latency_bucket{destBucketId="eshen-sts-metrics-dest",projectId="eshen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",le="600000.0",} 7.0
sts_operation_latency_bucket{destBucketId="eshen-sts-metrics-dest",projectId="eshen-test-3",srcBucketId="eshen-sts-metrics-src",status="SUCCESS",le="1800000.0",} 7.0


