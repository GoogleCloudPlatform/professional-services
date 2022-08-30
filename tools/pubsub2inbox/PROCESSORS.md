# Processors

## Projects

Permissions:

  - Browser (`roles/browser`) to fetch project details.

Input parameters: 

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| get | list | List of projects for get (either specify `get` or `filter`) |
| filter | string | Search for projects, see [format in filter](https://cloud.google.com/resource-manager/reference/rest/v1/projects/list) |
| indexing | enum | How to index results: `projectId`, `parent` or `list` |
| jinjaFilter | string | Additional Jinja filter to filter projects (output anything to include, output empty to exclude ) |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| projects | varies | List of projects according to desired indexing |

## Budget

Permissions:

  - Billing Account Viewer (`roles/billing.viewer`) to retrieve budget details.
  - Browser (`roles/browser`) to fetch project details.

The budget processor is designed to accept Pub/Sub messages from budget notifications, where part
of the data is passed through the Pub/Sub message attributes (eg. out-side of the message content).

Pub/Sub attributes used:

| Field | Description | 
| ----------- | ----------- |
| budgetId | Budget ID |
| billingAccountID | Billing account ID |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| projects | list | List of projects |
| budget | object | Budget details |
| budget.name | string | Budget name |
| budget.display_name | string | Budget display name |
| budget.cost_amount | float | Current costs |
| budget.cost_interval_start | string | Cost interval start |
| budget.alert_threshold_exceeded | string | |
| budget.forecast_threshold_exceeded | string | |
| budget.credit_types_treatment | string | |
| budget.amount_type | enum | last_period or specified |
| budget.amount_units | string | Current unit |
| budget.amounts_currency_code | string | Currency code |

## Generic JSON

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| data | any | Loads the message body as JSON data |

## Recommendations

Permissions:

  - Organization level:
     - Browser (`roles/browser`) to fetch project details.
     - Compute Recommender Viewer (`roles/recommender.computeViewer`), Firewall
     Recommender Viewer (`roles/recommender.firewallViewer`), IAM Recommender
     Viewer (`roles/recommender.iamViewer`), Product Suggestion Recommender
     Viewer (`roles/recommender.productSuggestionViewer`), Viewer of Billing 
     Account Usage Commitment Recommender (`roles/recommender.billingAccountCudViewer`)
     and/or Project Usage Commitment Recommender Viewer (`roles/recommender.projectCudViewer`).
     If you want billing account level recommendations, also add Billing Account Viewer
     (`roles/billing.viewer`) and Billing Account Usage Commitment Recommender Viewer
     (`roles/recommender.billingAccountCudViewer`) on the billing account
     itself.
  - Quota project:
     - Compute Viewer (`roles/compute.viewer`)
  - If writing to a bucket, `roles/storage.objectAdmin` on the bucket.

Input parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| quota_project_id | string | Project to issue API calls against (Compute Engine and Recommender API) |
| fetch_recommendations | bool | Fetch the configured recommender_types from the API |
| fetch_insights | bool | Fetch the configured insights_types from the API |
| recommender_types | list | List of recommenders that will be queried from the API - for full supported list, see the processor code |
| recommendation_filter | string | Filter recommendations (eg. active, closed) |
| insights_types | list | List of insights that will be queried from the API |
| insight_filter | Filter insights (eg. active, closed) |
| projects | list | List of project IDs where to fetch recommendations/insights from |
| organizations | list | List of organizations where to fetch recommendations (note that specifying organization ID does not mean recommendations are fetched from all projects in the organization - it means recommendations pertaining to the organization node) |
| folders | list | List of folders for fetching recommendations (see above about org) |
| billingAccounts | list | List of billing accounts for fetch recommendations (see above about org) |
| locations | list | Locations where to fetch recommendations from (eg. global, eu, us, specific zones). If you want to fetch eg. rightsizing recommendations for VMs, specify the zones here. Supports wildcards, like `europe-north1*` |
| vars | object | Additional parameters are registered and become available through Jinja expansion |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| recommendations | list | List of recommendations (see [format](https://cloud.google.com/recommender/docs/reference/rest/v1/billingAccounts.locations.recommenders.recommendations#Recommendation)) |
| insights | list | List of insights (see [format](https://cloud.google.com/recommender/docs/reference/rest/v1/billingAccounts.locations.insightTypes.insights#Insight)) |
| recommendations_rollup | object | Roll up of recommendations per parent (eg. `recommendations_rollup[parent][subtype] = { link: "...", parent: "...", type: "...", count: 123, cost: { currency_code: "...", nanos: 123, units: 456} }`) |
| insights_rollup | object | Roll up of insights per parent (eg. `insights_rollup[parent][subtype] = { link: "...", parent: "...", type: "...", count: 123 }`) |

## Security Command Center

Permissions:

  - Browser (`roles/browser`) to fetch project details.
  - `roles/securitycenter.findingsEditor` and `roles/securitycenter.findingSecurityMarksWriter` for writing
    findings to a custom SCC source.
  - Network Viewer (`roles/compute.networkViewer`) for Cloud IDS network ID resolving.

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| organization | string | Organization ID |
| projects | string | Expanded projects (see project format at the end) |
| finding | object | Findings details from SCC |

## Groups

Permissions:

  - Groups: `Groups Reader` permission in Google Workspace for the service account.

Input parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| serviceAccountEmail | string | Service account to use for getting scoped tokens (needs Groups Reader access in Workspace) |
| query | string | Query for searching groups (see [format](https://cloud.google.com/identity/docs/reference/rest/v1/groups/search)) |
| filter | string | Regular expression for filtering groups |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| all_groups | object | All groups indexed by group email, format is output from Cloud Identity API with added field `memberships` |
| groups_by_owner | object | All groups indexed by the owner(s) |
| groups_by_manager | object | All grups indexed by the manager |

## Directory

Permissions:

  - Groups: `Groups Reader` permission in Google Workspace for the service account for groups. 

Input parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| api | enum | Type of API to call: groups, users, members, groupsettings |
| groupUniqueIds | string | Group unique ID when calling groupsettings |
| groupKey | string | Group key (group email address) when fetching members |
| query | string | Query when searching [users](https://developers.google.com/admin-sdk/directory/v1/guides/search-users) or [groups](https://developers.google.com/admin-sdk/directory/v1/guides/search-groups) |
| customerId | string | Customer (directory ID) ID when searching users or groups |
| domain | string | Domain when searching for users or groups |
| orderBy, sortOrder, maxResults, projection, showDeleted, viewType, customFieldMask, roles | varies | Additional parameters for searching groups and users |

## Monitoring

Permissions:

  - Monitoring Viewer (`roles/monitoring.viewer`)

Input parameters: 

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| timeSeries | list | List of time series to query |
| pageSize | number | Page size for query (defaults to `10`) |
| project | string | Project (Metrics Scope host) to query |
| key | string | Key to index results by |
| query | string | MQL query for |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| time_series | object | List of fetched timeseries |

## Cloud Asset Inventory

Permissions:

  - Cloud Asset Viewer (`roles/cloudasset.viewer`) on the correct level.

Input parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| parent | string | Parent for querying the CAI API |
| readTime | string | Snapshot time for CAI (optional) |
| pageSize | number | Amount of objects to read at once |
| contentType | string | Content type for query (set to `resource` to get all information) |
| indexing | enum | How to index the results: `asset_type` (by asset type), `list` (simple list) |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| assets | object or list | List of found assets |

## BigQuery

Permissions:

  - BigQuery Job User (`roles/bigquery.jobUser`) and BigQuery Data Viewer
    (`roles/bigquery.dataViewer`) to read data.
 
Input parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| query | string | BigQuery query |
| dialect | enum | Query dialect: legacy or standard (defaults to standard) |
| project | string | Project to issue BigQuery queries against |
| labels | object | Labels for the BigQuery query |

Output parameters:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| records | list | List of found records |

## Common

### Expanded project list

Many processors expand a project list which may be list of project IDs or numbers, the format is:

| Field | Type | Description |
| ----------- | ----------- | ----------- |
| projects | list | List of projects in format: `[projectId, projectNumber, projectDisplayName, projectLabels]` |
