# dataproc-job-optimization

----

## Table Of Contents

1. [About](#About)
2. [Guide](#Guide)
3. [Results](#Results)
4. [Next Steps](#Next-steps)

----

## About

This guide is designed to optimize performance and cost of applications running on Dataproc clusters.  Because Dataproc supports many big data technologies - each with their own intricacies - this guide is intended to be trial-and-error experimentation.  Initially it will begin with a generic dataproc cluster with defaults set. As you proceed through the guide, you’ll increasingly customize Dataproc cluster configurations to fit your specific workload.

Plan to separate Dataproc Jobs into different clusters - they use resources differently and can impact each other’s performances when run simultaneously. Even better, isolating single jobs to single clusters can set you up for ephemeral clusters, where jobs can run in parallel on their own dedicated resources.

Once your job is running successfully, you can safely iterate on the configuration to improve runtime and cost, falling back to the last successful run whenever experimental changes have a negative impact.

----

## Guide

### 1. Getting Started 

Fill in your environment variables and run the following code in a terminal to set up your Google Cloud project. 

```bash
export PROJECT_ID=""
export REGION=""
export CLUSTER_NAME=""
export BUCKET_NAME=""
TIMESTAMP=$(date "+%Y-%m-%dT%H%M%S")
export TIMESTAMP

./scripts/setup.sh -p $PROJECT_ID -r $REGION -c $CLUSTER_NAME -b $BUCKET_NAME -t $TIMESTAMP
```

This script will:

1. Setup project and enable APIs
2. Remove any old infrastructure related to this project (in case of previous runs)
3. Create a Google Cloud Storage bucket and a BigQuery Dataset
4. Load public data into a personal BigQuery Dataset
5. Import autoscaling policies
6. Create the first Dataproc sizing cluster

**Monitoring Dataproc Jobs**
![Stack-Resources](images/monitoring-jobs.png)


### 2. Calculate Dataproc cluster size

A sizing cluster can help determine the right number of workers for your application.  This cluster will have an autoscaling policy attached.  Set the autoscaling policy min/max values to whatever is allowed in your project. Run your jobs on this cluster. Autoscaling will continue to add nodes until the YARN pending memory metric is zero. A perfectly sized cluster should never have YARN pending memory.


```bash
gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-sizing scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

![Stack-Resources](images/monitoring-nodemanagers.png)

### 3. Optimize Dataproc cluster configuration

Using a non-autoscaling cluster during this experimentation phase can lead to the discovery of more accurate machine-types, persistent disks, application properties, etc. For now, build an isolated non-autoscaling cluster for your job that has the optimized number of primary workers.

Run your job on this appropriately-sized non-autoscaling cluster. If the CPU is maxing out, consider using C2 machine type. If memory is maxing out, consider using N2D-highmem machine types.  Also consider increasing the machine cores (while maintaining a consistent overall core count observed during sizing phase). 


**Monitoring CPU Utilization**

![Stack-Resources](images/monitoring-cpu.png)


**Monitoring YARN Memory**

![Stack-Resources](images/monitoring-yarn-memory.png)

**8 x n2-standard-2 = 1 min 53 seconds**

```bash
gcloud dataproc clusters create $CLUSTER_NAME-testing-2x8-standard \
  --master-machine-type=n2-standard-2 \
  --worker-machine-type=n2-standard-2 \
  --num-workers=8 \
  --master-boot-disk-type=pd-standard \
  --master-boot-disk-size=1000GB \
  --worker-boot-disk-type=pd-standard \
  --worker-boot-disk-size=1000GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-2x8-standard scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

**4 x n2-standard-4 = 1 min 48 seconds**

```bash
gcloud dataproc clusters delete $CLUSTER_NAME-testing-2x8-standard \
  --region=$REGION

gcloud dataproc clusters create $CLUSTER_NAME-testing-4x4-standard \
  --master-machine-type=n2-standard-4 \
  --worker-machine-type=n2-standard-4 \
  --num-workers=4 \
  --master-boot-disk-type=pd-standard \
  --master-boot-disk-size=1000GB \
  --worker-boot-disk-type=pd-standard \
  --worker-boot-disk-size=1000GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-4x4-standard scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

**2 x n2-standard-8 = 1 min 31 seconds**

```bash
gcloud dataproc clusters delete $CLUSTER_NAME-testing-4x4-standard \
  --region=$REGION

gcloud dataproc clusters create $CLUSTER_NAME-testing-8x2-standard \
  --master-machine-type=n2-standard-8 \
  --worker-machine-type=n2-standard-8 \
  --num-workers=2 \
  --master-boot-disk-type=pd-standard \
  --master-boot-disk-size=1000GB \
  --worker-boot-disk-type=pd-standard \
  --worker-boot-disk-size=1000GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-8x2-standard scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

If you’re still observing performance issues, consider moving from pd-standard to pd-balanced or pd-ssd.

- Standard persistent disks (pd-standard) are suited for large data processing workloads that primarily use sequential I/Os.

- Balanced persistent disks (pd-balanced) are an alternative to SSD persistent disks that balance performance and cost. With the same maximum IOPS as SSD persistent disks and lower IOPS per GB, a balanced persistent disk offers performance levels suitable for most general-purpose applications at a price point between that of standard and SSD persistent disks.

- SSD persistent disks (pd-ssd) are suited for enterprise applications and high-performance database needs that require lower latency and more IOPS than standard persistent disks provide.

For similar costs, pd-standard 1000GB == pd-balanced 500GB == pd-ssd 250 GB. 

![Stack-Resources](images/monitoring-hdfs.png)


**2 x n2-standard-8-balanced = 1 min 26 seconds**

```bash
gcloud dataproc clusters delete $CLUSTER_NAME-testing-8x2-standard \
  --region=$REGION

gcloud dataproc clusters create $CLUSTER_NAME-testing-8x2-balanced \
  --master-machine-type=n2-standard-8 \
  --worker-machine-type=n2-standard-8 \
  --num-workers=2 \
  --master-boot-disk-type=pd-balanced \
  --master-boot-disk-size=500GB \
  --worker-boot-disk-type=pd-balanced \
  --worker-boot-disk-size=500GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-8x2-balanced scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

**2 x n2-standard-8-ssd = 1 min 21 seconds**

```bash
gcloud dataproc clusters delete $CLUSTER_NAME-testing-8x2-balanced \
  --region=$REGION

gcloud dataproc clusters create $CLUSTER_NAME-testing-8x2-ssd \
  --master-machine-type=n2-standard-8 \
  --worker-machine-type=n2-standard-8 \
  --num-workers=2 \
  --master-boot-disk-type=pd-ssd \
  --master-boot-disk-size=250GB \
  --worker-boot-disk-type=pd-ssd \
  --worker-boot-disk-size=250GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-8x2-ssd scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

Monitor HDFS Capacity to determine disk size. If this ever drops to zero, you’ll need to increase the persistent disk size.  If HDFS Capacity is too large for this job, consider lowering the disk size to save on storage costs.

**2 x n2-standard-8-ssd-costop = 1 min 18 seconds**

```bash
gcloud dataproc clusters delete $CLUSTER_NAME-testing-8x2-ssd \
  --region=$REGION

gcloud dataproc clusters create $CLUSTER_NAME-testing-8x2-ssd-costop \
  --master-machine-type=n2-standard-8 \
  --worker-machine-type=n2-standard-8 \
  --num-workers=2 \
  --master-boot-disk-type=pd-ssd \
  --master-boot-disk-size=30GB \
  --worker-boot-disk-type=pd-ssd \
  --worker-boot-disk-size=30GB \
  --region=$REGION

gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-8x2-ssd-costop scripts/spark_average_speed.py -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

### 4. Optimize application-specific properties


If you’re still observing performance issues, you can begin to adjust application properties. Ideally these properties are set on the job submission. This isolates properties to their respective jobs. Since this job runs on Spark, view the [tuning guide here.](https://cloud.google.com/dataproc/docs/support/spark-job-tuning)

Since this guide uses a simple spark application and small amount of data, you may not see job performance improvement.  This section is more applicable for larger use-cases.

sample job submit:

**2 x n2-standard-8-ssd-costop-appop = 1 min 15 seconds**

```bash
gsutil -m rm -r gs://$BUCKET_NAME/transformed-$TIMESTAMP

gcloud dataproc jobs submit pyspark --region=$REGION --cluster=$CLUSTER_NAME-testing-8x2-ssd-costop scripts/spark_average_speed.py --properties='spark.executor.cores=5,spark.driver.cores=5,spark.executor.instances=1,spark.executor.memory=25459m,spark.driver.memory=25459m,spark.executor.memoryOverhead=2829m,spark.default.parallelism=10,spark.sql.shuffle.partitions=10,spark.shuffle.spill.compress=true,spark.checkpoint.compress=true,spark.io.compresion.codex=snappy,spark.dynamicAllocation=true,spark.shuffle.service.enabled=true' -- gs://$BUCKET_NAME/raw-$TIMESTAMP/ gs://$BUCKET_NAME/transformed-$TIMESTAMP/
```

### 5.  Handle edge-case workload spikes via an autoscaling policy

Now that you have an optimally sized, configured, tuned cluster, you can choose to introduce autoscaling.  This should NOT be seen as a cost-optimization technique.  But it can improve performance during the edge-cases that require more worker nodes.

Use ephemeral clusters (see step 6) to allow clusters to scale up, and delete them when the job or workflow is complete. Downscaling may not be necessary on ephemeral, job/workflow scoped clusters.

- Ensure primary workers make up >50% of your cluster.  Do not scale primary workers.

    - This does increase cost versus a smaller number of primary workers, but this is a tradeoff you can make; stability versus cost.

        - Note: Having too many secondary workers can create job instability. This is a tradeoff you can choose to make as you see fit, but best practice is to avoid having the majority of your workers be secondary.

- Prefer ephemeral clusters where possible.

    - Allow these to scale up, but not down, and delete them when jobs are complete.

    - Set scaleDownFactor to 0.0 for ephemeral clusters.

[Autoscaling clusters | Dataproc Documentation | Google Cloud](https://cloud.google.com/dataproc/docs/concepts/configuring-clusters/autoscaling#how_autoscaling_works)

sample template:

```yaml
workerConfig:
  minInstances: 2
  maxInstances: 2
secondaryWorkerConfig:
  minInstances: 0
  maxInstances: 10
basicAlgorithm:
  cooldownPeriod: 5m
  yarnConfig:
    scaleUpFactor: 1.0
    scaleDownFactor: 0
    gracefulDecommissionTimeout: 0s
```

### 6. Optimize cost and reusability via ephemeral Dataproc clusters

There are several key advantages of using ephemeral clusters:

- You can use different cluster configurations for individual jobs, eliminating the administrative burden of managing tools across jobs.

- You can scale clusters to suit individual jobs or groups of jobs.

- You only pay for resources when your jobs are using them.

- You don't need to maintain clusters over time, because they are freshly configured every time you use them.

- You don't need to maintain separate infrastructure for development, testing, and production. You can use the same definitions to create as many different versions of a cluster as you need when you need them.


sample workflow template:

```yaml
jobs:
- pysparkJob:
    args:
    - "gs://%%BUCKET_NAME%%/raw-%%TIMESTAMP%%/"
    - "gs://%%BUCKET_NAME%%/transformed-%%TIMESTAMP%%/"
    mainPythonFileUri: gs://%%BUCKET_NAME%%/scripts/spark_average_speed.py
  stepId: spark_average_speed
placement:
  managedCluster:
    clusterName: final-cluster-wft
    config:
      gceClusterConfig:
        zoneUri: %%REGION%%-a
      masterConfig:
        diskConfig:
          bootDiskSizeGb: 30
          bootDiskType: pd-ssd
        machineTypeUri: n2-standard-8
        minCpuPlatform: AUTOMATIC
        numInstances: 1
        preemptibility: NON_PREEMPTIBLE
      workerConfig:
        diskConfig:
          bootDiskSizeGb: 30
          bootDiskType: pd-ssd
        machineTypeUri: n2-standard-8
        minCpuPlatform: AUTOMATIC
        numInstances: 2
        preemptibility: NON_PREEMPTIBLE
```

sample workflow template execution

```bash
gcloud dataproc workflow-templates instantiate-from-file \
  --file templates/final-cluster-wft.yml \
  --region $REGION
```


----

## Results

Even in this small scale example. job performance was optimized by 71% (265 seconds -> 75 seconds).  And with a properly sized ephemeral cluster, you only pay for what is necessary.

![Stack-Resources](images/monitoring-job-progress.png)

----

## Next-Steps

To continue striving for maximum optimal performance, please review and consider the guidance laid out in the Google Cloud Blog.

- [Dataproc best practices | Google Cloud Blog](https://cloud.google.com/blog/topics/developers-practitioners/dataproc-best-practices-guide)
- [7 best practices for running Cloud Dataproc in production | Google Cloud Blog](https://cloud.google.com/blog/products/data-analytics/7-best-practices-for-running-cloud-dataproc-in-production)
