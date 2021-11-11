# Permission Discrepency Finder

Imagine a scenario where a user, in order to accompalish a task in GCP, needs a
set of IAM permissions P1 on a project, as well as a complementary set of
permissions P2 on a resource R within that project. For example, to create a VM,
the user needs compute.instances.create permission on the project, but also
needs the iam.serviceaccounts.actas permission on the service account that is
associated with the VM . This tool helps you find principals who have permission
P1 on a given set of projects but are missing the permission P2 on resources
within those projects. The inputs are: project ids, permissions set P1,
permissions set P2, resource R. The outputs are: projects ids, resource names
and principals who have permissions set P1 but not permissions set P2.

The tool has two parts:

1.  First, we find principals who have permission set P1 on a project but are
    missing a complementary set of permission P2 on a resource R within the
    project.
2.  Then, we assign those principals the permission P2 on resource R.

## Find the principals not having the both set of permissions

It is done by

-   First get all projects that have the desired resource R. This is done by
    using policy analyzer api --
    `asset_v1p1beta1.AssetServiceClient.search_all_resources`.
-   Then find the set of principals who have a desired set of permissions on the
    project. This is done by using policy analyzer api --
    `asset_v1p4beta1.AssetServiceClient.analyze_iam_policy`.
-   Then find the set of principals who have the desired complementary set of
    permissions on the resource. This is done again by using policy analyzer api
    `asset_v1p4beta1.AssetServiceClient.analyze_iam_policy`. Note that currently
    not all resources are supported by cloud asset analyzer. Please see the list
    of supported resources
    [here](https://cloud.google.com/asset-inventory/docs/supported-asset-types#analyzable_asset_types).
-   Finally taking the set diff of the principals found in step-2 to principals
    found in step-3 to find the principals who don't the complementary set of
    permissions to use the resource properly.

This script calls the above apis using a service account. It requires the scope
`https://www.googleapis.com/auth/cloud-platform` on the service account.

Before running this script, you need to take the following actions.

1.  [Create or re-use a service account and download it's key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys).
2.  Grant the service account following roles at **the organization node**.
    1.  [roles/iam.securityReviewer](https://cloud.google.com/iam/docs/understanding-roles#iam-roles)
    2.  [roles/cloudasset.viewer](https://cloud.google.com/asset-inventory/docs/access-control#permissions)
3.  [Enable cloudsasset API](https://console.cloud.google.com/flows/enableapi?apiid=cloudasset.googleapis.com)
    for the project under which you created the service account.

### Usage

This tool can be used as a standalone script. It accepts a few simple
parameters:

-   `--organization:` the GCP organization id for which to fetch the project
    ids.

-   `--resource:` the query for the resource. For example to find the principals
    who do not have a set of permissions on compute default service account, you
    can use a regex "\*-compute@developer.gserviceaccount.com*" for the compute
    default service account. Please see here about how to construct a query for
    a resource. https://cloud.google.com/asset-inventory/docs/query-syntax
    credentials: client credentials.

-   `--project_permissions:` A comma-separated list of the permissions that
    principals should have on projects.

-   `--resource_permissions:` A comma-separated list of complementary
    permissions that principals should have on resources.

-   `--project_ids_location:` [OPTIONAL] Location of json file path with the
    following schema containing the project ids.

    ```
      {
          "project_ids": [
              "project-id1",
              "project-id2"
          ]
      }
    ```

    This flag is optional and will enforce the script to do the analysis only
    for the given project ids.

-   `--service_account_file_path:` The location of the service account key that
    would be used to generate credentials for api calls.

-   `--log:` [OPTIONAL] The granularity of the log level. The supported values
    are: DEBUG, INFO, WARNING, ERROR, CRITICAL.

-   `--to_json:` The json file path to store the output.

### Standalone usage

Standalone usage requires a few prerequisite packages, listed in the
`requirement.txt` file. The simplest way to install them is to set up a
virtualenv:

```
virtualenv -p=python3 venv
. venv/bin/activate
pip install -r requirement.txt
```

The script can then be called directly.

### A sample run

```
python permission_discrepancy_finder.py \
--organization="organizations/[YOUR-ORGANIZATION-ID]" \
--resource="[RESOURCE-QUERY]" \
--project_permissions="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-PROJECT]" \
--resource_permission="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-RESOURCE]" \
--project_ids_location="[LOCATION-OF-JSON-FILE-WITH-INTERESTING-PROJECT-IDS (OPTIONAL)]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--log="[LOG-SEVERITY-LEVEL] (OPTIONAL)" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
```

#### Output

A json file at the location `[LOCATION-OF-OUTPUT-JSON-FILE]` with the following
content.

```
{
    "projects": [
        {
            "project_id": "project-id1",
            "resource": "resource-1",
            "principals_with_missing_permissions": [
                "group:abc@xyz.com",
                "user:def@xyz.com",
                "user:ghi@xyz.com"
            ]
        },
        {
            "project_id": "project-id2",
            "resource": "resource-2",
            "principals_with_missing_permissions": [
                "user:def@xyz.com"
            ]
        }
    ]
}
```

## Grant role

This part grants the given role to principals with missing permissions at the
resource level. Currently, we only support the resource to be a service account.

We achieve this with the help of `iam_v1.projects.serviceAccounts.setIamPolicy`
api that sets the iam policy on a service account.

This script calls the above apis using a service account. It requires the scope
`https://www.googleapis.com/auth/cloud-platform` on the service account.

### Roles Requirements

To run this section, you **MUST** assign the following role to the service
account that you used in the previous step on the organization node.

1.  [roles/iam.securityAdmin](https://cloud.google.com/iam/docs/understanding-roles#iam-roles)

## Usage

You can use this tool as a standalone script. This tool uses a file that has the
same format as the output of the previous script and grants the given role to
the the principals that have missing permission at the resource.

-   `--role:` The role that should be granted to the principals with missing
    permissions.
-   `--projects_location:` Location to json file having the same format as the
    output of the previous script.

    ```
    {
        "projects": [
            {
                "project_id": "project-id1",
                "resource": "resource-1",
                "principals_with_missing_permissions": [
                    "group:abc@xyz.com",
                    "user:def@xyz.com",
                    "user:ghi@xyz.com"
                ]
            },
            {
                "project_id": "project-id2",
                "resource": "resource-2",
                "principals_with_missing_permissions": [
                    "user:def@xyz.com"
                ]
            }
        ]
    }
    ```

-   `---to_json:` the json file path to store the location of the output.

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
python grant_role.py \
--role="[ROLE-TO-BE-GRANTED-TO-USERS]" \
--projects_location="[LOCATION-OF-PROJECT-DATA-CONTAING-USER-AND-RESOURCE-INFORMATION]" \
--service_account_file_path="[FILE-PATH-TO-SERVICE-ACCOUNT]" \
--to_json="[LOCATION-OF-OUTPUT-JSON-FILE]"
```

#### Output

A JSON file at the location containing the content similar as below.

```
{
    "new policy on resource": [
        {
            "new_policy": {
                "bindings": [
                    {
                        "members": [
                            "user:member-1",
                            "user:member-2",
                        ],
                        "role": "ROLE-TO-BE-GRANTED-TO-USERS"
                    }
                ],
            },
            "resource": "project-id-1-resource"
        },
        {
            "new_policy": {
                "bindings": [
                    {
                        "members": [
                            "user:member-3"
                        ],
                        "role": "ROLE-TO-BE-GRANTED-TO-USERS"
                    }
                ],
            },
            "resource": "project-id-2-resource"
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

**Problem:** You don't have `cloud asset` and `resourcemanager api` enabled. \
**Solution:** Please make sure that you follow the instruction in the readme for
enabling the appropriate apis.
