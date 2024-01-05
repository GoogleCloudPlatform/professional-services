from datetime import datetime

from google.cloud import storage_transfer

def create_scheduled_aws_transfer(
        project_id: str, description: str,
        source_bucket: str, aws_access_key_id: str,
        aws_secret_access_key: str, sink_bucket: str):
        pass


def create_immediate_one_time_aws_transfer(
        project_id: str, description: str,
        source_bucket: str, aws_access_key_id: str,
        aws_secret_access_key: str, sink_bucket: str):
    """Creates a one-time transfer job from Amazon S3 to Google Cloud
    Storage."""

    client = storage_transfer.StorageTransferServiceClient()

    now = datetime.utcnow()
    # Setting the start date and the end date as
    # the same time creates a one-time transfer
    one_time_schedule = {
        'day': now.day,
        'month': now.month,
        'year': now.year
    }

    transfer_job_request = storage_transfer.CreateTransferJobRequest({
        'transfer_job': {
            'project_id': project_id,
            'description': description,
            'status': storage_transfer.TransferJob.Status.ENABLED,
            'schedule': {
                'schedule_start_date': one_time_schedule,
                'schedule_end_date': one_time_schedule
            },
            'transfer_spec': {
                'aws_s3_data_source': {
                    'bucket_name': source_bucket,
                    'aws_access_key': {
                        'access_key_id': aws_access_key_id,
                        'secret_access_key': aws_secret_access_key,
                    }
                },
                'gcs_data_sink': {
                    'bucket_name': sink_bucket,
                }
            }
        }
    })

    result = client.create_transfer_job(transfer_job_request)
    print(f'Created transferJob: {result.name}')
