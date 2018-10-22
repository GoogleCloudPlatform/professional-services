# GCS Bucket Mover Tool

Currently there is no built in way to move a GCS bucket and all objects from one project to another. The manual process is:
1. Note down all settings related to the source bucket
1. Create a temporary bucket in the target project
1. Create a Storage Transfer Service (STS) job to move all objects from the source bucket to the target bucket
1. Delete the source bucket
1. Immediately re-create the bucket in the target project
1. Create an STS job to move all objects from the temporary bucket to the new source bucket in the target project
1. Delete the temporary bucket
1. Re-apply all bucket settings from the source bucket

This tool is designed to automatically perform these steps to make a bucket move as seamless as possible.

## Limitations

* **NO** object level settings are handled with this tool. The Storage Transfer Service does the object copying, so only settings it copies are supported.
* Any website settings for a bucket are not copied. These must be manually noted before running the tool as the source bucket will be deleted.
* Object Change Notification settings for a bucket are not copied.
* Custom IAM roles cannot be copied across projects due to security reasons, so if the source bucket has one applied to it and the user has chosen to copy over IAM policies, the tool will throw an error.
* IAM policies at the source project level or higher that affect source bucket access will not be copied to the target project.

## Bucket Settings That Are Copied

The tool will attempt to copy all of the following settings from the source bucket to the new bucket:
* **Storage Class** - The new bucket will have the same storage class
* **Location** - The new bucket will have the same location
* **IAM Policies** - All roles/members are copied (custom roles are not supported)
* **ACL Entities** - All bucket level ACL entities are copied
* **Default Object ACL** - If a bucket has default ACLs for objects, these entities are copied
* **Requester Pays** - This setting is copied, although it can cause issues if requests are then made without a user project specified
* **CORS** - All CORS settings are copied
* **Default KMS Key** - If the bucket contains a custom cloud KMS key, **it is assumed this key is in the source project** and the tool will attempt to give the target project service account Encrypter/Decrypter permissions to that key
* **Labels** - All labels are copied
* **Lifecycle Rules** - All lifecycle rules are copied
* **Logging** - Bucket logging is copied
* **Versioning** - This setting is copied
* **Notifications** - Any Cloud Pub/Sub notifications are copied along with assigning the required permissions for the target project

Individual settings can be ignored by adding the associated command line option. Alternatively the -se (--skipEverything) option can be passed so no settings other than storage class and location are copied.

## Credentials

The `confg.sh` file contains two environment variables that must be set with project credentials in order for the tool to run. The script can then be sourced (`. ./config.sh`) to set them before the bucket mover is run.
```
GCP_SOURCE_PROJECT_SERVICE_ACCOUNT_KEY   The location on disk for service account key json file from the source project
GCP_TARGET_PROJECT_SERVICE_ACCOUNT_KEY   The location on disk for service account key json file from the target project
```

The source project service account requires permissions to list and delete the source bucket, as well as able to assign IAM permissions to the bucket so the STS job can read and delete objects from it.
It may also require permission to be able to assign IAM permissions for the target project service account to access a KMS key and Cloud Pub/Sub topic.

The target project service account requires **Editor** or **Owner** in order to create the STS job, as well as permission to create/delete buckets.

Related permission documentation:
https://cloud.google.com/storage/docs/access-control/iam
https://cloud.google.com/storage/docs/access-control/iam-roles
https://cloud.google.com/storage-transfer/docs/configure-access

## Basic Usage

