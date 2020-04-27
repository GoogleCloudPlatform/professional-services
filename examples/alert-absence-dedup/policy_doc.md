## Summary
Time series data is either not being reported or failing to be ingested.

## Impact
We are not confident in the state of the application.

## Triage

### Case 1: All time-series absent
1. Check for any deployments that might indicate a change in the reporting logic.
2. Check whether Stackdriver Monitoring is rejecting metric write requests (e.g.
permissions, out of quota).
3. Check for any Cloud IAM changes (e.g. loss of permission to write metrics for
the critical service accounts).
4. Check for metadata or group definition changes that would change which
sources are monitored by this alert.
5. Check for an outage in Stackdriver Monitoring that might be widely preventing
data ingestion.

### Case 2: At least 1 time-series absent
1. The time series that has gone absent should be able to be identified with
by the chart for metric: ${metric.display_name}.
2. Investigate the specific data sources. The resource type is: ${resource.type}