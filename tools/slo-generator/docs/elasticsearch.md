# Elasticsearch

## Backend

Using the `Elasticsearch` backend class, you can query any metrics available in Elasticsearch to create an SLO.

The following methods are available to compute SLOs with the `Elasticsearch` backend:

* `good_bad_ratio` for computing good / bad metrics ratios.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user perspective, or all events we consider as 'valid' for the computation of the SLO.

This method is often used for availability SLOs, but can be used for other purposes as well (see examples).

### Examples

Complete examples using the `Elasticsearch` backend are available in the `samples/` folder:

- [slo_elk_test_good_bad.yaml](../samples/slo_sd_pubsub_throughput.yaml)
