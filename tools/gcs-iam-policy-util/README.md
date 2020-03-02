# GCS Bucket IAM Policy Utility

This utility applies bucket IAM policies with IAM Conditions scoped to a resource prefix.
IAM Conditions can be used to enable secure directories within a GCS bucket.
The configuration files used by this utility allow users to define groups of service accounts and GCS buckets which are expanded to apply similar policies to a large number of buckets or identities.
The utility is designed to be driven by configuration to enable users to manage GCS IAM policies via CI/CD.


## Warning

It's possible to apply a policy that prevents further updates. Be careful to set `--adminIdentity` and include at least one role with `storage.getIamPolicy` and `storage.setIamPolicy` in order retain the ability to update the IAM policy.


## Usage

### Usage Notes

Uniform bucket-level access control must be enabled on any GCS bucket managed by this utility. If it is not enabled, you will receive the following message with a `412 Precondition Failed` status returned by the Cloud Storage API:

```
To set IAM conditions in this bucket, enable uniform bucket-level access. 
This ensures that all object access is controlled uniformly at the bucket-level 
without individual, object-level permissions. 
Learn more at 
https://cloud.google.com/storage/docs/uniform-bucket-level-access#iam-conditions
```

To enable uniform bucket-level access, visit [https://console.cloud.google.com/storage/browser/bucketname](https://console.cloud.google.com/storage/browser/bucketname) then select the 'Permissions' tab, click 'Edit', select 'Uniform', check 'Add project role ACLs to the bucket IAM policy' then click 'SAVE'.

To verify that service account projects are part of your organization, 
this utility uses the Cloud Resource Manager API.
You'll need to enable this API for the project that holds your service account.
You can do this by visiting [https://console.developers.google.com/apis/api/cloudresourcemanager
.googleapis.com/overview
 ?project={project id or project number}](https://console.developers.google.com/apis/api/cloudresourcemanager.googleapis.com/overview
?project={project id or project number})
or by running `gcloud --project {projectId} services enable cloudresourcemanager.googleapis.com`


### Run as user

```sh
java -jar gcs-iam-policy-util.jar --adminIdentity user:admin@example.com
```

### Run as service account

```sh
java -jar gcs-iam-policy-util.jar \
  --adminIdentity serviceAccount:gcs_iam_adm@project.iam.gserviceaccount.com \
  --keyFile /path/to/keyfile.json
```

### Help Text

```sh
java -jar gcs-iam-policy-util.jar --help
```

Output:

```
GCSIamPolicyUtil 0.1
Usage: GCSIamPolicyUtil [options]

  --adminIdentity <value>  identity with admin privileges (format:{user|serviceAccount|group}:{email})
  --keyFile <file>         (optional) path to GoogleCredentials json key file
  --zones <URI|path>       (optional) URI or path to zones.conf
  --idSets <URI|path>      (optional) URI or path to id_sets.conf
  --policies <URI|path>    (optional) URI or path to policies.conf
  --roleSets <URI|path>    (optional) URI or path to role_sets.conf
  --cache <URI|path>       (optional) URI or path to policyCache.pb
  --allowedDomains <domain>
                           (optional) domain whitelist for authorization groups
  --allowedProjects <projectId>
                           (optional) project id whitelist for service accounts
  --rmValidator <value>    (optional) validate projects with Cloud Resource Manager (default: true)
  --ttl <value>            (optional) cache ttl in seconds; default 1 week
  -w, --wait <value>       (optional) wait time between requests in milliseconds; default 100ms
  -m, --merge              (flag) merge with existing policy
  -k, --keep               (flag) keep bindings from existing policy during merge
  --clearCache             (flag) clear policy cache
  --help                   prints this usage text
running without arguments will load configuration from default location and overwrite any existing bucket IAM policies with the generated policies
```


## Example Configuration

### Simple configuration

policies.conf only

```
[gs://{bucket}/{prefix}]
roles/storage.objectAdmin serviceAccount:{serviceAccountName}@{project}.iam.gserviceaccount.com
```


## Example IAM Roles

These roles would be defined in [IAM Roles Console](https://console.cloud.google.com/iam-admin/roles) by selecting "+ Create Role"

`gcs_rw` grants permissions to read and write objects.

```
storage.buckets.get
storage.buckets.list
storage.objects.create
storage.objects.delete
storage.objects.get
storage.objects.list
storage.objects.update
```

`gcs_ro` grants permissions to read objects

```
storage.buckets.get
storage.buckets.list
storage.objects.get
storage.objects.list
```

`gcs_adm` grants permissions to list and modify buckets, including IAM policy, but not read data.

```
storage.buckets.create
storage.buckets.delete
storage.buckets.get
storage.buckets.getIamPolicy
storage.buckets.list
storage.buckets.setIamPolicy
storage.buckets.update
```

`gcs_iam` is designed to be granted to a service account used by CI/CD to run this utility. 
It grants permissions to modify IAM policies but not read data.
It also grants permission to verify that a project exists within an organization.

```
resourcemanager.projects.get
storage.buckets.getIamPolicy
storage.buckets.setIamPolicy
```


## How it works

1. Reads config files and policy cache
2. Resolves GCS Bucket policies from configuration
3. Computes hashes for policies generated from configuration
4. Checks policy cache for cached policy hash for each GCS Bucket IAM policy
5. Updates GCS Bucket IAM policy if hash new policy hash differs from cached value
6. Examines updated policy returned by IAM policy update API call
7. Hashes updated policy and updates policy cache
8. Writes updated policy cache


### Admin Identity

The admin identity is the identity used to run the utility and set IAM policy. If you are using a json keyfile, it should be the identity found in the keyfile.

You are required to provide admin identity as a safety precaution to avoid setting an IAM policy that prevents future updates.

Whatever policy is resolved from configuration, this utility will add an additional role grant of `storage.admin` to the admin identity.


### Config Validation

It's possible to pass a list of allowed domains or projects and have the config parser enforce that all service accounts are associated with whitelisted projects and all users are associated with allowed domains.


### Policy Cache

The policy cache is a protobuf message defined in [policycache.proto](proto/policycache.proto) containing a timestamp and hash for each bucket.

Code was generated by running `protoc proto/policycache.proto --java_out=src/main/java`

The generated java class is [PolicyCache.java](src/main/java/com/google/cloud/util/bpm/PolicyCache.java)

The policy cache is saved by serializing to byte array and writing to a file.


### Policy Hash

The policy hash is generated by passing sorted role ids and identities through a SHA256 hash function.

If the hash of a generated policy matches the hash stored in the policy cache, no changes have been made and it is unnecessary to call the Storage API to update the policy.


## Pre-requisites

[SBT](https://www.scala-sbt.org/download.html)


## Building

`sbt assembly`



## Disclaimer

This is not an official Google project.
