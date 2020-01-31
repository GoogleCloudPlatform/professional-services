# Pub/Sub

## Exporter

The Pub/Sub exporter will export SLO reports to a Pub/Sub topic, in JSON format.

This allows teams to consume SLO reports in real-time, and take appropriate actions when they see a need.

### Example

> We want to consume SLI value in real-time and compare it with the previous version for the same application
>
> -- <cite>Application Developer</cite>

```yaml
exporters:
  - class: Pubsub
    project_id: "${PUBSUB_PROJECT_ID}"
    topic_name: "${PUBSUB_TOPIC_NAME}"
```
