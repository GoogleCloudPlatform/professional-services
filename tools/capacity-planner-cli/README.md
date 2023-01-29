# Capacity Planner CLI

This tool is a stand-alone tool to extract peak resource usage values and corresponding timestamps for a given GCP project, time range and timezone.


## Usage

You should run the following command to acquire the Application Default Credentials (ADC). Alternatively you may want to configure `GOOGLE_APPLICATION_CREDENTIALS` environment variable to use your service accounts to avoid hitting lower quota with ADC.

```
gcloud auth application-default login
```

```
% pip install -r requirements.txt
% python capacity_planner.py --help
Usage: capacity_planner.py [OPTIONS]

Options:
  --project_id TEXT               GCP project ID where the Cloud Monitoring
                                  API is called against.  [required]
  --end_time [%Y-%m-%dT%H:%M:%S%z]
                                  The end time in ISO 8601 format of the time
                                  interval for which           results should
                                  be returned. Default is now.           e.g.
                                  2022-10-03T05:23:02+09:00
  --duration_minutes INTEGER      The number of minutes in the time interval
                                  ending at the time           specified with
                                  --end_time. Default is 360 minutes (6
                                  hours).
  --output FILE                   The CSV file path for writing the results
                                  out.           Default is logs/result.csv
  --help                          Show this message and exit.
```


## Example

The following command will produce a CSV file in `logs/result.csv`.

```
python capacity_planner.py --project_id my-awesome-project --end_time '2022-10-15T18:30:00+09:00' --duration_minutes 60
```


| product_name<br>NaN    | metric_name<br>NaN            | metrics<br>resource.region | <br>unit | <br>resource.location | value<br>NaN | time<br>NaN               |
| ---------------------- | ----------------------------- | -------------------------- | -------- | --------------------- | ------------ | ------------------------- |
| HTTP(S) Load Balancing | QPS                           | global                     | 1/s      | NaN                   | 597460.0833  | 2022-10-15 17:59:00+09:00 |
| HTTP(S) Load Balancing | Ingress Gbps                  | global                     | Gibit/s  | NaN                   | 0.596731     | 2022-10-15 18:00:00+09:00 |
| HTTP(S) Load Balancing | Egress Gbps                   | global                     | Gibit/s  | NaN                   | 30.82214     | 2022-10-15 17:59:00+09:00 |
| TCP/UDP Load Balancing | Ingress Gbps                  | asia-northeast1            | Gibit/s  | NaN                   | 0.000047     | 2022-10-15 17:41:00+09:00 |
| TCP/UDP Load Balancing | Egress Gbps                   | asia-northeast1            | Gibit/s  | NaN                   | 0.000049     | 2022-10-15 18:04:00+09:00 |
| Cloud CDN              | QPS                           | global                     | 1/s      | NaN                   | 528772.95    | 2022-10-15 17:59:00+09:00 |
| Cloud CDN              | Egress Gbps                   | NaN                        | Gibit/s  | NaN                   | 30.760505    | 2022-10-15 17:59:00+09:00 |
| Cloud Pub/Sub          | Publisher QPS                 | NaN                        | 1/s      | NaN                   | 4993.98333   | 2022-10-15 17:59:00+09:00 |
| Cloud Pub/Sub          | Publisher Throughput MB/s     | NaN                        | MiBy/s   | NaN                   | 69.290791    | 2022-10-15 17:59:00+09:00 |
| Cloud Pub/Sub          | Subscriber Pull QPS           | NaN                        | 1/s      | NaN                   | 9.7          | 2022-10-15 18:03:00+09:00 |
| Cloud Pub/Sub          | Subscriber Streaming Pull QPS | NaN                        | 1/s      | NaN                   | 791.016667   | 2022-10-15 18:07:00+09:00 |
| Cloud Pub/Sub          | Subscriber Throughput MB/s    | NaN                        | MiBy/s   | NaN                   | 13.703873    | 2022-10-15 18:03:00+09:00 |
| Cloud BigTable         | QPS                           | NaN                        | 1/s      | NaN                   | 91465.68333  | 2022-10-15 17:59:00+09:00 |
| Cloud BigTable         | Ingress MB/s                  | NaN                        | MiBy/s   | NaN                   | 19.882619    | 2022-10-15 17:59:00+09:00 |
| Cloud BigTable         | Egress MB/s                   | NaN                        | MiBy/s   | NaN                   | 1340.307562  | 2022-10-15 17:59:00+09:00 |
| Cloud Storage          | QPS                           | NaN                        | 1/s      | asia                  | 249.416667   | 2022-10-15 18:19:00+09:00 |
| Cloud Storage          | QPS                           | NaN                        | 1/s      | asia-northeast1       | 0.266667     | 2022-10-15 17:36:00+09:00 |
| Cloud Storage          | QPS                           | NaN                        | 1/s      | us-central1           | 0.766667     | 2022-10-15 18:04:00+09:00 |
| Cloud Storage          | Egress MiB/s                  | NaN                        | MiBy/s   | asia                  | 213.693089   | 2022-10-15 17:40:00+09:00 |
| Cloud Storage          | Egress MiB/s                  | NaN                        | MiBy/s   | asia-northeast1       | 1.965136     | 2022-10-15 17:36:00+09:00 |
| Cloud Storage          | Egress MiB/s                  | NaN                        | MiBy/s   | us-central1           | 1.952456     | 2022-10-15 18:21:00+09:00 |


