# Cloud Router Hybrid Subnet reconciler

This is a small Cloud Run function that will:

1) Fetch static IP allocations from one or more projects (and regions),
2) Update the custom announcements on one or more Cloud Routers (with optional filtering)
   for the discovered IPs using `/32` routes.
3) Also update the BGP peers advertised ranges, if enabled.

The function can be triggered based on Eventarc events (such as `google.cloud.vmmigration.*`)
or based on logs (such as creation of static IP address) or on scheduled basis (every 5 minutes).
The method of triggering has no effect on the functionality of the function, it will always 
reconcile all IP addresses.

## Building

Running the application requires a fairly modern Python (tested on 3.13).

## Running

You can run the application locally:

```sh
export RECONCILER_CONFIG='{...}'
pip3 install -r requirements.txt
python3 main.py
curl http://localhost:8080/reconcile
```

For deployment, a sample [Dockerfile](Dockerfile) is supplied.

## Configuration

### IAM permissions

For the function to work, please grant it the following permissions as a custom role through
a service account:

- `compute.addresses.list`
- `compute.addresses.listEffectiveTags`
- `compute.addresses.listTagBindings`
- `compute.addresses.get`
- `compute.networks.updatePolicy`
- `compute.routers.get`
- `compute.routers.getRoutePolicy`
- `compute.routers.list`
- `compute.routers.listBgpRoutes`
- `compute.routers.listEffectiveTags`
- `compute.routers.listRoutePolicies`
- `compute.routers.listTagBindings`
- `compute.routers.update`
- `compute.routers.updateRoutePolicy`
- `compute.regionOperations.get`
- `compute.subnetworks.list`
- `resourcemanager.projects.get`

### Function configuration

Configuration is done via environment variable (`RECONCILER_CONFIG`) and a simple JSON based configuration.

Example:

```json
{
    "project_ids": ["my-project-id"],
    "regions": ["europe-west4"],
    "filter": "addressType=INTERNAL",
    "cloud_routers": [
        {
            "name": "my-cr",
            "region": "europe-west4",
            "project_id": "my-project-id",
            "cidrs": ["10.42.42.0/24"],
            "summarize": true
        }
    ],
    "include_descriptions": false
}
```

### Configuration keys

- `project_ids`: a list of project IDs where to fetch IP addresses from
- `regions`: a list of regions where to fetch IP address from
- `filter`: filters the addresses retrieved (generally specify `addressType=INTERNAL` here) (optional)
- `description_regexp_filter`: filter the addresses by regexp (address description must match regexp) (optional)
- `include_descriptions`: whether to include descriptions when updating Cloud Routers, defaults to false (optional)
- `timeout`: timeout for long running operations, defaults to 60 sec (optional)
- `dry_run`: run in dry-run mode (report, but don't actually do it), defaults to false (optional)
- `cloud_routers`: a list of Cloud Routers to update, with following config keys:
  - `name`: name of the Cloud Router
  - `region`: region where the Cloud Router is located in
  - `project_id`: a project ID where the Cloud Router is in
  - `cidrs`: a list of CIDR ranges that will be used to determine which routes will be reconciled 
    (it's important to set this, otherwise the reconciliation will trash your other custom advertisements)
  - `summmarize`: whether to perform route summarization or not
  - `update_peers`: whether to update all BGP peers as well (defaults to true) (optional)

## Terraform

If you are managing your custom advertisements via Terraform, you'll also need to replicate 
some of the logic on Terraform side, so both sides (the function and Terraform) will agree
on the same set of routes to update. Otherwise next time Terraform runs, it will remove the
updates done by the reconciliation function. You can achieve similar results with the following
Terraform code (note that you have to either disable summarization or use a third party 
Terraform provider to perform summarization):

```hcl
locals {
  project_ids = ["my-project-id"]
  regions = ["europe-west4"]
  address_keys = merge(flatten([for project_id in local.project_ids: { for region in local.regions: format("%s:%s", project_id, region) => { project_id = project_id, region = region } } ])...)
}

data "google_compute_addresses" "addresses" {
  for_each = local.address_keys  
  filter   = "addressType=INTERNAL"
  region   = each.value.region
  project  = each.value.project_id
}

locals {
  address_routes = flatten([ for k, v in data.google_compute_addresses.addresses: [for addr in v.addresses: format("%s/32", addr.address) ] ])
}
```

