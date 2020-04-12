# Elasticsearch

## Backend

Using the `Elasticsearch` backend class, you can query any metrics available in
Elasticsearch to create an SLO.

The following methods are available to compute SLOs with the `Elasticsearch`
backend:

* `good_bad_ratio` for computing good / bad metrics ratios.

### Good / bad ratio

The `good_bad_ratio` method is used to compute the ratio between two metrics:

- **Good events**, i.e events we consider as 'good' from the user perspective.
- **Bad or valid events**, i.e events we consider either as 'bad' from the user
perspective, or all events we consider as 'valid' for the computation of the
SLO.

This method is often used for availability SLOs, but can be used for other
purposes as well (see examples).

**Config example:**
```yaml
backend:
  class:          Elasticsearch
  url:            http://localhost:9200
  method:         good_bad_ratio
  measurement:
    index:        test_data
    date_field:   last_updated
    query_good:   {}
    query_bad:
      must:
        term:
          name:   JAgOZE8
```
Optional fields:
  * `date_field`: Alternative field to filter time on. Has to be an ELK `date`
    field. Defaults to `@timestamp` which is the Logstash-generated one.

**&rightarrow; [Full SLO config](../samples/elasticsearch/slo_elk_test_ratio.yaml)**

You can also use the `filter_bad` field which identifies bad events instead of
the `filter_valid` field which identifies all valid events.

The Lucene query entered in either the `query_good`, `query_bad` or
`query_valid` fields will be combined (using the `bool` operator) into a larger
query that filters results on the `window` specified in your Error Budget Policy
steps.

You can specify a different field to filter error budget policy windows on,
using the `date_field` field.

The full `ElasticSearch` query body for the `query_bad` above will therefore
look like:
```json
{
  "query": {
    "bool": {
      "must": {
        "term": {
          "name": "JAgOZE8"
        }
      },
      "filter": {
        "range": {
          "@timestamp": {
            "gte": "now-<window>s/s",
            "lt": "now/s"
          }
        }
      }
    }
  },
  "track_total_hits": true
}
```

### Examples

Complete SLO samples using the `Elasticsearch` backend are available in
[samples/elasticsearch](../samples/elasticsearch). Check them out !
