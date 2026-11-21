# Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| `add-iam-policy-binding` fails with "Service account ... does not exist" right after creating it | New service accounts take up to a minute to become visible to IAM | Wait and rerun. `01_setup.sh` retries automatically |
| `02_send_sample_requests.sh` says it cannot impersonate a team account | The Token Creator grant has not taken effect, or `CALLER_MEMBER` is empty | Set `CALLER_MEMBER`, rerun `01_setup.sh`, and wait one to two minutes |
| Granting a role fails with "not in permitted organization" | The organization policy `iam.allowedPolicyMemberDomains` blocks members outside your domain | Use an account or group from an allowed domain for `CALLER_MEMBER` |
| `bq add-iam-policy-binding` on a dataset says the feature requires allowlisting | Dataset-level IAM policies through `bq` are not available in every project | Grant access through the dataset's access list, as `01_setup.sh` does (`bq show`, edit `access`, `bq update --source`) |
| The table `aiplatform_googleapis_com_inference_request` does not exist | The sink creates it with the first entry it copies. A new sink takes a few minutes to start | Wait a few minutes after creating the sink, send a request, and check again |
| Entries show in Logs Explorer but not in BigQuery | The sink writer lacks access to the dataset, or the filter does not match | Check that the sink's writer identity has `WRITER` on the dataset, and that the filter names your project ID |
| A query fails with "Field ... not found" for labels or `provisionedthroughput` | BigQuery adds columns only when the first entry with that field arrives | The queries read optional fields with `JSON_VALUE(TO_JSON(...))`, which returns NULL instead. Use the same pattern in your own queries |
| Model calls return `NOT_FOUND` | The model is not offered at that location, or the project has no access to it | Use the location the model is offered in (many Gemini models use `global`) |
| A request with `X-Vertex-AI-LLM-Request-Type: dedicated` returns 429 | It asked for reserved capacity only, and there is no order or the order is full | Remove the header to allow overflow usage, or add capacity. These requests are not billed |
| Cost reports are empty | The billing export takes a day or more to include new usage, or detailed usage cost is off | Check again the next day, and confirm the export is the detailed (resource-level) table |
| Token counts in the billing export look odd | `usage.unit` may say `requests` while `usage.amount` counts tokens | Use `cost` for money and the metadata log for token counts |
| A team appears twice (`team-b` and `Team B`) | Label values are kept exactly as sent | Find them with `label_validation.sql` and fix the caller. Labels must be lowercase |
| Thinking tokens make totals larger than input plus output | Models with thinking report `thoughtsTokenCount` separately | It is billed at the output rate. `usage_by_account.sql` shows it as its own column |