```
usage: bucket_mover [-h] [-t] [-tbn TEMPBUCKETNAME] [-l LOCATION]
                    [-s {MULTI_REGIONAL,REGIONAL,STANDARD,NEARLINE,COLDLINE,DURABLE_REDUCED_AVAILABILITY}]
                    [-se] [-sa] [-sc] [-sdoa] [-si] [-skms] [-sl] [-slog]
                    [-slr] [-sn] [-srp] [-sv]
                    bucket_name source_project target_project

Moves a GCS bucket from one project to another, along with all objects and optionally copying all other bucket settings.

positional arguments:
  bucket_name           The name of the bucket to be moved.
  source_project        The project id that the bucket is currently in.
  target_project        The project id that the bucket will be moved to.

optional arguments:
  -h, --help            show this help message and exit
  -t, --test            This will run a test of the tool to ensure all permissions are set up correctly and
                        buckets can be moved between the two projects. Use a random bucket name for testing.
                        !!!! DO NOT PASS IN THE NAME OF AN EXISTING BUCKET. The test will delete it
                        and everything in it !!!!
  -tbn TEMPBUCKETNAME, --tempBucketName TEMPBUCKETNAME
                        The termporary bucket name to use in the target project.
  -l LOCATION, --location LOCATION
                        Specify a different location for the new bucket.
  -s {MULTI_REGIONAL,REGIONAL,STANDARD,NEARLINE,COLDLINE,DURABLE_REDUCED_AVAILABILITY}, --storageClass {MULTI_REGIONAL,REGIONAL,STANDARD,NEARLINE,COLDLINE,DURABLE_REDUCED_AVAILABILITY}
                        Specify a different storage class for the new bucket.
  -se, --skipEverything
                        Only copies the bucket's storage class and location. Equivalent to setting every other --skip parameter to True.
  -sa, --skipAcl        Don't replicate the ACLs from the source bucket.
  -sc, --skipCors       Don't copy the CORS settings from the source bucket.
  -sdoa, --skipDefaultObjectAcl
                        Don't copy the Default Object ACL from the source bucket.
  -si, --skipIam        Don't replicate the IAM policies from the source bucket.
  -skms, --skipKmsKey   Don't copy the Default KMS Key from the source bucket.
  -sl, --skipLabels     Don't copy the Labels from the source bucket.
  -slog, --skipLogging  Don't copy the Logging settings from the source bucket.
  -slr, --skipLifecycleRules
                        Don't copy the Lifecycle Rules from the source bucket.
  -sn, --skipNotifications
                        Don't copy the Cloud Pub/Sub notification setting from the source bucket.
  -srp, --skipRequesterPays
                        Don't copy the Requester Pays setting from the source bucket.
  -sv, --skipVersioning
                        Don't copy the Versioning setting from the source bucket.
```

## Test Run

It is **highly recommended** that a test run is performed before attempting to move an important bucket.
By adding the --test flag, you can pass in a non-existent bucket name and the tool will initially create it along with setting up lots of options for the bucket, upload some files to it and then move it to the target project.
Service account access permissions are the trickiest part of this tool, so this allows you to confirm they are all set up correctly before running it on an important bucket. Bucket settings can be removed from bucket_mover_test.py if they are not required (ie Lifecycle Rules or Notifications).

**DO NOT** use a bucket names that already exists as the test is designed to be run multiple times in a row and will delete the bucket first before it creates it. You will be prompted before any buckets are deleted, but make sure you do not delete a bucket by accident as it will **NOT** be recoverable.

There are several global variables at the top of the gcs_bucket_mover_test.py file that will need to be configured for your environment.

### Examples

**Test run to confirm tool has access (where a test bucket already exists from a previous test)**

`bin/bucket_mover --test testing_random_bucket my_source_project my_target_project`

