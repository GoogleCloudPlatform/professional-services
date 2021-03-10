"""
 Copyright 2021 Google LLC. This software is provided as-is, without warranty
 or representation for any use or purpose. Your use of it is subject to your
 agreement with Google.
"""
import base64
import json
import logging
import os
import re
import sys
import time
import traceback
from googleapiclient import discovery
from datetime import datetime, timezone
from dateutil import parser

default_log_config = '{"aggregationInterval" : "INTERVAL_5_SEC", ' \
    '"flowSampling" : "0.75", "metadata" : "INCLUDE_ALL_METADATA"}'


def main(event, context):
    """
  Main entry point of the Cloud Function. Will extract the subnet information
  from the PubSub event, and enable VPC flow logs if needed.
  """
    if not 'data' in event:
        logging.error('no data found. Ignoring event.')
        return

    pubsub_message = base64.b64decode(event['data']).decode('utf-8')
    json_msg = None
    try:
        json_msg = json.loads(pubsub_message)
    except ValueError:  # includes simplejson.decoder.JSONDecodeError
        logging.error('invalid pubsub message: %s', pubsub_message)
        return

    subnet = parse_payload(json_msg)

    if context is not None and too_old(context):
        logging.error('ignoring subnet change. Too old.')
        return

    if not subnet:
        return

    logging.info('subnet ID: /projects/%s/regions/%s/subnetworks/%s.',
                 subnet['project'], subnet['region'], subnet['subnetwork'])
    enable_flow_logs(subnet['project'], subnet['region'], subnet['subnetwork'])


def parse_payload(json_msg):
    """
  Extract the subnet information from the json payload.
  """
    project = region = subnetwork = None

    # Stackdriver change notification
    if 'resource' in json_msg and 'type' in json_msg['resource'] and json_msg[
            'resource']['type'] == 'gce_subnetwork':
        project = json_msg['resource']['labels']['project_id']
        region = json_msg['resource']['labels']['location']
        subnetwork = json_msg['resource']['labels']['subnetwork_name']
        logging.info('got subnet change notification from Cloud Logging')
    # Cloud Asset Inventory change notification
    elif 'asset' in json_msg and 'assetType' in json_msg['asset'] and \
            json_msg['asset']['assetType'] == \
    'compute.googleapis.com/Subnetwork':
        logging.info(
            'got subnet change notification from Cloud Asset Inventory')
        if 'resource' in json_msg['asset'] and \
                'data' in json_msg['asset']['resource']:
            if 'enableFlowLogs' in json_msg['asset']['resource']['data']:
                if json_msg['asset']['resource']['data']['enableFlowLogs']:
                    logging.info('log config already enabled in %s.',
                                 (json_msg['asset']['name']))
                    return None
            # extract the subnet id from the asset name
            for elem in ['project', 'region', 'subnetwork']:
                m = re.search(r'/%s/([^/]+)' % (elem + 's'),
                              json_msg['asset']['name'])
                if m:
                    if elem == 'project':
                        project = m.group(1)
                    elif elem == 'region':
                        region = m.group(1)
                    elif elem == 'subnetwork':
                        subnetwork = m.group(1)
    else:
        logging.error('event type is not gce_subnetwork. Ignoring event: %s',
                      (str(json_msg)))
        return None

    return {'project': project, 'region': region, 'subnetwork': subnetwork}


def enable_flow_logs(project, region, subnetwork):
    """
  Enable flow logs in a subnetwork using the log configuration provided in the
  LOG_CONFIG environment variable.
  """
    # Initialize the compute API
    service = discovery.build('compute', 'v1', cache_discovery=False)

    # get the current subnet data
    get_request = service.subnetworks().get(project=project,
                                            region=region,
                                            subnetwork=subnetwork)
    try:
        response = get_request.execute()
    except Exception as e:  # pylint: disable=broad-except
        # Replace new lines with spaces so as to prevent several entries which
        # would trigger several errors.
        error_message = traceback.format_exc().replace('\n', '  ')
        logging.error('can\'t get subnet information: %s', error_message)
        time.sleep(3)  # currently required because of b/155636171
        raise e

    # check if flow logs are enabled
    logs_enabled = False
    if 'enableFlowLogs' in response and response['enableFlowLogs']:
        logs_enabled = True
    if 'logConfig' in response and 'enable' in response[
            'logConfig'] and not response['logConfig']['enable']:
        logs_enabled = False

    if logs_enabled:
        logging.info(
            'log config already enabled in subnetwork /projects/%s/'
            'regions/%s/subnetworks/%s.', project, region, subnetwork)
    else:
        vpc_log_config = os.getenv('LOG_CONFIG', default_log_config)

        logging.info(
            'enabling flow logs in subnetwork /projects/%s/regions/'
            '%s/subnetworks/%s.', project, region, subnetwork)
        log_config = json.loads(vpc_log_config)
        log_config['enable'] = True
        subnetwork_body = {
            'fingerprint': response['fingerprint'],
            'logConfig': log_config
        }

        # Wait for a few seconds before attempting to update the subnet. It may
        # notbe ready yet.
        time.sleep(10)

        patch_request = service.subnetworks().patch(project=project,
                                                    region=region,
                                                    subnetwork=subnetwork,
                                                    body=subnetwork_body)
        try:
            patch_response = patch_request.execute()
        except Exception as e:  # pylint: disable=broad-except
            # Replace new lines with spaces so as to prevent several entries
            # which would trigger several errors.
            error_message = traceback.format_exc().replace('\n', '  ')
            logging.error('can\'t update subnet: %s', error_message)
            time.sleep(3)  # currently required because of b/155636171
            raise e
        if 'status' in patch_response and patch_response['status'] == 'DONE':
            logging.info(
                'flow logs successfully enabled in subnetwork '
                '/projects/%s/regions/%s/subnetworks/%s.', project, region,
                subnetwork)


def too_old(context):
    """
  Check if the timestamp of the message is older than a given threshold. This
  will avoid infinite retry loops in case of failure.
  See: https://cloud.google.com/functions/docs/bestpractices/retries
  """
    timestamp = context.timestamp
    event_time = parser.parse(timestamp)
    event_age = (datetime.now(timezone.utc) - event_time).total_seconds()
    event_age_ms = event_age * 1000

    # Ignore events that are too old
    max_age_ms = 60000
    return event_age_ms > max_age_ms


# Main block for manually testing the CF using some sample log file extracted
# from stackdriver:
#   virtualenv --python python3 env
#   source env/bin/activate
#   pip3 install -r requirements.txt
#   python3 main.py ../../sample_logs/insert_subnet_call_last.json
# or
#   python3 main.py ../../sample_logs/asset_inventory.json
if __name__ == '__main__':
    logfile = sys.argv[1]
    logging.getLogger().setLevel(getattr(logging, 'INFO'))
    FORMAT = '%(asctime)-15s %(levelname)s %(message)s'
    logging.basicConfig(format=FORMAT)

    logging.info('reading sample message from: %s', (logfile))
    with open(logfile, 'r') as file:
        data = file.read()
        data64 = base64.b64encode(data.encode('utf-8'))
        main({'data': data64}, None)
