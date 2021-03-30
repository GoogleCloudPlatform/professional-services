# GCP Quota Updater
The [quota.py](./quota.py) module updates the service quotas programmatically by calling the *serviceusage.googleapis.com*.

### Why?
To update the quotas, you have two options, either manually from cloud console or via API calls.
In console, you visit the quota page under IAM section. If you have 100s of projects, manual does not scale.

### How?
Each service has a unique name/parent to identify it.
Each quota limit has a default value for all consumers, set by the service owner.
As explained [here](https://cloud.google.com/service-usage/docs/manage-quota),
this default value can be changed by a quota *override* action. So when you update a quota,
in fact you are creating a "consumerOverride" or "adminOverride" object.
The difference between consumer and admin is explained
[here](https://cloud.google.com/service-usage/docs/service-quota-model#computing_quota_limit).
In this module, we have only used consumer one since most of the quotas are per project.
But it is easy to change via an API address change in [quota.py](./quota.py).

The override operation is asynchronous so you have to poll the *operation* callback api to see the outcome.
This script polls the operation for a minute. Mostly in 5-10 seconds it is done.


# What is in it?
- [quota.py](./quota.py) module has the **Updater** class which holds the main logic. This is what you should incorporate into your own logic.
- [update-bigquery-quota.py](./update-bigquery-quota.py) script is an example to guide you in the usage of [quota.py](./quota.py). It updates the BigQuery quotas as it is a best practice for [cost control](https://cloud.google.com/bigquery/docs/custom-quotas)

# Usage

## Requirements
1. The dependencies should be installed via *pipenv*.  See [installing pipenv](https://github.com/pypa/pipenv#installation) if you don't have already.
2. Install dependencies via: `pipenv install`
3. Create a service account which has the role *roles/serviceusage.serviceUsageAdmin* on the projects whose quotas you want to update.
4. Create a key for the above service account and download it.

## Running the example BigQuery quota update
[update-bigquery-quota.py](./update-bigquery-quota.py) uses argparser, so just run the following to learn the parameters.
```bash
pipenv run python ./update-bigquery-quota.py --help
usage: quota updater [-h] -c CREDENTIAL_PATH -p PROJECT_ID [-uq USER_QUOTA]
                     [-pq PROJECT_QUOTA]

update bigquery quotas of a project

optional arguments:
  -h, --help            show this help message and exit
  -c CREDENTIAL_PATH, --credential_path CREDENTIAL_PATH
                        relative or absolute path of the service account's
                        credential.json file.
  -p PROJECT_ID, --project_id PROJECT_ID
                        id of the project
  -uq USER_QUOTA, --user_quota USER_QUOTA
                        quota per user in MiB, -1 for unlimited, default=-1
  -pq PROJECT_QUOTA, --project_quota PROJECT_QUOTA
                        quota per project in MiB, -1 for unlimited, default=-1
```

And an example call is
```bash
# the below command updates the total amount of MiB processed per project to 10 while per user to 5
pipenv run python update-bigquery-quota.py -c ./sa-credential.json -p my-bq-project-id  -pq 10 -uq 5

```
