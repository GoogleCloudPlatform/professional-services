#!/usr/bin/env python3
#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import os
import base64
import yaml
import json
import argparse
import logging
import socket
import hashlib
from time import mktime
from datetime import datetime, timezone, timedelta
import parsedatetime
from dateutil import parser
from filters import get_jinja_filters, get_jinja_tests
from jinja2 import Environment, TemplateError
from google.cloud import secretmanager, storage
from google.cloud.functions.context import Context
from pythonjsonlogger import jsonlogger
import traceback
from helpers.base import get_grpc_client_info

config_file_name = 'config.yaml'
execution_count = 0
configuration = None
logger = None


def load_configuration(file_name):
    if os.getenv('CONFIG'):
        logger = logging.getLogger('pubsub2inbox')
        secret_manager_url = os.getenv('CONFIG')
        if secret_manager_url.startswith('projects/'):
            logger.debug('Loading configuration from Secret Manager: %s' %
                         (secret_manager_url))
            client = secretmanager.SecretManagerServiceClient(
                client_info=get_grpc_client_info())
            response = client.access_secret_version(name=secret_manager_url)
            configuration = response.payload.data.decode('UTF-8')
        else:
            logger.debug('Loading configuration from bundled file: %s' %
                         (secret_manager_url))
            with open(secret_manager_url) as config_file:
                configuration = config_file.read()
    else:
        with open(file_name) as config_file:
            configuration = config_file.read()

    cfg = yaml.load(configuration, Loader=yaml.SafeLoader)
    return cfg


def get_jinja_escaping(template_name):
    if template_name and 'html' in template_name:
        return True
    return False


def get_jinja_environment():
    env = Environment(autoescape=get_jinja_escaping)
    env.globals = {**env.globals, **{'env': os.environ}}
    env.filters.update(get_jinja_filters())
    env.tests.update(get_jinja_tests())
    return env


class MessageTooOldException(Exception):
    pass


class NoResendConfigException(Exception):
    pass


class NoTypeConfiguredException(Exception):
    pass


class NoOutputsConfiguredException(Exception):
    pass


class NoDataFieldException(Exception):
    pass


def process_message(config, data, event, context):
    logger = logging.getLogger('pubsub2inbox')

    # Ignore messages submitted before our retry period
    retry_period = '2 days ago'
    if 'retryPeriod' in config:
        retry_period = config['retryPeriod']
    if retry_period != 'skip':
        retry_period_parsed = parsedatetime.Calendar().parse(retry_period)
        if len(retry_period_parsed) > 1:
            retry_earliest = datetime.fromtimestamp(
                mktime(retry_period_parsed[0]), timezone.utc)
        else:
            retry_earliest = datetime.fromtimestamp(mktime(retry_period_parsed),
                                                    timezone.utc)
        message_time = parser.parse(context.timestamp)
        if (message_time - retry_earliest) < timedelta(0, 0):
            logger.warning(
                'Ignoring message because it\'s past the retry period.',
                extra={
                    'event_id': context.event_id,
                    'retry_period': retry_period,
                    'retry_earliest': retry_earliest.strftime('%c'),
                    'event_timestamp': message_time
                })
            raise MessageTooOldException(
                'Ignoring message because it\'s past the retry period.')

    template_variables = {
        'data': data,
        'event': event,
        'context': context,
    }

    jinja_environment = get_jinja_environment()
    if 'processors' in config:
        for processor in config['processors']:
            config_key = None
            if isinstance(processor, dict):
                config_key = processor[
                    'config'] if 'config' in processor else None
                processor = processor['processor']

            logger.debug('Processing message using input processor: %s' %
                         processor)
            mod = __import__('processors.%s' % processor)
            processor_module = getattr(mod, processor)
            processor_class = getattr(processor_module,
                                      '%sProcessor' % processor.capitalize())
            processor_instance = processor_class(config, jinja_environment,
                                                 data, event, context)
            processor_variables = processor_instance.process(
                config_key=config_key)
            template_variables.update(processor_variables)
            jinja_environment.globals = {
                **jinja_environment.globals,
                **template_variables
            }

    if 'processIf' in config:
        processif_template = jinja_environment.from_string(config['processIf'])
        processif_template.name = 'processif'
        processif_contents = processif_template.render()
        if processif_contents.strip() == '':
            logger.info(
                'Will not send message because processIf evaluated to empty.')
            return

    if 'resendBucket' in config:
        if 'resendPeriod' not in config:
            raise NoResendConfigException(
                'No resendPeriod configured, even though resendBucket is set!')

        resend_key_hash = hashlib.sha256()
        if 'resendKey' not in config:
            default_resend_key = template_variables.copy()
            default_resend_key.pop('context')
            resend_key_hash.update(
                json.dumps(default_resend_key).encode('utf-8'))
        else:
            key_template = jinja_environment.from_string(config['resendKey'])
            key_template.name = 'resend'
            key_contents = key_template.render()
            resend_key_hash.update(key_contents.encode('utf-8'))

        resend_file = resend_key_hash.hexdigest()
        logger.debug('Checking for resend object in bucket...',
                     extra={
                         'bucket': config['resendBucket'],
                         'blob': resend_file
                     })

        storage_client = storage.Client(client_info=get_grpc_client_info())
        bucket = storage_client.bucket(config['resendBucket'])
        resend_blob = bucket.blob(resend_file)
        if resend_blob.exists():
            resend_blob.reload()
            resend_period = config['resendPeriod']
            resend_period_parsed = parsedatetime.Calendar().parse(
                resend_period, sourceTime=resend_blob.time_created)
            if len(resend_period_parsed) > 1:
                resend_earliest = datetime.fromtimestamp(
                    mktime(resend_period_parsed[0]))
            else:
                resend_earliest = datetime.fromtimestamp(
                    mktime(resend_period_parsed))

            if datetime.now() >= resend_earliest:
                logger.debug('Resending the message now.',
                             extra={
                                 'resend_earliest': resend_earliest,
                                 'blob_time_created': resend_blob.time_created
                             })
                resend_blob.upload_from_string('')
            else:
                logger.info(
                    'Can\'t resend the message now, resend period not elapsed.',
                    extra={
                        'resend_earliest': resend_earliest,
                        'blob_time_created': resend_blob.time_created
                    })
                return
        else:
            try:
                resend_blob.upload_from_string('', if_generation_match=0)
            except Exception as exc:
                # Handle TOCTOU condition
                if 'conditionNotMet' in str(exc):
                    logger.warning(
                        'Message (re)sending already in progress (resend key already exist).',
                        extra={'exception': exc})
                    return
                else:
                    raise exc
                return

    if 'outputs' in config:
        for output_config in config['outputs']:
            if 'type' not in output_config:
                raise NoTypeConfiguredException(
                    'No type configured for output!')

            if 'processIf' in output_config:
                processif_template = jinja_environment.from_string(
                    output_config['processIf'])
                processif_template.name = 'processif'
                processif_contents = processif_template.render()
                if processif_contents.strip() == '':
                    logger.info(
                        'Will not use output processor %s because processIf evaluated to empty.'
                        % output_config['type'])
                continue

            logger.debug('Processing message using output processor: %s' %
                         output_config['type'])

            output_type = output_config['type']
            mod = __import__('output.%s' % output_type)
            output_module = getattr(mod, output_type)
            output_class = getattr(output_module,
                                   '%sOutput' % output_type.capitalize())
            output_instance = output_class(config, output_config,
                                           jinja_environment, data, event,
                                           context)
            try:
                output_instance.output()
            except Exception as exc:
                logger.error('Output processor %s failed, trying next...' %
                             (output_type),
                             extra={'exception': traceback.format_exc()})
                if 'allOutputsMustSucceed' in config and config[
                        'allOutputsMustSucceed']:
                    raise exc

    else:
        raise NoOutputsConfiguredException('No outputs configured!')


