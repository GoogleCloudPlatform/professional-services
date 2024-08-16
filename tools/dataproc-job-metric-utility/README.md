# dataproc-job-metric-utility

----

## Table Of Contents

1. [Use Case](#use-case)
2. [About](#about)
3. [Guide](#guide)

----

## use-case

Collect various metrics for dataproc jobs and store in GCS and BigQuery.

----

## about

This repository contains a python script to collect dataproc job metrics. These metrics provide deeper insight into the performance of Dataproc jobs. The user can compare dataproc job runs with different dataproc job/cluster configurations and property settings. Also helpful when comparing Dataproc jobs with on-prem hadoop, spark, etc. jobs.

This utility can be scheduled via Cloud Functions + Cloud Scheduler, Cloud Workflows, or utilized in an Airflow DAG on Cloud Composer for continuous metric collection and historical analysis.

----

## guide

**project_id**: (required) Google Cloud project ID.

**region**: (required) Google Cloud region where the Dataproc jobs ran.

**bq_dataset**: (required) BigQuery (BQ) dataset to store metrics.

**bq_table**: (required) BQ table to store metrics. will create this table if it does not exist.

**bucket_name**: (required) Google Cloud Storage (GCS) bucket to store metrics data and load objects into BQ from.

**hours**: (optional) Number of previous hours to collect job metrics from. defaults to 24 (1 day).

**blob_name**: (optional) Name of the GCS blob/object. defaults to `dataproc_metrics.json`. Will be prefixed by today's date. example `01012024_dataproc_metrics.json`


### sample usage

```
python3 collect.py \
  --project_id cy-artifacts \
  --region us-central1 \
  --bq_dataset sandbox \
  --bq_table dp_metrics \
  --bucket_name cy-sandbox \
  --hours 480
```

### sample BigQuery table schema

```sql
CREATE TABLE
  `<project>.<dataset>.dataproc_job_metrics` ( yarnMetrics STRUCT<timeouts STRUCT<timeout ARRAY<STRUCT<expiryTime STRING,
    remainingTimeInSeconds INT64,
    type STRING>>>,
    logAggregationStatus STRING,
    clusterUsagePercentage FLOAT64,
    queueUsagePercentage FLOAT64,
    numAMContainerPreempted INT64,
    memorySeconds INT64,
    preemptedResourceVCores INT64,
    runningContainers INT64,
    reservedVCores INT64,
    reservedMB INT64,
    allocatedVCores INT64,
    amRPCAddress STRING,
    preemptedResourceSecondsMap STRING,
    applicationTags STRING,
    elapsedTime INT64,
    diagnostics STRING,
    finishedTime INT64,
    applicationType STRING,
    startedTime INT64,
    priority INT64,
    launchTime INT64,
    amHostHttpAddress STRING,
    unmanagedApplication BOOL,
    id STRING,
    trackingUI STRING,
    trackingUrl STRING,
    masterNodeId STRING,
    allocatedMB INT64,
    progress FLOAT64,
    name STRING,
    numNonAMContainerPreempted INT64,
    state STRING,
    resourceSecondsMap STRUCT<entry STRUCT<value INT64,
    KEY STRING>>,
    vcoreSeconds INT64,
    queue STRING,
    amNodeLabelExpression STRING,
    amContainerLogs STRING,
    preemptedMemorySeconds INT64,
    finalStatus STRING,
    preemptedVcoreSeconds INT64,
    user STRING,
    preemptedResourceMB INT64,
    clusterId INT64>,
    secondaryMachineConfig STRING,
    primaryMachineConfig STRUCT<isSharedCpu BOOL,
    description STRING,
    guestCpus INT64,
    maximumPersistentDisksSizeGb INT64,
    kind STRING,
    name STRING,
    creationTimestamp TIMESTAMP,
    maximumPersistentDisks INT64,
    imageSpaceGb INT64,
    zone STRING,
    memoryMb INT64,
    selfLink STRING,
    id INT64>,
    dataprocClusterConfig STRUCT<metrics STRUCT<yarnMetrics STRUCT<yarnContainersPending INT64,
    yarnVcoresTotal INT64,
    yarnVcoresAvailable INT64,
    yarnMemoryMbAllocated INT64,
    yarnNodesActive INT64,
    yarnMemoryMbReserved INT64,
    yarnNodesDecommissioned INT64,
    yarnContainersAllocated INT64,
    yarnNodesShutdown INT64,
    yarnNodesUnhealthy INT64,
    yarnMemoryMbAvailable INT64,
    yarnAppsCompleted INT64,
    yarnAppsFailed INT64,
    yarnMemoryMbTotal INT64,
    yarnVcoresAllocated INT64,
    yarnMemoryMbPending INT64,
    yarnNodesDecommissioning INT64,
    yarnNodesNew INT64,
    yarnNodesLost INT64,
    yarnAppsRunning INT64,
    yarnVcoresPending INT64,
    yarnAppsKilled INT64,
    yarnAppsPending INT64,
    yarnContainersReserved INT64,
    yarnAppsSubmitted INT64,
    yarnVcoresReserved INT64,
    yarnNodesRebooted INT64>,
    hdfsMetrics STRUCT<dfsNodesRunning INT64,
    dfsBlocksMissing INT64,
    dfsBlocksDefaultReplicationFactor INT64,
    dfsBlocksMissingReplOne INT64,
    dfsNodesDecommissioning INT64,
    dfsCapacityTotal INT64,
    dfsBlocksPendingDeletion INT64,
    dfsCapacityUsed INT64,
    dfsCapacityRemaining INT64,
    dfsNodesDecommissioned INT64,
    dfsBlocksCorrupt INT64,
    dfsCapacityPresent INT64,
    dfsBlocksUnderReplication INT64>>,
    labels STRUCT<airflowVersion STRING,
    googDataprocAutozone STRING,
    googDataprocClusterUuid STRING,
    googDataprocClusterName STRING,
    googDataprocLocation STRING>,
    statusHistory ARRAY<STRUCT<stateStartTime TIMESTAMP,
    state STRING>>,
    config STRUCT<endpointConfig STRUCT<enableHttpPortAccess BOOL,
    httpPorts STRUCT<HDFSNamenode STRING,
    YARNApplicationTimeline STRING,
    SparkHistoryServer STRING,
    Tez STRING,
    YARNResourcemanager STRING,
    MapReduceJobHistory STRING>>,
    encryptionConfig STRUCT<gcePdKmsKeyName STRING>,
    gceClusterConfig STRUCT<subnetworkUri STRING,
    METADATA STRUCT<hiveBigqueryConnectorUrl STRING,
    blockProjectSshKeys BOOL>,
    shieldedInstanceConfig STRUCT<enableIntegrityMonitoring BOOL,
    enableVtpm BOOL,
    enableSecureBoot BOOL>,
    serviceAccount STRING,
    serviceAccountScopes ARRAY<STRING>,
    internalIpOnly BOOL,
    zoneUri STRING>,
    lifecycleConfig STRUCT<idleDeleteTtl STRING>,
    workerConfig STRUCT<minCpuPlatform STRING,
    numInstances INT64,
    diskConfig STRUCT<bootDiskType STRING,
    bootDiskSizeGb INT64>,
    machineTypeUri STRING,
    imageUri STRING,
    preemptibility STRING,
    instanceNames ARRAY<STRING>>,
    metastoreConfig STRUCT<dataprocMetastoreService STRING>,
    masterConfig STRUCT<minCpuPlatform STRING,
    numInstances INT64,
    diskConfig STRUCT<bootDiskType STRING,
    bootDiskSizeGb INT64>,
    machineTypeUri STRING,
    imageUri STRING,
    preemptibility STRING,
    instanceNames ARRAY<STRING>>,
    tempBucket STRING,
    softwareConfig STRUCT<properties STRING,
    imageVersion STRING>,
    initializationActions ARRAY<STRUCT<executionTimeout STRING,
    executableFile STRING>>,
    configBucket STRING>,
    projectId STRING,
    clusterName STRING,
    clusterUuid STRING,
    status STRUCT<stateStartTime TIMESTAMP,
    state STRING>>,
    dataprocJobConfig STRUCT<yarnApplications ARRAY<STRUCT<trackingUrl STRING,
    progress FLOAT64,
    state STRING,
    name STRING>>,
    pysparkJob STRUCT<args ARRAY<STRING>,
    mainPythonFileUri STRING>,
    hiveJob STRUCT<scriptVariables STRUCT<database STRING,
    dbName STRING,
    bqDataset STRING,
    hiveTable STRING,
    bqTable STRING,
    dbLoc STRING,
    projectId STRING,
    databaseLocation STRING>,
    queryFileUri STRING>,
    driverControlFilesUri STRING,
    statusHistory ARRAY<STRUCT<details STRING,
    stateStartTime TIMESTAMP,
    state STRING>>,
    jobUuid STRING,
    done BOOL,
    status STRUCT<stateStartTime TIMESTAMP,
    details STRING,
    state STRING>,
    driverOutputResourceUri STRING,
    pigJob STRUCT<scriptVariables STRUCT<dt INT64,
    db STRING,
    input STRING>,
    properties STRING,
    queryFileUri STRING>,
    placement STRUCT<clusterUuid STRING,
    clusterName STRING>,
    reference STRUCT<jobId STRING,
    projectId STRING>> )
```

### sample BigQuery table query

```sql
SELECT *,
  primaryWorkerCount * primaryWorkerVCores AS totalVCores,
  primaryWorkerCount * primaryWorkerDiskSizeGb AS totalDiskSize,
  primaryWorkerCount * primaryWorkerMemoryMb AS totalMemoryMb
FROM 
(SELECT
  dataprocJobConfig.reference.jobId,
  dataprocJobConfig.reference.projectId,
  dataprocJobConfig.placement.clusterName,
  dataprocJobConfig.statusHistory[0].stateStartTime AS startTime,
  dataprocClusterConfig.config.workerConfig.numInstances AS primaryWorkerCount,
  dataprocClusterConfig.config.workerConfig.machineTypeUri AS primaryWorkerMachineType,
  dataprocClusterConfig.config.workerConfig.diskConfig.bootDiskType AS primaryWorkerDiskType,
  dataprocClusterConfig.config.workerConfig.diskConfig.bootDiskSizeGb AS primaryWorkerDiskSizeGb,
  dataprocClusterConfig.config.masterConfig.numInstances AS masterNodeCount,
  dataprocClusterConfig.config.masterConfig.diskConfig.bootDiskType AS masterNodeDiskType,
  dataprocClusterConfig.config.masterConfig.diskConfig.bootDiskSizeGb AS masterNodeDiskSize,
  dataprocClusterConfig.config.masterConfig.machineTypeUri AS masterNodeMachineType,
  primaryMachineConfig.guestCpus AS primaryWorkerVCores,
  primaryMachineConfig.imageSpaceGb AS primaryWorkerImageSpaceGb,
  primaryMachineConfig.memoryMb AS primaryWorkerMemoryMb,
  yarnMetrics.memorySeconds,
  yarnMetrics.vcoreSeconds,
  yarnMetrics.finishedTime,
  yarnMetrics.elapsedTime,
  yarnMetrics.startedTime,
  yarnMetrics.applicationType,
  yarnMetrics.clusterUsagePercentage,
FROM
  `<project>.<dataset>.dataproc_job_metrics`
)
ORDER BY
  startTime DESC
LIMIT
  1000
```