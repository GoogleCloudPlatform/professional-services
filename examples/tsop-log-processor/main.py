import base64
import json

from google.cloud import logging
from google.cloud import storage


def read_pubsub(event, context):
    """
    Triggered from a message on a Cloud Pub/Sub topic.
    """
    pubsub_message = json.loads(base64.b64decode(event['data']).decode('utf-8'))
    object_name = pubsub_message.get('name')
    bucket_name = pubsub_message.get('bucket')
    contents = download_object_into_memory(bucket_name, object_name)
    logs = parse_and_prepare_messages(contents)
    logging_client = logging.Client()
    for log in logs:
        write_transfer_log(log, logging_client)


def parse_and_prepare_messages(log_content):
    log_messages = []
    raw_logs = log_content.strip(b'\n').split(b"\n")
    header = raw_logs[0].strip(b'\n').split(b"\t")
    for index in range(1, len(raw_logs)):
        message_fields = raw_logs[index].strip(b'\n').split(b"\t")
        prepared_message = dict(list(zip(header, message_fields)))
        log_messages.append(prepared_message)
    return log_messages


def download_object_into_memory(bucket_name, object_name):
    """Downloads a object into memory."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    contents = blob.download_as_string()
    return contents


def write_transfer_log(message, logging_client):
    """Writes log entries."""
    message = {
        key.decode('utf-8'): value.decode('utf-8')
        for key, value in message.items()
    }
    logger = logging_client.logger('tsop-transfer-logs')
    logger.log_struct(message)