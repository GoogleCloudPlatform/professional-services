# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.
"""Script to move a bucket, all settings and data from one project to another."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
import datetime
from time import sleep
from retrying import retry
from yaspin import yaspin

from google.cloud import exceptions
from google.cloud import pubsub
from google.cloud import storage
from google.cloud.storage import iam
from googleapiclient import discovery

from gcs_bucket_mover import bucket_details
from gcs_bucket_mover import configuration
from gcs_bucket_mover import sts_job_status

_CHECKMARK = u'\u2713'.encode('utf8')
_LOGGER = None


def move_bucket(conf):  # Majority statements are logging. pylint: disable=too-many-statements
    """Main entry point for the bucket mover script

    Args:
        conf: the configargparser parsing of command line options
    """

    # Load the environment config values set in config.sh and create the storage clients.
    config = configuration.Configuration.from_conf(conf)

    # We need to create the cloud logging client before we can set the global logger.
    global _LOGGER  # pylint: disable=global-statement
    _LOGGER = config.target_logging_client.logger('gcs-bucket-mover')  # pylint: disable=no-member

    _LOGGER.log_text("Starting GCS Bucket Mover")

    _print_and_log('Using the following service accounts for GCS credentials: ')
    _print_and_log('Source Project - {}'.format(
        config.source_project_credentials.service_account_email))  # pylint: disable=no-member
    _print_and_log('Target Project - {}'.format(
        config.target_project_credentials.service_account_email))  # pylint: disable=no-member

    source_bucket = config.source_storage_client.lookup_bucket(  # pylint: disable=no-member
        config.bucket_name)

    # Get copies of all of the source bucket's IAM, ACLs and settings so they can be copied over to
    # the target project bucket
    source_bucket_details = bucket_details.BucketDetails(
        conf=conf, source_bucket=source_bucket)

    if config.use_bucket_lock:
        spinner_text = 'Confirming that lock file {} does not exist'.format(
            config.lock_file_name)
        _LOGGER.log_text(spinner_text)
        with yaspin(text=spinner_text) as spinner:
            _lock_down_bucket(
                spinner, source_bucket, config.lock_file_name,
                config.source_project_credentials.service_account_email)  # pylint: disable=no-member
            spinner.ok(_CHECKMARK)

    spinner_text = 'Creating temp target bucket'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        target_temp_bucket = _create_bucket(
            spinner, config, config.target_storage_client,
            config.temp_bucket_name, source_bucket_details)
        _write_spinner_and_log(
            spinner, '{} Bucket {} created in target project {}'.format(
                _CHECKMARK, config.temp_bucket_name, config.target_project))

    # Create STS client
    sts_client = discovery.build(
        'storagetransfer', 'v1', credentials=config.target_project_credentials)

    spinner_text = 'Assigning STS permissions to source/temp buckets'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        sts_account_email = _get_sts_iam_account_email(sts_client,
                                                       config.target_project)
        _write_spinner_and_log(
            spinner,
            'STS service account for IAM usage: {}'.format(sts_account_email))
        _assign_sts_iam_roles(sts_account_email, config.source_storage_client,
                              config.source_project, config.bucket_name, True)
        _assign_sts_iam_roles(sts_account_email, config.target_storage_client,
                              config.target_project, target_temp_bucket.name,
                              True)
        spinner.ok(_CHECKMARK)

    _run_and_wait_for_sts_job(sts_client, config.target_project,
                              config.bucket_name, config.temp_bucket_name)

    spinner_text = 'Deleting empty source bucket'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        source_bucket.delete()
        spinner.ok(_CHECKMARK)

    spinner_text = 'Re-creating source bucket in target project'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        _create_bucket(spinner, config, config.target_storage_client,
                       config.bucket_name, source_bucket_details)
        spinner.ok(_CHECKMARK)

    spinner_text = 'Assigning STS permissions to new source bucket'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        _assign_sts_iam_roles(sts_account_email, config.target_storage_client,
                              config.target_project, config.bucket_name, False)
        spinner.ok(_CHECKMARK)

    _run_and_wait_for_sts_job(sts_client, config.target_project,
                              config.temp_bucket_name, config.bucket_name)

    spinner_text = 'Deleting empty temp bucket'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        target_temp_bucket.delete()
        spinner.ok(_CHECKMARK)

    spinner_text = 'Removing STS permissions from new source bucket'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        _remove_sts_iam_roles(sts_account_email, config.target_storage_client,
                              config.bucket_name)
        spinner.ok(_CHECKMARK)

    _LOGGER.log_text('Completed GCS Bucket Mover')


def _lock_down_bucket(spinner, bucket, lock_file_name, service_account_email):
    """Change the ACL/IAM on the bucket so that only the service account can access it.

    Args:
        spinner: The spinner displayed in the console
        bucket: The bucket object to lock down
        lock_file_name: The name of the lock file
        service_account_email: The email of the service account
    """

    if _does_lock_file_exist(bucket, lock_file_name):
        spinner.fail('X')
        msg = 'The lock file exists in the source bucket, so we cannot continue'
        _LOGGER.log_text(msg)
        raise SystemExit(msg)

    spinner.ok(_CHECKMARK)
    msg = 'Locking down the bucket by revoking all ACLs/IAM policies'
    spinner.text = msg
    _LOGGER.log_text(msg)

    # Turn off any bucket ACLs
    bucket.acl.save_predefined('private')

    # Revoke all IAM access and then add the service account as an admin
    account = 'serviceAccount:' + service_account_email
    policy = bucket.get_iam_policy()
    for role in policy.keys():
        for member in policy[role].copy():
            policy[role].discard(member)

    policy['roles/storage.admin'].add(account)
    bucket.set_iam_policy(policy)


def _does_lock_file_exist(bucket, lock_file_name):
    """Checks to see if the lock file exists in the bucket.

    Args:
        bucket: The bucket to look for the lock file in
        lock_file_name: The name of the lock file

    Returns:
        True if the file is in the bucket
    """

    blob = storage.Blob(lock_file_name, bucket)
    return blob.exists()


def _get_project_number(project_id, credentials):
    """Using the project id, get the unique project number for a project.

    Args:
        project_id: The id of the project
        credentials: The credentials to use for accessing the project

    Returns:
        The project number as a string
    """

    crm = discovery.build('cloudresourcemanager', 'v1', credentials=credentials)
    project = crm.projects().get(projectId=project_id).execute(num_retries=5)  # pylint: disable=no-member
    return project['projectNumber']


def _create_bucket(spinner, config, storage_client, bucket_name,
                   source_bucket_details):
    """Creates a bucket and replicates all of the settings from source_bucket_details.

    Args:
        spinner: The spinner displayed in the console
        config: A Configuration object with all of the config values needed for the script to run
        storage_client: The storage client object used to access GCS
        bucket_name: The name of the bucket to create
        source_bucket_details: The details copied from the source bucket that is being moved

    Returns:
        The bucket object that has been created in GCS
    """

    bucket = storage.Bucket(client=storage_client, name=bucket_name)
    bucket.location = source_bucket_details.location
    bucket.storage_class = source_bucket_details.storage_class
    bucket.requester_pays = source_bucket_details.requester_pays
    bucket.cors = source_bucket_details.cors
    bucket.labels = source_bucket_details.labels
    bucket.lifecycle_rules = source_bucket_details.lifecycle_rules
    bucket.versioning_enabled = source_bucket_details.versioning_enabled

    if source_bucket_details.default_kms_key_name:
        bucket.default_kms_key_name = source_bucket_details.default_kms_key_name
        # The target project GCS service account must be given Encrypter/Decrypter permission for
        # the key
        _add_target_project_to_kms_key(
            spinner, config, source_bucket_details.default_kms_key_name)

    if source_bucket_details.logging:
        bucket.enable_logging(source_bucket_details.logging['logBucket'],
                              source_bucket_details.logging['logObjectPrefix'])

    _create_bucket_api_call(spinner, bucket)

    if source_bucket_details.iam_policy:
        _update_iam_policies(config, bucket, source_bucket_details)
        _write_spinner_and_log(
            spinner,
            'IAM policies successfully copied over from the source bucket')

    if source_bucket_details.acl_entities:
        new_acl = _update_acl_entities(config,
                                       source_bucket_details.acl_entities)
        bucket.acl.save(acl=new_acl)
        _write_spinner_and_log(
            spinner, 'ACLs successfully copied over from the source bucket')

    if source_bucket_details.default_obj_acl_entities:
        new_default_obj_acl = _update_acl_entities(
            config, source_bucket_details.default_obj_acl_entities)
        bucket.default_object_acl.save(acl=new_default_obj_acl)
        _write_spinner_and_log(
            spinner,
            'Default Object ACLs successfully copied over from the source bucket'
        )

    if source_bucket_details.notifications:
        _update_notifications(spinner, config,
                              source_bucket_details.notifications, bucket)
        _write_spinner_and_log(
            spinner, '{} Created {} new notifications for the bucket {}'.format(
                _CHECKMARK, len(source_bucket_details.notifications),
                bucket_name))

    return bucket


def _retry_if_false(result):
    """Return True if we should retry because the function returned False"""
    return result is False


@retry(
    retry_on_result=_retry_if_false,
    wait_exponential_multiplier=4000,
    wait_exponential_max=60000,
    stop_max_attempt_number=5)
def _create_bucket_api_call(spinner, bucket):
    """Calls the GCS api method to create the bucket.

    The method will attemp to retry up to 5 times if the 503 ServiceUnavailable
    exception is raised.

    Args:
        spinner: The spinner displayed in the console
        bucket: The bucket object to create

    Returns:
        True if the bucket was created, False if a ServiceUnavailable exception was raised

    Raises:
        google.cloud.exceptions.Conflict: The underlying Google Cloud api will raise this error if
            the bucket already exists.
    """

    try:
        bucket.create()
    except exceptions.ServiceUnavailable:
        _write_spinner_and_log(
            spinner, '503 Service Unavailable error returned.'
            ' Retrying up to 5 times with exponential backoff.')
        return False
    return True


def _update_iam_policies(config, bucket, source_bucket_details):
    """Take the existing IAM, replace the source project number with the target project
    number and then assign the IAM to the new bucket.

    Args:
        config: A Configuration object with all of the config values needed for the script to run
        bucket: The bucket object to update the IAM policies for
        source_bucket_details: The details copied from the source bucket that is being moved
    """

    policy = bucket.get_iam_policy()

    # Update the original policy with the etag for the policy we just got so the update is
    # associated with our get request to make sure no other update overwrites our change
    source_bucket_details.iam_policy.etag = policy.etag
    for role in source_bucket_details.iam_policy:
        for member in source_bucket_details.iam_policy[role]:
            # If a project level role was set, replace it with an identical one for the new project
            if ':' + config.source_project in member:
                new_member = member.replace(config.source_project,
                                            config.target_project)
                source_bucket_details.iam_policy[role].discard(member)
                source_bucket_details.iam_policy[role].add(new_member)

    # Give the target bucket all of the same policies as the source bucket, but with updated
    # project roles
    bucket.set_iam_policy(source_bucket_details.iam_policy)


def _update_acl_entities(config, source_entities):
    """Update the source ACL entities.

    Take the existing ACLs, replace the source project number with the target project number and
    then assign the ACLs to the new bucket.

    Args:
        config: A Configuration object with all of the config values needed for the script to run
        source_entities: The existing ACL entities of the bucket

    Returns:
        The list of ACLs with project numbers replaced
    """

    source_project_number = _get_project_number(
        config.source_project, config.source_project_credentials)
    target_project_number = _get_project_number(
        config.target_project, config.target_project_credentials)

    new_acl = storage.acl.ACL()
    new_acl.loaded = True
    # If an entity is for the source project, replace it with the identical one for the new
    # project
    for entity in source_entities:
        # Skip it if it has no identifier
        if not hasattr(entity, 'identifier'):
            continue

        # Skip it if the identifier is empty
        if entity.identifier is None:
            continue

        # Skip it if the identifier doesn't contain the source project number
        if '-' + source_project_number not in entity.identifier:
            continue

        # Replace the source project number with the target project number and add the entity
        entity.identifier = entity.identifier.replace(source_project_number,
                                                      target_project_number)
        new_acl.add_entity(entity)

    return new_acl


def _update_notifications(spinner, config, notifications, bucket):
    """Update the notifications on the target bucket to match those from the source bucket.

    Args:
        spinner: The spinner displayed in the console
        config: A Configuration object with all of the config values needed for the script to run
        notifications: A list of notifications to add to the bucket
        bucket: The bucket object to update the notifications for
    """

    for item in notifications:
        # Give target project service account access to publish to source project topic
        _assign_target_project_to_topic(spinner, config, item.topic_name,
                                        item.topic_project)

        notification = storage.notification.BucketNotification(
            bucket,
            item.topic_name,
            topic_project=item.topic_project,
            custom_attributes=item.custom_attributes,
            event_types=item.event_types,
            blob_name_prefix=item.blob_name_prefix,
            payload_format=item.payload_format)
        notification.create()


def _get_sts_iam_account_email(sts_client, project_id):
    """Get the account email that the STS service will run under.

    Args:
        sts_client: The STS client object to be used
        project_id: The id of the project

    Returns:
        The STS service account email as a string
    """

    result = sts_client.googleServiceAccounts().get(
        projectId=project_id).execute(num_retries=5)
    return result['accountEmail']


def _assign_sts_iam_roles(sts_email, storage_client, project_name, bucket_name,
                          assign_viewer):
    """Assign roles to the STS service account that will be required to interact with the bucket.

    Args:
        sts_email: The email address for the STS service account
        storage_client: The storage client object used to access GCS
        project_name: The name of the project
        bucket_name: The name of the bucket
        assign_viewer: True if we should also assign the Object Viewer/LegacyReader roles
    """

    account = 'serviceAccount:' + sts_email
    bucket = storage_client.bucket(bucket_name, project_name)
    policy = bucket.get_iam_policy()
    policy['roles/storage.legacyBucketWriter'].add(account)
    if assign_viewer:
        policy[iam.STORAGE_OBJECT_VIEWER_ROLE].add(account)
        policy['roles/storage.legacyBucketReader'].add(account)

    bucket.set_iam_policy(policy)


def _remove_sts_iam_roles(sts_email, storage_client, bucket_name):
    """Remove the roles that were assigned for the STS service account.

    Args:
        sts_email: The email address for the STS service account
        storage_client: The storage client object used to access GCS
        bucket_name: The name of the bucket
    """

    account = 'serviceAccount:' + sts_email
    bucket = storage_client.bucket(bucket_name)
    policy = bucket.get_iam_policy()
    policy['roles/storage.legacyBucketWriter'].discard(account)
    bucket.set_iam_policy(policy)


def _add_target_project_to_kms_key(spinner, config, kms_key_name):
    """Gives the service_account_email the Encrypter/Decrypter role for the given KMS key.

    Args:
        spinner: The spinner displayed in the console
        config: A Configuration object with all of the config values needed for the script to run
        kms_key_name: The name of the KMS key that the project should be given access to
    """

    kms_client = discovery.build(
        'cloudkms', 'v1', credentials=config.source_project_credentials)

    # Get the current IAM policy and add the new member to it.
    crypto_keys = kms_client.projects().locations().keyRings().cryptoKeys()  # pylint: disable=no-member
    policy_request = crypto_keys.getIamPolicy(resource=kms_key_name)
    policy_response = policy_request.execute(num_retries=5)
    bindings = []
    if 'bindings' in policy_response.keys():
        bindings = policy_response['bindings']
    service_account_email = config.target_storage_client.get_service_account_email()
    members = ['serviceAccount:' + service_account_email]
    bindings.append({
        'role': 'roles/cloudkms.cryptoKeyEncrypterDecrypter',
        'members': members,
    })
    policy_response['bindings'] = bindings

    # Set the new IAM Policy.
    request = crypto_keys.setIamPolicy(
        resource=kms_key_name, body={'policy': policy_response})
    request.execute(num_retries=5)

    _write_spinner_and_log(
        spinner, '{} {} added as Enrypter/Decrypter to key: {}'.format(
            _CHECKMARK, service_account_email, kms_key_name))


def _assign_target_project_to_topic(spinner, config, topic_name, topic_project):
    """Gives the service_account_email the Publisher role for the topic.

    Args:
        spinner: The spinner displayed in the console
        config: A Configuration object with all of the config values needed for the script to run
        topic_name: The name of the topic that the target project should be assigned to
        topic_project: The name of the project that the topic belongs to
    """

    client = pubsub.PublisherClient(
        credentials=config.source_project_credentials)
    topic_path = client.topic_path(topic_project, topic_name)  # pylint: disable=no-member
    policy = client.get_iam_policy(topic_path)  # pylint: disable=no-member

    service_account_email = config.target_storage_client.get_service_account_email()
    policy.bindings.add(
        role='roles/pubsub.publisher',
        members=['serviceAccount:' + service_account_email])

    client.set_iam_policy(topic_path, policy)  # pylint: disable=no-member

    _write_spinner_and_log(
        spinner, '{} {} added as a Publisher to topic: {}'.format(
            _CHECKMARK, service_account_email, topic_name))


@retry(
    retry_on_result=_retry_if_false,
    wait_exponential_multiplier=10000,
    wait_exponential_max=120000,
    stop_max_attempt_number=10)
def _run_and_wait_for_sts_job(sts_client, target_project, source_bucket_name,
                              sink_bucket_name):
    """Kick off the STS job and wait for it to complete. Retry if it fails.

    Args:
        sts_client: The STS client object to be used
        target_project: The name of the target project where the STS job will be created
        source_bucket_name: The name of the bucket where the STS job will transfer from
        sink_bucket_name: The name of the bucket where the STS job will transfer to

    Returns:
        True if the STS job completed successfully, False if it failed for any reason
    """

    msg = 'Moving from bucket {} to {}'.format(source_bucket_name,
                                               sink_bucket_name)
    _print_and_log(msg)

    spinner_text = 'Creating STS job'
    _LOGGER.log_text(spinner_text)
    with yaspin(text=spinner_text) as spinner:
        sts_job_name = _execute_sts_job(sts_client, target_project,
                                        source_bucket_name, sink_bucket_name)
        spinner.ok(_CHECKMARK)

    # Check every 10 seconds until STS job is complete
    with yaspin(text='Checking STS job status') as spinner:
        while True:
            job_status = _check_sts_job(spinner, sts_client, target_project,
                                        sts_job_name)
            if job_status != sts_job_status.StsJobStatus.in_progress:
                break
            sleep(10)

    if job_status == sts_job_status.StsJobStatus.success:
        print()
        return True

    # Execution will only reach this code if something went wrong with the STS job
    _print_and_log(
        'There was an unexpected failure with the STS job. You can view the details in the cloud'
        ' console.')
    _print_and_log(
        'Waiting for a period of time and then trying again. If you choose to cancel this script,'
        ' the buckets will need to be manually cleaned up.')
    return False


def _execute_sts_job(sts_client, target_project, source_bucket_name,
                     sink_bucket_name):
    """Start the STS job.

    Args:
        sts_client: The STS client object to be used
        target_project: The name of the target project where the STS job will be created
        source_bucket_name: The name of the bucket where the STS job will transfer from
        sink_bucket_name: The name of the bucket where the STS job will transfer to

    Returns:
        The name of the STS job as a string
    """

    now = datetime.date.today()
    transfer_job = {
        'description':
        'Move bucket {} to {} in project {}'.format(
            source_bucket_name, sink_bucket_name, target_project),
        'status': 'ENABLED',
        'projectId': target_project,
        'schedule': {
            'scheduleStartDate': {
                'day': now.day - 1,
                'month': now.month,
                'year': now.year
            },
            'scheduleEndDate': {
                'day': now.day - 1,
                'month': now.month,
                'year': now.year
            }
        },
        'transferSpec': {
            'gcsDataSource': {
                'bucketName': source_bucket_name
            },
            'gcsDataSink': {
                'bucketName': sink_bucket_name
            },
            "transferOptions": {
                "deleteObjectsFromSourceAfterTransfer": True,
            }
        }
    }
    result = sts_client.transferJobs().create(body=transfer_job).execute(
        num_retries=5)
    return result['name']


def _check_sts_job(spinner, sts_client, target_project, job_name):
    """Check on the status of the STS job.

    Args:
        spinner: The spinner displayed in the console
        sts_client: The STS client object to be used
        target_project: The name of the target project where the STS job will be created
        job_name: The name of the STS job that was created

    Returns:
        The status of the job as an StsJobStatus enum
    """

    filter_string = (
        '{{"project_id": "{project_id}", "job_names": ["{job_name}"]}}').format(
            project_id=target_project, job_name=job_name)

    result = sts_client.transferOperations().list(
        name='transferOperations', filter=filter_string).execute(num_retries=5)

    if result:
        operation = result['operations'][0]
        metadata = operation['metadata']
        if operation.get('done'):
            if metadata['status'] != 'SUCCESS':
                spinner.fail('X')
                return sts_job_status.StsJobStatus.failed

            _print_sts_counters(spinner, metadata['counters'], True)
            spinner.ok(_CHECKMARK)
            return sts_job_status.StsJobStatus.success
        else:
            # Update the status of the copy
            if 'counters' in metadata:
                _print_sts_counters(spinner, metadata['counters'], False)

    return sts_job_status.StsJobStatus.in_progress


def _print_sts_counters(spinner, counters, is_job_done):
    """Print out the current STS job counters.

    Args:
        spinner: The spinner displayed in the console
        counters: The counters object returned as part of the STS job status query
        is_job_done: If True, print out the final counters instead of just the in progress ones
    """

    if counters:
        bytes_copied_to_sink = counters.get('bytesCopiedToSink', '0')
        objects_copied_to_sink = counters.get('objectsCopiedToSink', '0')
        bytes_found_from_source = counters.get('bytesFoundFromSource', '0')
        objects_found_from_source = counters.get('objectsFoundFromSource', '0')
        bytes_deleted_from_source = counters.get('bytesDeletedFromSource', '0')
        objects_deleted_from_source = counters.get('objectsDeletedFromSource',
                                                   '0')

        if is_job_done:
            byte_status = (bytes_copied_to_sink == bytes_found_from_source ==
                           bytes_deleted_from_source)
            object_status = (objects_copied_to_sink == objects_found_from_source
                             == objects_deleted_from_source)

            if byte_status and object_status:
                new_text = 'Success! STS job copied {} bytes in {} objects'.format(
                    bytes_copied_to_sink, objects_copied_to_sink)
            else:
                new_text = (
                    'Error! STS job copied {} of {} bytes in {} of {} objects and deleted'
                    ' {} bytes and {} objects').format(
                        bytes_copied_to_sink, bytes_found_from_source,
                        objects_copied_to_sink, objects_found_from_source,
                        bytes_deleted_from_source, objects_deleted_from_source)

            if spinner.text != new_text:
                spinner.write(spinner.text)
                spinner.text = new_text
                _LOGGER.log_text(new_text)
        else:
            if bytes_copied_to_sink > 0 and objects_copied_to_sink > 0:
                byte_percent = '{:.0%}'.format(
                    float(bytes_copied_to_sink) /
                    float(bytes_found_from_source))
                object_percent = '{:.0%}'.format(
                    float(objects_copied_to_sink) /
                    float(objects_found_from_source))
                spinner.write(spinner.text)
                msg = '{} of {} bytes ({}) copied in {} of {} objects ({})'.format(
                    bytes_copied_to_sink, bytes_found_from_source, byte_percent,
                    objects_copied_to_sink, objects_found_from_source,
                    object_percent)
                spinner.text = msg
                _LOGGER.log_text(msg)


def _print_and_log(message):
    """Print the message and log it to the cloud.

    Args:
        message: The message to log
    """
    print(message)
    _LOGGER.log_text(message)


def _write_spinner_and_log(spinner, message):
    """Write the message to the spinner and log it to the cloud.

    Args:
        spinner: The spinner object to write the message to
        message: The message to print and log
    """
    spinner.write(message)
    _LOGGER.log_text(message)
