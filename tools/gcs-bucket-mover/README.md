# GCS Bucket Mover Tool

Currently there is no built in way to move a GCS bucket and all objects from one project to another.
The manual process is:
1. Note down all settings related to the source bucket
1. Create a temporary bucket in the target project
1. Create a Storage Transfer Service (STS) job to move all objects from the source bucket to the
temporary bucket
1. Delete the source bucket
1. Immediately re-create the bucket in the target project
1. Create an STS job to move all objects from the temporary bucket to the new source bucket in the
target project
1. Delete the temporary bucket
1. Re-apply all bucket settings from the source bucket

This tool is designed to automatically perform these steps to make a bucket move as seamless as
possible.

#### Bucket Rename

This tool can also be used to rename a bucket, either within the same project or in conjunction with
a move to another project.

## Limitations

* **NO** object level settings are handled with this tool. The Storage Transfer Service does the
object copying, so only settings it copies are supported.
* Any website settings for a bucket are not copied. These must be manually noted before running the
tool as the source bucket will be deleted.
* Object Change Notification settings for a bucket are not copied.
* Custom IAM roles cannot be copied across projects due to security reasons, so if the source bucket
has one applied to it and the user has chosen to copy over IAM policies, the tool will throw an
error.
* IAM policies at the source project level or higher that affect source bucket access will not be
copied to the target project.

## Bucket Settings That Are Copied

The tool will attempt to copy all of the following settings from the source bucket to the target
bucket:
* **Storage Class** - The target bucket will have the same storage class
* **Location** - The target bucket will have the same location
* **IAM Policies** - All roles/members are copied (custom roles are not supported)
* **ACL Entities** - All bucket level ACL entities are copied
* **Default Object ACL** - If a bucket has default ACLs for objects, these entities are copied
* **Requester Pays** - This setting is copied, although it can cause issues if requests are then
made without a user project specified
* **CORS** - All CORS settings are copied
* **Default KMS Key** - If the bucket contains a custom cloud KMS key, **it is assumed this key is
in the source project** and the tool will attempt to give the target project service account
Encrypter/Decrypter permissions to that key
* **Labels** - All labels are copied
* **Lifecycle Rules** - All lifecycle rules are copied
* **Logging** - Bucket logging is copied
* **Versioning** - This setting is copied
* **Notifications** - Any Cloud Pub/Sub notifications are copied along with assigning the required
permissions for the target project

Individual settings can be ignored by adding the associated command line option (or adding it to the
config file). Alternatively the -se (--skip_everything) option can be passed so no settings other
than storage class and location are copied.

## Options

All options can either be specified in a YAML configuration file, or passed in directly on the
command line. If you want to use a config file, you must include the --config option that specifies
the local file path. Options starting with --test_ are only required when running with the --test
flag.

## Credentials

The tool works with a source project service account and a target project service account. It is
also possible to set both values to the same service account. The paths can be set in the config:
```
--gcp_source_project_service_account_key   The location on disk for service account key json file from the source project
--gcp_target_project_service_account_key   The location on disk for service account key json file from the target project
```
Alternatively, if one or both of of these values are not set, the tool will attempt to set the
missing paths using the GOOGLE_APPLICATION_CREDENTIALS environment variable.

The source project service account requires permissions to list and delete the source bucket, as
well as able to assign IAM permissions to the bucket so the STS job can read and delete objects from
it. It may also require permission to be able to assign IAM permissions for the target project
service account to access a KMS key and Cloud Pub/Sub topic.

The target project service account requires **Editor** or **Owner** in order to create the STS job,
as well as permission to create/delete buckets and write to Stackdriver.

Related permission documentation:
* https://cloud.google.com/storage/docs/access-control/iam
* https://cloud.google.com/storage/docs/access-control/iam-roles
* https://cloud.google.com/storage-transfer/docs/configure-access

## Bucket Locking

If the `--disable_bucket_lock` flag is not set, the tool will check for a lock file in the bucket
before attempting a move. If the file is found, the tool will immediately exit. If the flag is set,
the mover will continue and attempt the move without locking down bucket permissions.

