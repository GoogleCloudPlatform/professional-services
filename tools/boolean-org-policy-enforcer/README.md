# Boolean Org Policy Enforcer

This tool enables you to query projects for which a given boolean organization
policy constraint is not in its expected state, and to optionally change the
current state to the expected state for those projects in bulk.

This tool has two parts:

1.  Find all projects for which a given organization policy is not in its
    expected state.
2.  Change the organization policy state to the expected state for the given
    projects in bulk.

## Find all projects for which a given organization policy is not in its expected state

We achieve this with the help of following api

-   Get the list of project ids using
    `asset_v1.AssetServiceClient.search_all_resources` api.
-   Query the effective organization policy for the constraint using
    `cloudresourcemanager.projects.getEffectiveOrgPolicy` api.

This script calls the above apis using a service account. It requires the scope
`https://www.googleapis.com/auth/cloud-platform` on the service account.

Before running this script, you need to take the following actions.

1.  [Create or re-use a service account and download its key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys).
2.  Grant the service account the following roles at **the organization node**.
    1.  [roles/orgpolicy.policyViewer](https://cloud.google.com/iam/docs/understanding-roles#organization-policy-roles")
    2.  [roles/cloudasset.viewer](https://cloud.google.com/asset-inventory/docs/access-control#permissions)
3.  Enable cloudresourcemanager and cloudsasset APIs for the project under which
    you created the service account.
    1.  [Enable cloud resource manager api](https://support.cloudability.com/hc/en-us/articles/360022463493-Enabling-Google-s-Cloud-Resource-Manager-API)
    2.  [Enable cloud asset api](https://console.cloud.google.com/flows/enableapi?apiid=cloudasset.googleapis.com)

### Usage

This tool can be used as a standalone script. It accepts a few simple
parameters:

-   `--organization:` the GCP organization id for which to fetch the project ids
-   `--boolean_constraint:` The organization policy boolean constraint for which
    we want to check the enforcement.
-   `--constraint_expected_state:` The expected state of the boolean constraint
    that should be enforced by organization policy.
-   `--service_account_file_path:` The location of the service account key that
    would be used to generate credentials for api calls.
-   `--to_json:` The json file path where the output project ids will be stored.

#### Standalone usage

Standalone usage requires a few prerequisite packages, listed in the
`requirements.txt` file. The simplest way to install them is to set up a
virtualenv:

```
virtualenv -p=python3 venv
. venv/bin/activate
pip install -r requirement.txt
```

The script can then be called directly.

#### A sample run

```
python org_policy_not_enforced.py \
--organization="organizations/[YOUR-ORGANIZATION-ID]" \
--boolean_constraint="[ORG-POLICY-BOOLEAN-CONSTRAINT]" \
--constraint_expected_state=[Boolean(True or False)] \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
```

#### Output

A json file at the location `[LOCATION-OF-OUTPUT-JSON-FILE]` with the following
content

```
{
    "boolean_constraint": "[ORG-POLICY-CONSTRAINT]",
    "expected_state": [Boolean],
    "organization": "organizations/[YOUR-ORGANIZATION-ID]",
    "project_ids_with_constraint_not_enforced": [
        "project-id1",
        "project-id2"
    ]
}
```

## Change the organization policy state to the expected state in bulk

In this part, we will change the organization policy state in bulk for given
projects.

We achieve this with the help of `cloudresourcemanager.projects.setOrgPolicy`
api that sets the organization policy.

This script calls the above api using a service account. It requires the scope
`https://www.googleapis.com/auth/cloud-platform` on the service account.

### Roles Requirements

To run this section, you **MUST** assign the following role to the service
account that you used in the previous step on the organization node.

1.  [roles/orgpolicy.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#organization-policy-roles")

### Usage

We can use this tool as a standalone script. This tool uses a file that has the
same format as the output of the previous script and enforces the expected state
of the organization policy for the projects provided in the file.

-   `--location_of_projects_with_org_policy_not_enforced:` Location of json file
    path with the following schema

    ```
      {
          "constraint": "[ORG-POLICY-CONSTRAINT]",
          "expected_state": [Boolean],
          "organization": "organizations/[YOUR-ORGANIZATION-ID]",
          "project_with_expected_state_not_enforced": [
              "project-id1",
              "project-id2"
          ]
      }
    ```

    Note that the above schema is same as the output of the previous file.
    However, **you MUST make sure that enforcing the org policy will not break
    any of your GCP workflow.**

-   `--service_account_file_path:` The location of service account key that
    would be used to generate credentials for api calls.

-   `--to_json:` The json file path where to store the set org policy calls.

#### Standalone usage

The standalone usage requires a few prerequisite packages, listed in the
`requirement.txt` file. The simplest way to install them is to set up a
virtualenv as below:

```
virtualenv -p=python3 venv
. venv/bin/activate
pip install -r requirement.txt
```

The script can then be called directly.

#### A sample run

```
python enforce_boolean_org_policy_in_bulk.py \
--location_of_projects_with_org_policy_not_enforced="[FILE-PATH-TO-PROJECT-LOCATION]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
```

A json file at the location `[LOCATION-OF-OUTPUT-JSON-FILE]` with the following
content.

##### Output

```
{
    "new_org_policy": [
        {
            "new_org_policy": {
                "booleanPolicy": {
                    "enforced": boolean_state (true or false)
                },
                "constraint": "boolean_constraint",
                "etag": "",
                "updateTime": ""
            },
            "project_id": "project_id1"
        },
        {
            "new_org_policy": {
                "booleanPolicy": {
                    "enforced": boolean_state (true or false)
                },
                "constraint": "boolean_constraint",
                "etag": "",
                "updateTime": ""
            },
            "project_id": "project_id2"
        }
    ]
}
```

## What can go wrong?

**Problem:** You might not have `virtualenv` installed. \
**Solution:** If you are using Mac or Ubuntu, you can install `virtualenv`
command using the command `pip install virtualenv` For windows 10 user, please
see a possible solution [here](https://cloud.google.com/python/setup#windows).
You can also use [Google Cloud Shell](https://cloud.google.com/shell) that does
not require any installation and come up with virtualenv preinstalled.

**Problem:** You might not have python-3 installed in your system. The possible
error that you can get is while executing the command `virtualenv -p=python3
venv` is that the `python3 path not found.` \
**Solution:**
[Install python3 on ubuntu](https://docs.python-guide.org/starting/install3/linux/),
[Install python3 on Mac](https://docs.python-guide.org/starting/install3/osx/),
[Install python3 on Windows](https://www.python.org/downloads/windows/)

**Problem:** You get permission denied error. \
**Solution:** Please make sure that you assign the role that is recommended
above to the service account.

**Problem:** You get some json decoding error like
`json.decoder.JSONDecodeError: Expecting ',' delimiter:`. \
**Solution:** One possible cause is that your service account key can be
malformed. Please use a different key or correct any obvious formatting issue.

**Problem:** You don't have `cloud asset` and `cloud resourcemanager api`
enabled. \
**Solution:** Please make sure that you follow the instruction in the readme for
enabling the appropriate apis.
