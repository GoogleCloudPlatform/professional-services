# Pub/Sub

## Exporter

The `Pubsub` exporter will export SLO reports to a Pub/Sub topic, in JSON format.

This allows teams to consume SLO reports in real-time, and take appropriate
actions when they see a need.

**Example config:**

```yaml
exporters:
  - class: Pubsub
    project_id: "${PUBSUB_PROJECT_ID}"
    topic_name: "${PUBSUB_TOPIC_NAME}"
```

**&rightarrow; [Full SLO config](../samples/stackdriver/slo_pubsub_subscription_throughput.yaml)**
