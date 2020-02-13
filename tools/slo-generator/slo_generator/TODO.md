- Backends:
  - ElasticSearch:
    - [x] Implement working examples
    - [x] Any query expression
    - [x] Allow passing filter_good and filter_valid to ElasticSearch backend
    - [ ] Add tests for ElasticSearch
    - [ ] Add more samples

  - Stackdriver:
    - [x] Allow passing filter_good and filter_valid to Stackdriver Backend
    - [ ] Support new Stackdriver query language (Alpha)
    - [ ] Input latency and compute bucket from bucketization and number of buckets

  - Stackdriver Service Monitoring:
    - [x] Support for Stackdriver Service Monitoring
    - [x] Add new backend to query SLO values from Service Monitoring API and
      translate to slo-generator report structure
      [ ] /!\ Add tests for SSM
    - [ ] /!\ Implement window-based SLIs

    **LIMITATIONS:**
    - [ ] Error Budget Policy steps are limited to multiples of 24 hours - can be limiting for very fast burn alerts on 1 hour or 12 hours.
    - [ ] Cannot run with Service Account credentials, has to use a user account (Note: this might be only for Googlers)
    - [ ] Cannot create SLOs based on GAUGE-type metrics
    - [ ] Cloud Endpoints --> services not pulled automatically and I haven't found a way to manually pull them
    - [ ] Basic Availability SLI --> cannot specify error codes we consider as 'bad' or 'good'

  - Quotas:
    - [ ] Implement Quotas backend or find a way to do it with Stackdriver Monitoring

  - Prometheus:
    - [x] Any query expression
    - [x] Query filter_good / filter_valid
    - [x] Query filter_good / (filter_bad + filter_good)
    - [x] Add tests for Prometheus
    - [ ] Add sample for latency SLOs
    - [ ] /!\ Use `count_over_time` PromQL keyword instead of returning all timeseries (long)

- Error budgets:
  - [ ] Add minimum number of events per error budget policy step (Bruno)

- Exporters:
  - [ ] All: add more custom metrics to export
  - [ ] Add extra fields (annotations) to the SLO report

- Documentation
  - [x] How to use the SLO generator with a custom backend function
  - [x] Examples on how to use each backend / exporter
    - [x] Stackdriver
    - [x] Prometheus
    - [x] ElasticSearch
    - [x] BigQuery
    - [x] PubSub

- General
  - [x] Support multiple SLO configs
  - [x] Allow specifying a folder for SLO config path
