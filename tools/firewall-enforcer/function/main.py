# Copyright 2021 Google LLC
import logging
import base64
import json
import re
import time
from googleapiclient.discovery import build
import google.cloud.logging

logging_client = google.cloud.logging.Client()
logging_client.setup_logging()


def main(event, ctx):
    if 'data' not in event:
        raise

    payload = base64.b64decode(event['data']).decode('utf-8')
    payload = json.loads(payload)

    logging.debug(payload)
    data = payload['asset']['resource']['data']

    if should_delete(data):
        delete_rule(data)


def should_delete(data) -> bool:
    # Hook for deciding whether to delete a firewall rule

    # Do the sourceRanges allow all IPs
    return any('/0' in source_range for source_range in data['sourceRanges'])


def delete_rule(data):
    self_link = data['selfLink']
    project = re.search('projects/([\w-]+)/', self_link).group(1)
    firewall = re.search('firewalls/([\w-]+)', self_link).group(1)
    svc = build('compute', 'v1')
    svc.firewalls().delete(project=project, firewall=firewall)
    logging.info(f'Deleted firewall: {self_link}')
