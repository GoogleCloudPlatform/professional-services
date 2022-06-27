# Selective deployment

Organizing code across multiple folders within a single version control repositiroy such as github is a very common practice, and we're referring this as multi-folder repository.  

**Selective deployment** approach lets you find the folders changed within your repository and only run the logic for changed folders.  

With multi-folder repositories, it's possible to combine similar IaC into a single repository and/or centralize the mangement of multiple business units code.   
This approach genrally has following benefits:

- Reduced overhead in managing multiple CI/CD pipelines
- Better code visibility
- Reduces overhead in managing multiple ACLs for similar code

Example multi-folder repository structure

```txt
└── single-repo
    ├── build-files
    │   └── compile.sh
    ├── build.yaml
    └── user-resources
        ├── business-unit1
        │   ├── dev-env
        │   ├── prod-env
        │   └── qa-env
        └── business-unit2
            ├── dev-env
            ├── prod-env
            └── qa-env
```

``` Note: A Mono repo is always a multi-folder repository, however vice versa is not always true. Checkout https://www.hashicorp.com/blog/terraform-mono-repo-vs-multi-repo-the-great-debate article for more information on mono vs multi repos for IaC.```


## Solution

This can be addressed in multiple different ways, and our approach is as below:  

### Step 1: Find the commit associated with last successful build.

```sh
nth_successful_commit() {
  local n=$1  # n=1 --> Last successful commit.
  local trigger_name=$2
  local project=$3

  local trigger_id=$(get_trigger_value $trigger_name $project "id")
  local nth_successful_build=$(gcloud builds list --filter "buildTriggerId=$trigger_id AND STATUS=(SUCCESS)" --format "value(id)" --limit=$build_find_limit --project $project | awk "NR==$n") || exit 1

  local nth_successful_commit=$(gcloud builds describe $nth_successful_build --format "value(substitutions.COMMIT_SHA)" --project $project) || exit 1
  echo $nth_successful_commit
}
```

### Step 2: Find the differece between current commit and last successful commit.  

```sh
previous_commit_sha=$(nth_successful_commit 1 $apply_trigger_name $project) || exit 1

git diff --name-only ${previous_commit_sha} ${commit_sha} | sort -u > $logs_dir/diff.log || exit 1
```
This step will give you a list of files/folders that were modified after the commit associated with last successful build.  

### Step 3: Iterate over changed folders.
  
You can now iterate over only the changed folders received from Step 2 in the $logs_dir/diff.log file.

## Implementation steps

### Pre-requisites

- A cloud source repository (or any other source control repositories).
- A cloud build configuration file with basic steps to be executed on a single folder of the repository.

```Note: We are assuming that the pipeline is built on Google cloud build. If the pipeline is built on other platforms, you might need to retrofit this solution accordingly.```

### Setup Clooud build
Add the right values for the below CloudBuild substitution variables in the `cloudbuild.yaml` file.  

```sh
  _TF_SA_EMAIL: ''
  _PREVIOUS_COMMIT_SHA: ''
  _RUN_ALL_PROJECTS: 'false'
```

- `_TF_SA_EMAIL` is the GCP service_account with the necessary IAM permissions that the terraform impersonates. Cloudbuild default SA should have [roles/iam.serviceAccountTokenCreator](https://cloud.google.com/iam/docs/service-accounts#token-creator-role) on the `_TF_SA_EMAIL` service_account.
- `_PREVIOUS_COMMIT_SHA` is the github commit_sha that is used for explicitly checking delta changes between this commit and the latest commit instead of automatically detecting last sucessful commit based on a successful cloudbuild execution. Especially this would be required for first time execution when there is not a successful cloudbuild execution.  
- `_RUN_ALL_PROJECTS` is to force executing through all folders. Once is a while this is required:
    - for deploying a change that imapcts all folders such as a terraform module commonly used by code in all/multiple folders.
    - for detecting and fixing any configurations drifts, especially when manual changes are performed.

## Important points

Use unshallow copy of git clone.  

Cloud build in its default behaviour uses shallow a copy of the repository (i.e. only the code associated with the commit with which the current build was triggered). Shallow copy prevents us from performing git operations like git diff. However, we can use following step in the cloud build to fetch unshallow copy:

```yaml
  - id: 'unshallow'
    name: gcr.io/cloud-builders/git
    args: ['fetch', '--unshallow']
```