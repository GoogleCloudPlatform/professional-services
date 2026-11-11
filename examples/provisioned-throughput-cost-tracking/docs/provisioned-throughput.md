# Tracking a shared Provisioned Throughput order

This page lists what to check when a Provisioned Throughput order is active in the shared project. The rest of the repository works the same way with or without an order.

## How traffic is billed

| Traffic | When | Billed as | Labels in the billing export |
|---|---|---|---|
| Reserved | Within the throughput you ordered | Part of the fixed fee | No (the fee line has no team labels) |
| Overflow usage | Above the reservation, or for models the order does not cover | Pay-as-you-go prices per token | Yes, the request labels carry through |

Requests use the reservation first. Overflow usage happens automatically unless a request asks for reserved capacity only. See the request headers in the [Provisioned Throughput documentation](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/provisioned-throughput).

## Checklist when an order is active

Run these checks in the first week after the order starts, and again each month.

1. **Order status.** In the Google Cloud console, the Provisioned Throughput page shows the order as active, with the model, region and number of units you bought.
2. **Responses.** Send a request and look at `usageMetadata.trafficType` in the response. It should read `PROVISIONED_THROUGHPUT`. `02_send_sample_requests.sh` prints it in the last column.
3. **Metadata log.** In Logs Explorer, open an `aiplatform.googleapis.com/inference_request` entry for that request. It should show `trafficType: PROVISIONED_THROUGHPUT` and a `provisionedThroughput` object with `ptChargedInputTokenCount`, `ptChargedOutputTokenCount` and `accountingResource` (the project whose order the request drew on).
4. **BigQuery.** Run `sql/usage_by_account_and_traffic_type.sql`. Each account should show `PROVISIONED_THROUGHPUT` rows with `pt_charged_tokens` above zero, and `ON_DEMAND` rows only for overflow usage.
5. **Cloud Monitoring.** Open the Model Garden monitoring dashboard, or chart the Vertex AI provisioned throughput metrics (the throughput limit and consumed throughput for the model). Consumed throughput should stay mostly below the limit.
6. **Billing export, fixed fee.** After the first billing cycle, look for a separate line for the Provisioned Throughput fee in the project. It has no `consumer` label. Note its SKU description so your monthly report can find it.
7. **Billing export, overflow usage.** Gemini usage lines with labels should only appear for overflow usage. If most of your cost is still usage lines, the reservation may be too small or not covering the model you call.
8. **Monthly split.** Run `sql/monthly_allocation.sql` with your contracted fee to split it by the burndown. Add each team's overflow cost from `sql/cost_by_label.sql`.

## Things to consider

- **Which tokens count.** The reservation is consumed by input, output, cached and thinking tokens at different rates for each model. The `ptCharged...` counts in the metadata log already apply those rates, so they are the fairest basis for the fixed fee. Do not apply burndown rates to them a second time.
- **Telling overflow from planned pay-as-you-go.** An `ON_DEMAND` entry with no `provisionedThroughput` object is overflow usage if the request did not ask for pay-as-you-go on purpose (header `X-Vertex-AI-LLM-Request-Type: shared`). The metadata log captures that header, so you can tell them apart.
- **Reserved-only requests.** A request can ask to use reserved capacity only (header `X-Vertex-AI-LLM-Request-Type: dedicated`). When the reservation is full, or there is no order, it is rejected with HTTP 429 instead of billed as overflow usage, and it does not appear in the billing export. The metadata log still records the failure and the account, and `sql/rejected_requests.sql` counts them.
- **Orders and projects.** Orders are bought for a project, and the fee is billed to that project. Check the current documentation for whether your model supports orders that cover more than one project. Until then, keep the shared order in one project and give teams their own identities in it, as this sample does.
- **Models the order does not cover.** Requests to other models are always billed as pay-as-you-go usage, even in the same project. The metadata log covers them too, because the setting is project-wide.