## Customize queries

You can add/remove/modify the `queries.toml` to customize queries to obtain other Cloud Monitoring metrics. One of the easiest ways is to use the Metrics Explorer to develop MQL queries for your purpose, and then you can copy the MQL queries to the `query` parameter in the `queries.toml` file.

For units conversion (`scale()`), see below.
https://cloud.google.com/monitoring/mql/reference#unit-code-def


### Basic structure

The `queries.toml` configuration file consists of products and metrics.

```
[product_a]
    product_name = "Product Name"

    [product_a.metric_1]
    metric_name = "metric_name_1"
    query = """your MQL query comes here"""

    [product_a.metric_2]
    metric_name = "metric_name_2"
    query = """your MQL query comes here"""

    ...

[product_b]
    product_name = "Product Name"

    [product_b.metric_1]
    metric_name = "metric_name_1"
    query = """your MQL query comes here"""

    [product_b.metric_2]
    metric_name = "metric_name_2"
    query = """your MQL query comes here"""

...

```

### Example

Here shows some example configurations for HTTP(S) Load Balancing.

```
[l7xlb]
    product_name = "HTTP(S) Load Balancing"

    [l7xlb.qps]
    metric_name = "QPS"
    query = """fetch https_lb_rule
        | metric 'loadbalancing.googleapis.com/https/request_count'
        | align rate(1m)
        | every 1m
        | group_by [resource.region], [value_requst_count_aggregate: aggregate(value.request_count)]"""

    [l7xlb.ingress]
    metric_name = "Ingress Gbps"
    query = """fetch https_lb_rule
        | metric 'loadbalancing.googleapis.com/https/request_bytes_count'
        | align rate(1m)
        | every 1m
        | group_by [resource.region], [value_requst_bytes_count_aggregate: aggregate(value.request_bytes_count)]
        | scale('Gibit/s')"""

    [l7xlb.egress]
    metric_name = "Egress Gbps"
    query = """fetch https_lb_rule
        | metric 'loadbalancing.googleapis.com/https/response_bytes_count'
        | align rate(1m)
        | every 1m
        | group_by [resource.region], [value_response_bytes_count_aggregate: aggregate(value.response_bytes_count)]
        | scale('Gibit/s')"""
```


## How to run tests

To test the code, you can do so by simply running:

```
% pip install -r test_requirements.txt
% pytest
```

`tests` folder has a sample data named `dump.json` for testing already, but if you would like to test with your original data, you can generate it by running:

```
% python tools/dump_query_result.py --project_id your-awesome-project-id --duration_minutes 180 --end_time '2023-01-12T00:30:00+09:00' --output tests/dump.json
```

`dump_query_result.py` retrieves `loadbalancing.googleapis.com/https/request_count` metric from your environment, but if you also would like to use another metric, you can change the `query` parameter accordingly.
