# Monitoring GCP Cloud DNS public zone
## Overview
The config files in this repo supports the GCP blogpost on "Visualizing Cloud DNS public zone query data using log-based metrics and Cloud Monitoring".  

### Config files included in this repo
1. [config.yaml](config.yaml)
2. [dashboard.json](dashboard.json)
3. [latency-config.yaml](latency-config.yaml)

###### Note: For details on configuring Cloud Monitoring to monitor GCP cloud DNS public zones, please refer to the blog post.

## Creating the log-based metrics
We require the creation of two distinct log-based metrics: a counter metric and a distribution metric.

* Counter metrics count the number of log entries that match a specified filter within a specified period. For example, we can use a counter metric to count the number of log entries for a specific DNS query name, query type, or response code.
* Distribution metrics also count values, but they collect the counts into ranges of values (histogram buckets). For example, we can use a distribution metric to extract the distribution of server latency.

To create log-based metrics, use the `gcloud logging metrics create` command. The configuration for the logging metrics can be passed to `gcloud` using the [config.yaml](./config.yaml) file. 

**Note:** All [user-defined log-based](https://cloud.google.com/logging/docs/logs-based-metrics#user-metrics) metrics are a class of Cloud Monitoring custom metrics and are subject to charges. For pricing information, please refer to [Cloud Logging pricing: Log-based metrics](https://cloud.google.com/stackdriver/pricing#log-based-metrics).

**Note:** The retention period for log-based metrics is six weeks. Please refer to the [data retention](https://cloud.google.com/monitoring/quotas#data_retention_policy) documentation for more details. 


## **Create the counter metric**

1. Create a file named `config.yaml `with the following content:

    ```
    filter: |-
    resource.type="dns_query"
    resource.labels.target_type="public-zone"
    labelExtractors:
    ProjectID: EXTRACT(resource.labels.project_id)
    QueryName: EXTRACT(jsonPayload.queryName)
    QueryType: EXTRACT(jsonPayload.queryType)
    ResponseCode: EXTRACT(jsonPayload.responseCode)
    TargetName: EXTRACT(resource.labels.target_name)
    metricDescriptor:
    labels:
        - key: QueryName
        - key: TargetName
        - key: ResponseCode
        - key: ProjectID
        - key: QueryType
    metricKind: DELTA
    unit: "1"
    valueType: INT64
    ```


2. To create counter metrics, use the `gcloud logging metrics create` command.

    **Command**
    ```
    gcloud logging metrics create cloud-dns-log-based-metric --config-from-file=config.yaml
    ```

## **Create the distribution metric**

1. Create a file named `latency-config.yaml `with the following content:

    ```
    filter: |
    resource.type="dns_query"
    resource.labels.target_type="public-zone"
    labelExtractors:
    ProjectID: EXTRACT(resource.labels.project_id)
    QueryName: EXTRACT(jsonPayload.queryName)
    QueryType: EXTRACT(jsonPayload.queryType)
    ResponseCode: EXTRACT(jsonPayload.responseCode)
    SourceIP: EXTRACT(jsonPayload.sourceIP)
    TargetName: EXTRACT(resource.labels.target_name)
    metricDescriptor:
    labels:
        - key: ResponseCode
        - key: QueryType
        - key: TargetName
        - key: ProjectID
        - key: SourceIP
        - key: QueryName
    metricKind: DELTA
    unit: "1"
    valueType: DISTRIBUTION
    valueExtractor: EXTRACT(jsonPayload.serverLatency)
    bucketOptions:
    exponentialBuckets:
        growthFactor: 2
        numFiniteBuckets: 64
        scale: 0.01
    ```

 To create counter metrics, use the `gcloud logging metrics create` command.

**Command**

    ```
    gcloud logging metrics create cloud-dns-latency-log-based-metric --config-from-file=latency-config.yaml
    ```



## **Customization options**

The provided customization options are optional and are included for illustrative purposes only. We are not using these options in this blog post. If you decide to use these options in the future, you can edit the log-based metrics to make the desired changes.


### **Include Source IP (Counter Metrics Only)**

To extract the Source IP from the log based metrics, add the following to labelExtractors and metricDescriptor in the `config.yaml` provided above. However, please note that extracting this label comes with risk and would be best suitable for temporary testing or zones where the expected volume of DNS queries is low.

In general, it is best practice to extract labels with a finite set of values. Otherwise, values that come from an infinite set, or are always unique, can lead to [high cardinality of metrics](https://cloud.google.com/monitoring/api/v3/metric-model#cardinality), which can not only increase costs but also result in ingestion errors. 

**Example**

```
labelExtractors:
ProjectID: EXTRACT(resource.labels.project_id)
QueryName: EXTRACT(jsonPayload.queryName)
QueryType: EXTRACT(jsonPayload.queryType)
ResponseCode: EXTRACT(jsonPayload.responseCode)
TargetName: EXTRACT(resource.labels.target_name)
SourceIP: EXTRACT(jsonPayload.sourceIP)

metricDescriptor:
labels:
    - key: QueryName
    - key: TargetName
    - key: ResponseCode
    - key: ProjectID
    - key: QueryType
    - key: SourceIP
```

### **Finetune the filters**

The provided `config.yaml` processes all DNS query logs with a target_type of public-zone. Cloud Logging will process logs for all public zones that have logging enabled. To reduce the number of log entries processed, users can update the filter to provide a specific project or public zones.

**Example**

```
resource.type="dns_query"
resource.labels.target_type="public-zone"
resource.labels.project_id="my-project-id"
resource.labels.target_name="my-zone-name"
```

## **Create the custom dashboard**

Use the `gcloud monitoring dashboards create command` to create the dashboard. This command will create a custom dashboard named gcloud-custom-dashboard.

**Command**

```
gcloud monitoring dashboards create --config-from-file=dashboard.json
```

### **Things to consider**

1. Log-based metrics are not suitable for real-time monitoring or highly sensitive alerts because they have higher ingestion delays than other types of metrics. This is because the ingestion time of the log, the metric processing time, and the reporting time must all be taken into account.
2. There may be a delay in your metric counts.  Due to the potential 10 minute delay for log ingestion, the corresponding log-base metric could also have delays in displaying the correct log count.
3. It is recommended that users change the alignment period to at least 5 minutes when configuring alerts for log-based metrics to account for delays. This will ensure that alerts are triggered only when there is a significant change in the metric, rather than being triggered by minor fluctuations.

## References
- [GCP Cloud DNS](https://cloud.google.com/dns/docs/overview)
- [GCP Cloud DNS log schema](https://cloud.google.com/dns/docs/monitoring)
- [GCP Cloud Monitoring](https://cloud.google.com/monitoring)
- [GCP Log based metrics](https://cloud.google.com/logging/docs/logs-based-metrics)
- [High cardinality of metrics](https://cloud.google.com/monitoring/api/v3/metric-model#cardinality)
- [User-defined log-based](https://cloud.google.com/logging/docs/logs-based-metrics#user-metrics) 
- [Cloud Logging pricing: Log-based metrics](https://cloud.google.com/stackdriver/pricing#log-based-metrics)
- [Data retention](https://cloud.google.com/monitoring/quotas#data_retention_policy) 