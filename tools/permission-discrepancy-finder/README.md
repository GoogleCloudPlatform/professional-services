# Permission Discrepency Finder

Imagine a scenario where a user, in order to accompalish a task in GCP, needs a
set of IAM permissions P1 on a project, as well as a complementary set of
permissions P2 on a resource R within that project. For example, to create a VM,
the user needs compute.instances.create permissions on the project, but also
needs the iam.serviceaccounts.actas permission on the service account that is
associated with the VM . This tool helps you find principals who have permission
P1 on a given set of projects but are missing the permission P2 on resources
within those projects. The inputs are: project ids, permissions set P1,
permissions set P2, resource R. The outputs are: projects ids, resource names
and users who have permissions set 1 but not permissions set 2.

The tool has two parts:

1.  First, we find users or groups who have permission P1 on a project but are
    missing a permission P3 on a resource within the project.
2.  Then, we assign those principals the permission P3 on resource R. **However,
    it is imperative for the security admins to make sure that they are NOT
    granting sensitive permissions to users without doing proper
    investigation.**

The detailed description of these two parts is below.

## Find the users not having the both set of permissions.

It is done by

-   First get all projects that have the desired resource R that we are
    intersted in. This is done by using policy analyzer api --
    asset_v1p1beta1.AssetServiceClient.search_all_resources.
-   Then find the set of users who have a desired set of permissions on the
    project. This is done by using policy analyzer api --
    `asset_v1p4beta1.AssetServiceClient.analyze_iam_policy`.
-   Then find the set of users who have the desired complementary set of
    permissions on the resource. This is done by using policy analyzer api
    asset_v1p4beta1.AssetServiceClient.analyze_iam_policy.
-   Finally taking the set diff of the users found in step-2 to users found in
    step-3 to find the users who don't the complementary set of permissions to
    use the resource properly.

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

-   `--resource:` the regex for the resource. For example to find the users who
    do not have a set of permissions on compute default service account, you can
    use a regex "(\*-compute@developer.gserviceaccount.com\*)" for the compute
    default service account.

-   `--project_permissions:` A comma-separated list of the permissions that
    users should have on projects.

-   `--resource_permissions:` A comma-separated list of complementary
    permissions that users should have on resources.

-   `--project_ids_location:` Location of json file path with the following
    schema containing the project ids.

    ```
      {
          "project_ids": [
              "project-id1",
              "project-id2"
          ]
      }
    ```

    This flag will enforce the script to do the analysis only for the given
    project ids.

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
--resource="[RESOURCE-REGEX]" \
--project_permissions="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-PROJECT]" \
--resource_permission="[COMMA-SEPARATED-LIST-OF-PERMISSIONS-OF-RESOURCE]" \
--project_ids_location="[LOCATION-OF-JSON-FILE-WITH-INTERESTING-PROJECT-IDS]" \
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
            "users_with_missing_permissions": [
                "group:abc@xyz.com",
                "user:def@xyz.com",
                "user:ghi@xyz.com"
            ]
        },
        {
            "project_id": "project-id2",
            "resource": "resource-2",
            "users_with_missing_permissions": [
                "user:def@xyz.com"
            ]
        }
    ]
}
```

## Grant roles to impacted users

This part grants the appropriate roles to users with insufficient permissions at
the resource level. Currently, we only support the resource to be a service
account.

### Roles Requirements

To run this section, you **MUST** assign the following role to the service
account that you used in the previous step on the organization node.

1.  [roles/iam.securityAdmin](https://cloud.google.com/iam/docs/understanding-roles#iam-roles)

## Usage

You can use this tool as a standalone script. This tool uses a file that has the
same format as the output of the previous script and grants the given role to
the the users that have insufficient permission at the resource.

-   `--role:` The role that should be granted to the users with insufficient
    permissions.
-   `--projects_location:` Location to json file having the same format as the
    output of the previous script.

    ```
    {
        "projects": [
            {
                "project_id": "project-id1",
                "resource": "resource-1",
                "users_with_missing_permissions": [
                    "group:abc@xyz.com",
                    "user:def@xyz.com",
                    "user:ghi@xyz.com"
                ]
            },
            {
                "project_id": "project-id2",
                "resource": "resource-2",
                "users_with_missing_permissions": [
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
command using the command `pip install virtualenv` For windows-10 user, please
see a possible solution
[here](https://www.liquidweb.com/kb/how-to-setup-a-python-virtual-environment-on-windows-10/)

**Problem:** You might not have python-3 installed in your system. The possible
error that you can get is while executing the command `virtualenv -p=python3
venv` is that the `python3 path not found.` \
**Solution:**
[Install on ubuntu](https://docs.python-guide.org/starting/install3/linux/),
[Install on Mac](https://docs.python-guide.org/starting/install3/osx/),
[Install on Windows](https://www.python.org/downloads/windows/)

**Problem:** You get permission denied error. \
**Solution:** Please make sure that you assign the role that is recommended
above to the service account.

**Problem:** You get some json decoding error like
`json.decoder.JSONDecodeError: Expecting ',' delimiter:`. **Solution:** One
possible cause is that your service account key can be malformed. Please use a
different key or correct any obvious formatting issue.

**Problem:** You don't have `cloud asset` and `resourcemanager api` enabled. \
**Solution:** Please make sure that you follow the instruction in the readme for
enabling the appropriate apis.