The `lock_file_name` config variable in config.yaml file must be set. It is advised to test this
with a locked test bucket to ensure the tool finds the file and stops operation.

If the lock file is not found, the tool will set the bucket ACLs to 'private', remove all IAM roles
and set the source project service account as the only admin on the bucket so that nobody else can
make any changes to the bucket while the mover is running. After the move is completed, the new
bucket in the target project will have its ACL/IAM set to the original source bucket settings.
The original source bucket ACL/IAM values are logged to Stackdriver before the bucket is locked
down in case they need to be retrieved.

Object level ACLs are not looked at or modified.


## Logging

Logging will happen in both the console and in Stackdriver for target project, in the Global log.

## Basic Usage

The tool can be run either by installing from source and running `/bin/bucket_mover` or just downloading the PEX file from `/package/gcs-bucket-mover.pex` and installing PEX [https://github.com/pantsbuild/pex].

```
usage: bucket_mover [-h] [--config CONFIG]
                    [--gcp_source_project_service_account_key GCP_SOURCE_PROJECT_SERVICE_ACCOUNT_KEY]
                    [--gcp_target_project_service_account_key GCP_TARGET_PROJECT_SERVICE_ACCOUNT_KEY]
                    [--test] [--disable_bucket_lock]
                    [--lock_file_name LOCK_FILE_NAME]
                    [--rename_bucket_to RENAME_BUCKET_TO]
                    [--temp_bucket_name TEMP_BUCKET_NAME]
                    [--location LOCATION]
                    [--storage_class {MULTI_REGIONAL,REGIONAL,STANDARD,NEARLINE,COLDLINE,DURABLE_REDUCED_AVAILABILITY}]
                    [--skip_everything] [--skip_acl] [--skip_cors]
                    [--skip_default_obj_acl] [--skip_iam] [--skip_kms_key]
                    [--skip_labels] [--skip_logging] [--skip_lifecycle_rules]
                    [--skip_notifications] [--skip_requester_pays]
                    [--skip_versioning]
                    [--test_bucket_location TEST_BUCKET_LOCATION]
                    [--test_default_kms_key_name TEST_DEFAULT_KMS_KEY_NAME]
                    [--test_email_for_iam TEST_EMAIL_FOR_IAM]
                    [--test_logging_bucket TEST_LOGGING_BUCKET]
                    [--test_logging_prefix TEST_LOGGING_PREFIX]
                    [--test_storage_class TEST_STORAGE_CLASS]
                    [--test_topic_name TEST_TOPIC_NAME]
                    [--preserve_custom_time]
                    bucket_name source_project target_project
                    [--log_action] LOG_ACTION
                    [--log_action_state] LOG_ACTION_STATE             

Moves a GCS bucket from one project to another, along with all objects and optionally copying all other bucket settings. Args that start with '--' (eg. --gcp_source_project_service_account_key) can also be set in a config file (specified via --config). The config file uses YAML syntax and must represent a YAML 'mapping' (for details, see http://learn.getgrav.org/advanced/yaml). If an arg is specified in more than one place, then commandline values override config file values which override defaults.

positional arguments:
  bucket_name           The name of the bucket to be moved.
  source_project        The project id that the bucket is currently in.
  target_project        The project id that the bucket will be moved to.

optional arguments:
  -h, --help            show this help message and exit
  --config CONFIG       The path to the local config file
  --gcp_source_project_service_account_key GCP_SOURCE_PROJECT_SERVICE_ACCOUNT_KEY
                        The location on disk for service account key json file from the source project
  --gcp_target_project_service_account_key GCP_TARGET_PROJECT_SERVICE_ACCOUNT_KEY
                        The location on disk for service account key json file from the target project
  --test                This will run a test of the tool to ensure all permissions are set up correctly and
                        buckets can be moved between the two projects, using a randomly generated bucket.
                        A fake bucket name will still need to be specified.
  --disable_bucket_lock
                        Disabling the bucket lock option means that the mover will not look for a lock file
                        before starting the move, and it will not lock down permissions on the source bucket
                        before starting the move.
  --lock_file_name LOCK_FILE_NAME
                        The name of the lock file in the bucket
  --rename_bucket_to RENAME_BUCKET_TO
                        Specifying a target bucket name allows the tool to perform a bucket rename. Note that
                        the original source bucket will be deleted, so that bucket name can then potentially be
                        used by someone else.
  --temp_bucket_name TEMP_BUCKET_NAME
                        The temporary bucket name to use in the target project.
  --location LOCATION   Specify a different location for the target bucket.
  --storage_class {MULTI_REGIONAL,REGIONAL,STANDARD,NEARLINE,COLDLINE,DURABLE_REDUCED_AVAILABILITY}
                        Specify a different storage class for the target bucket.
  --skip_everything     Only copies the bucket's storage class and location. Equivalent to setting every other --skip parameter to True.
  --skip_acl            Don't replicate the ACLs from the source bucket.
  --skip_cors           Don't copy the CORS settings from the source bucket.
  --skip_default_obj_acl
                        Don't copy the Default Object ACL from the source bucket.
  --skip_iam            Don't replicate the IAM policies from the source bucket.
  --skip_kms_key        Don't copy the Default KMS Key from the source bucket.
  --skip_labels         Don't copy the Labels from the source bucket.
  --skip_logging        Don't copy the Logging settings from the source bucket.
  --skip_lifecycle_rules
                        Don't copy the Lifecycle Rules from the source bucket.
  --skip_notifications  Don't copy the Cloud Pub/Sub notification setting from the source bucket.
  --skip_requester_pays
                        Don't copy the Requester Pays setting from the source bucket.
  --skip_versioning     Don't copy the Versioning setting from the source bucket.
  --test_bucket_location TEST_BUCKET_LOCATION
                        The location to create the test bucket in
  --test_default_kms_key_name TEST_DEFAULT_KMS_KEY_NAME
                        A custom KSM key to assign to the test bucket
  --test_email_for_iam TEST_EMAIL_FOR_IAM
                        An IAM email to use for testing permissions on the test bucket
  --test_logging_bucket TEST_LOGGING_BUCKET
                        An existing bucket to set up logging on the test bucket
  --test_logging_prefix TEST_LOGGING_PREFIX
                        A prefix to use for the logging on the test bucket
  --test_storage_class TEST_STORAGE_CLASS
                        The storage class to use for the test bucket
  --test_topic_name TEST_TOPIC_NAME
                        A topic name to set up a notification for on the test bucket
  --preserve_custom_time
  			 Preserves the source objects time created metadata in the custom time field in the destination object
   --log_action LOG_ACTION
         see logs in log explorer like "COPY,FIND"
   --log_action_state LOG_ACTION_STATE
         See  succeeded or failed log in log explorer like "FAILED,SUCCEEDED"
         
```

## Test Run

It is **highly recommended** that a test run is performed before attempting to move an important
bucket. By adding the --test flag, the tool will create a random bucket along with setting up lots
of options for the bucket, upload some files to it and then move it to the target project. After it
is complete, you can verify in the target project that the bucket and all settings were moved
correctly.

Service account access permissions are the trickiest part of this tool, so this allows you to
confirm they are all set up correctly before running it on an important bucket. There are several
options that will need to be be configured for your environment. They are the options starting with
--test_*. For even more fine grained control, bucket settings can be removed/added/changed in the
bucket_mover_tester.py code (ie Lifecycle Rules, Notifications or custom KMS keys).

## Unit Tests

The unit test can be run with Tox: `tox -e unittest`

The test are all for testing logic and do not interact with the cloud.

## Examples

These examples are expecting that a config.yaml file has been created containing the GCP credential
options and required testing options.

**Test run to confirm tool has access (where a test bucket already exists from a previous test)**

`bin/bucket_mover --test --config config.yaml fake_bucket my_source_project my_target_project`

```
✓ TESTING: Bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a created in source project my_source_project
✓ TESTING: Uploading 5 random txt files

Source Project: my_source_project
Source Bucket: bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a
Source Service Account: bucket-mover@my_source_project.iam.gserviceaccount.com
Target Project: my_target_project
Target Bucket: bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a
Target Service Account: bucket-mover@my_target_project.iam.gserviceaccount.com
✓ Confirming that lock file _locks/all.lock does not exist
✓ Locking down the bucket by revoking all ACLs/IAM policies
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a-temp
✓ Bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a-temp created in target project my_target_project
STS service account for IAM usage: project-948484398585@storage-transfer-service.iam.gserviceaccount.com
✓ Assigning STS permissions to source/temp buckets
Moving from bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a to bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a-temp
✓ Creating STS job
Checking STS job status
0 of 839 bytes (0%) copied in 0 of 5 objects (0%)
362 of 839 bytes (43%) copied in 2 of 5 objects (40%)
839 of 839 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 839 bytes in 5 objects

✓ Deleting empty source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a
✓ Re-creating source bucket in target project
✓ Assigning STS permissions to new source bucket
Moving from bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a-temp to bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a
✓ Creating STS job
Checking STS job status
0 of 839 bytes (0%) copied in 0 of 5 objects (0%)
511 of 839 bytes (60%) copied in 3 of 5 objects (60%)
839 of 839 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 839 bytes in 5 objects

✓ Deleting empty temp bucket
✓ Removing STS permissions from bucket bucket_mover_6aa7d2e1-25f7-41b3-9189-ca35d9cef99a
```

**Move bucket from one project to another**

`bin/bucket_mover --config config.yaml my_bucket my_source_project my_target_project`

```
Source Project: my_source_project
Source Bucket: my_bucket
Source Service Account: bucket-mover@my_source_project.iam.gserviceaccount.com
Target Project: my_target_project
Target Bucket: my_bucket
Target Service Account: bucket-mover@my_target_project.iam.gserviceaccount.com
✓ Confirming that lock file _locks/all.lock does not exist
✓ Locking down the bucket by revoking all ACLs/IAM policies
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket-temp
✓ Bucket my_bucket-temp created in target project my_target_project
STS service account for IAM usage: project-948484398585@storage-transfer-service.iam.gserviceaccount.com
✓ Assigning STS permissions to source/temp buckets
Moving from bucket my_bucket to my_bucket-temp
✓ Creating STS job
Checking STS job status
0 of 737 bytes (0%) copied in 0 of 5 objects (0%)
302 of 737 bytes (40%) copied in 2 of 5 objects (40%)
737 of 737 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 737 bytes in 5 objects

✓ Deleting empty source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket
✓ Re-creating source bucket in target project
✓ Assigning STS permissions to new source bucket
Moving from bucket my_bucket-temp to my_bucket
✓ Creating STS job
Checking STS job status
0 of 737 bytes (0%) copied in 0 of 5 objects (0%)
442 of 737 bytes (59%) copied in 3 of 5 objects (60%)
737 of 737 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 737 bytes in 5 objects

✓ Deleting empty temp bucket
✓ Removing STS permissions from bucket my_bucket
```

**Change the storage class and/or location of a bucket (without moving projects)**

Make sure both service account key config values set with the credentials for the project you're
working in.

`bin/bucket_mover --config config.yaml my_bucket my_project my_project --location eu --storage_class MULTI_REGIONAL`

**Rename a bucket (without moving projects)**

`bin/bucket_mover --config config.yaml my_bucket my_project my_project --rename_bucket_to my_new_bucket`

## Bucket and Object Permissions

If skip command line options are not specified, the tool will copy over all bucket level IAM roles,
ACLs and default object ACLs to the target bucket in the target project. The target bucket's
permissions will all be overwritten, so if the target project has custom default bucket ACLs, they
will be replaced.

IAM policies at the source project level or higher that affect source bucket access will not be
copied to the target project. Custom IAM roles are not supported, the tool will throw an error if
the source bucket has any custom roles attached to it.
There may be existing project level policies in the target project that could affect the access
level of the target bucket.

## Packaging

In order to package the tool for deployment, there is a Tox [https://tox.readthedocs.io/en/latest/]
ini file included to package the tool for MacOS and GCE CentOS VMs. Once Tox is installed, you can
package it with
```
tox -e package
```
The resulting ./package/gcs-bucket-mover.pex file can then be run as a script provided
PEX [https://github.com/pantsbuild/pex] is installed.