def decode_and_process(logger, config, event, context):
    if not 'data' in event:
        raise NoDataFieldException('No data field in Pub/Sub message!')

    logger.debug('Decoding Pub/Sub message...',
                 extra={
                     'event_id': context.event_id,
                     'timestamp': context.timestamp,
                     'hostname': socket.gethostname(),
                     'pid': os.getpid()
                 })
    data = base64.b64decode(event['data']).decode('raw_unicode_escape')

    logger.debug('Starting Pub/Sub message processing...',
                 extra={
                     'event_id': context.event_id,
                     'data': data,
                     'attributes': event['attributes']
                 })
    process_message(config, data, event, context)
    logger.debug('Pub/Sub message processing finished.',
                 extra={'event_id': context.event_id})


def process_pubsub(event, context):
    """Function that is triggered by Pub/Sub incoming message.
    Args:
         event (dict):  The dictionary with data specific to this type of
         event. The `data` field contains the PubsubMessage message. The
         `attributes` field will contain custom attributes if there are any.
         context (google.cloud.functions.Context): The Cloud Functions event
         metadata. The `event_id` field contains the Pub/Sub message ID. The
         `timestamp` field contains the publish time.
    """
    global execution_count, configuration, logger
    execution_count += 1

    if not logger:
        logger = setup_logging()
    logger.debug('Received a Pub/Sub message.',
                 extra={
                     'event_id': context.event_id,
                     'timestamp': context.timestamp,
                     'hostname': socket.gethostname(),
                     'pid': os.getpid(),
                     'execution_count': execution_count
                 })
    socket.setdefaulttimeout(10)
    if not configuration:
        configuration = load_configuration(config_file_name)
    try:
        decode_and_process(logger, configuration, event, context)
    except TemplateError as exc:
        logger.error('Error while evaluating a Jinja2 template!',
                     extra={
                         'message': exc.message(),
                         'error': str(exc),
                     })
        raise exc
    except MessageTooOldException:
        pass


def setup_logging():
    logger = logging.getLogger('pubsub2inbox')
    if os.getenv('LOG_LEVEL'):
        logger.setLevel(int(os.getenv('LOG_LEVEL')))
    else:
        logger.setLevel(logging.INFO)
    json_handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    json_handler.setFormatter(formatter)
    logger.addHandler(json_handler)
    return logger


if __name__ == '__main__':
    arg_parser = argparse.ArgumentParser(
        description='Pub/Sub to Inbox, turn Pub/Sub messages into emails')
    arg_parser.add_argument('--config', type=str, help='Configuration file')
    arg_parser.add_argument(
        '--ignore-period',
        action='store_true',
        help='Ignore the message timestamp (for skipping retry period)')
    arg_parser.add_argument('message',
                            type=str,
                            help='JSON file containing the message(s)')
    args = arg_parser.parse_args()
    if args.config:
        config_file_name = args.config
    with open(args.message) as f:
        contents = f.read()
        messages = json.loads(contents)
        for message in messages:
            event = {
                'data':
                    message['message']['data'],
                'attributes':
                    message['message']['attributes']
                    if 'attributes' in message['message'] else {}
            }
            context = Context(eventId=message['message']['messageId'],
                              timestamp=message['message']['publishTime'])
            if args.ignore_period:
                context.timestamp = datetime.utcnow().strftime(
                    '%Y-%m-%dT%H:%M:%S.%fZ')
            process_pubsub(event, context)
