# Org Policy Enforcer Check

This tool gives the ability to query all the project ids for which a boolean org
policy `constraint` is not enforced.

It does this by

-   Get the list of project ids using
    `asset_v1p1beta1.AssetServiceClient.search_all_resources` api.
-   Query the effective org policy for the `constraint` using
    `cloudresourcemanager.projects.getEffectiveOrgPolicy` api.

# Usage

This tool can be used as a standalone script. It accepts a few simple
parameters:

-   `--organization:` the GCP organization id for which to fetch the project ids
-   `--constraint` The org policy constraint for which we want to check the
    enforcement.
-   `--to_json` The json file path where to store the project ids.

### Standalone usage

Standalone usage requires a few prerequisite packages, listed in the
`requirements.txt` file. The simplest way to install them is to set up a
virtualenv:

```
virtualenv venv
. venv/bin/activate
pip install -r requirements.txt
```

The script can then be called directly.

### A sample run

```
>>> python org_policy_not_enforced.py \
    --organization="organizations/[YOUR-ORGANIZATION-ID]" \
    --constraint="[ORG-POLICY-CONSTRAINT]" \
    --to_json="[LOCATION-OF-JSON-FILE]"
```

#### Output

A json file at the location `[LOCATION-OF-JSON-FILE]` with the following content

```
{"organization": "organizations/[YOUR-ORGANIZATION-ID]",
"constraint":"[ORG-POLICY-CONSTRAINT]",
"project_ids_with_constraint_not_enforced": ["project-id1", "project-id2"]}
```
