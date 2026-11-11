# How Gemini usage appears in the billing export

These notes describe what a Cloud Billing export with **detailed usage cost** shows for Gemini requests that carry labels. Figures are illustrative.

## Timing

- New usage can take **a day or more** (often around a day and a half) to appear. The metadata log has the same requests within minutes, so use it for daily checks and the billing export for the monthly report.
- Query with a `_PARTITIONTIME` filter a few days wider than the period you report on, then filter on `usage_start_time`.

## What a labelled request produces

- **Separate lines for input and output.** Each Gemini model has its own SKUs, such as `Gemini <model> Text Input - Predictions` and `... Text Output - Predictions`. Thinking tokens are billed on the output line.
- **Your labels on every costed line.** A request with `labels={"consumer": "team-a"}` puts `consumer = team-a` on both its input and output lines.
- **An automatic location label.** Google adds `goog-vertex-api-location` (for example `global`). Ignore it in team reports.
- **Unit names.** `usage.unit` may say `requests` while `usage.amount` counts tokens. Use `cost` for money and the metadata log for token counts.

## Label behavior to plan for

| What happens | Result in the export | What to do |
|---|---|---|
| Request has no labels | Cost lands on lines with no `consumer` label | Track the share with `unattributed_cost.sql`, and fix the caller |
| Label value has a typo (`Team B`) | Kept exactly as sent, as its own team | Find typos with `label_validation.sql` against an allowed list |
| Label key has different case (`Consumer`) | A separate key | Same check. Labels must be lowercase |
| Request rejected (for example HTTP 429) | No line at all | Nothing to charge. Count rejections in Cloud Monitoring |

Label rules: up to 64 labels per request; keys and values up to 63 characters; lowercase letters, numbers, underscores and dashes; keys start with a letter.

## Token share is not cost share

Input, output and thinking tokens have different prices, and so do models. In one example, a team that sent long prompts and got short answers used about 70% of the tokens but only about 35% of the cost. Use token share for the reserved-capacity fee, and the billing export's `cost` for overflow usage.

## Useful queries

- [`sql/cost_by_label.sql`](../sql/cost_by_label.sql): cost per team label and SKU.
- [`sql/unattributed_cost.sql`](../sql/unattributed_cost.sql): daily share of Gemini cost with no team label.
- [`sql/label_validation.sql`](../sql/label_validation.sql): label keys and values that are not on your allowed list.