```
Using the following service accounts for GCS credentials:
Source Project: bucket-move-tool@my_source_project.iam.gserviceaccount.com
Target Project: bucket-move-tool@my_target_project.iam.gserviceaccount.com

WARNING!!! Bucket testing_random_bucket already exists in my_target_project
Type YES to confirm you want to do delete it: YES

✓ TESTING: Bucket testing_random_bucket deleted from project my_target_project
✓ TESTING: Bucket testing_random_bucket created in source project my_source_project
✓ TESTING: Uploading 5 random txt files
Using the following service accounts for GCS credentials:
Source Project: bucket-move-tool@my_source_project.iam.gserviceaccount.com
Target Project: bucket-move-tool@my_target_project.iam.gserviceaccount.com

✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket-temp
✓ Bucket my_bucket-temp created in target project my_target_project

STS service account for IAM usage: project-948484398585@storage-transfer-service.iam.gserviceaccount.com
✓ Assign STS permissions to source/temp buckets
Moving from bucket my_bucket to my_bucket-temp
✓ Create STS job
Checking STS job status
0 of 839 bytes (0%) copied in 0 of 5 objects (0%)
362 of 839 bytes (43%) copied in 2 of 5 objects (40%)
839 of 839 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 839 bytes in 5 objects

✓ Delete empty source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket
✓ Re-create source bucket in target project
✓ Assign STS permissions to new source bucket
Moving from bucket my_bucket-temp to my_bucket
✓ Create STS job
Checking STS job status
0 of 839 bytes (0%) copied in 0 of 5 objects (0%)
511 of 839 bytes (60%) copied in 3 of 5 objects (60%)
839 of 839 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 839 bytes in 5 objects

✓ Delete empty temp bucket
✓ Remove STS permissions from new source bucket
```

**Move bucket from one project to another**

`bin/bucket_mover my_bucket my_source_project my_target_project`

```
Using the following service accounts for GCS credentials:
Source Project: bucket-move-tool@my_source_project.iam.gserviceaccount.com
Target Project: bucket-move-tool@my_target_project.iam.gserviceaccount.com

✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket-temp
✓ Bucket my_bucket-temp created in target project my_target_project

STS service account for IAM usage: project-948484398585@storage-transfer-service.iam.gserviceaccount.com
✓ Assign STS permissions to source/temp buckets
Moving from bucket my_bucket to my_bucket-temp
✓ Create STS job
Checking STS job status
0 of 737 bytes (0%) copied in 0 of 5 objects (0%)
302 of 737 bytes (40%) copied in 2 of 5 objects (40%)
737 of 737 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 737 bytes in 5 objects

✓ Delete empty source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as Enrypter/Decrypter to key: projects/my_source_project/locations/global/keyRings/my_ring/cryptoKeys/my_key
IAM policies successfully copied over from the source bucket
ACLs successfully copied over from the source bucket
Default Object ACLs successfully copied over from the source bucket
✓ service-948484398585@gs-project-accounts.iam.gserviceaccount.com added as a Publisher to topic: my_topic
✓ Created 1 new notifications for the bucket my_bucket
✓ Re-create source bucket in target project
✓ Assign STS permissions to new source bucket
Moving from bucket my_bucket-temp to my_bucket
✓ Create STS job
Checking STS job status
0 of 737 bytes (0%) copied in 0 of 5 objects (0%)
442 of 737 bytes (59%) copied in 3 of 5 objects (60%)
737 of 737 bytes (100%) copied in 5 of 5 objects (100%)
✓ Success! STS job copied 737 bytes in 5 objects

✓ Delete empty temp bucket
✓ Remove STS permissions from new source bucket
```

**Change the storage class and/or location of a bucket (without moving projects)**

Make sure `config.sh` has both environment variables set with the credentials for the project you're working in.

`bin/bucket_mover my_bucket my_project my_project --location eu --storageClass MULTI_REGIONAL`

## Bucket and Object Permissions

If skip command line options are not specified, the tool will copy over all bucket level IAM roles, ACLs and default object ACLs to the new bucket in the target project. The new bucket's permissions will all be overwritten, so if the target project has custom default bucket ACLs, they will be replaced.

IAM policies at the source project level or higher that affect source bucket access will not be copied to the target project. Custom IAM roles are not supported, the tool will throw an error if the source bucket has any custom roles attached to it.
There may be existing project level policies in the target project that could affect the access level of the new bucket.

## License

Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, and is not intended for production use.
