#!/usr/bin/env python3

# Copyright 2022 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import slack
import os
import requests
import logging
import multiprocessing as mp
from flask import Flask, request, Response
from slackeventsapi import SlackEventAdapter
from googleapiclient.discovery import build_from_document
from datetime import datetime
from gevent.pywsgi import WSGIServer
from case_details import case_details
from case_updates import case_updates
from get_firestore_tracked_cases import get_firestore_tracked_cases
from list_tracked_cases import list_tracked_cases
from list_tracked_cases_all import list_tracked_cases_all
from post_help_message import post_help_message
from sitrep import sitrep
from stop_tracking import stop_tracking
from support_add_comment import support_add_comment
from support_change_priority import support_change_priority
from support_close_case import support_close_case
from support_escalate import support_escalate
from support_subscribe_email import support_subscribe_email
from track_case import track_case

# To run this on the cheapest possible VM, we will only log Warnings and Errors
logging.basicConfig(filename='error.log')
logger = logging.getLogger('werkzeug')
logger.setLevel(logging.WARNING)

logging.warning('Started at: {}'.format(datetime.now()))

app = Flask(__name__)

client = slack.WebClient(token=os.environ.get('SLACK_TOKEN'))
ORG_ID = os.environ.get('ORG_ID')
SLACK_SIGNING_SECRET = os.environ.get('SIGNING_SECRET')
API_KEY = os.environ.get('API_KEY')
MAX_RETRIES = 3

slack_events = SlackEventAdapter(SLACK_SIGNING_SECRET, "/slack/events", app)

# Get our discovery doc and build our service
r = requests.get('https://cloudsupport.googleapis.com/$discovery/rest'
                 '?key={}&labels=V2_TRUSTED_TESTER&version=v2beta'
                 .format(API_KEY))
r.raise_for_status()
support_service = build_from_document(r.json())

tracked_cases = get_firestore_tracked_cases()


# Handle all calls to the support bot
@app.route('/google-cloud-support', methods=['POST'])
def gcp_support() -> Response:
    """
    Takes a user's slash command from Slack and executes it. Multiprocessing is used
    on commands that modify the case to prevent Slack timeouts.

    Parameters
    ----------
    request : Request
        message and metadata that was submitted by Slack
    Returns
    -------
    Response
        tells Slack that the command was received and not to throw a timeout alert
    200
        HTTP 200 OK
    403
        HTTP 403 Forbidden, received if the request signature can't be verified
    """
    # Verify that the request is coming from our Slack
    slack_timestamp = request.headers.get('X-Slack-Request-Timestamp')
    slack_signature = request.headers.get('X-Slack-Signature')
    result = slack_events.server.verify_signature(slack_timestamp, slack_signature)
    if result is False:
        return Response(), 403

    data = request.form
    channel_id = data.get('channel_id')
    channel_name = data.get('channel_name')
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    user_inputs = data.get('text').split(' ', 1)
    command = user_inputs[0]

    if command == 'track-case':
        try:
            case = user_inputs[1]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The track-case command expects argument [case_number]."
                     " The case number provided did not match with any cases in your org")
        track_case(channel_id, channel_name, case, user_id)
    elif command == 'add-comment':
        try:
            parameters = user_inputs[1].split(' ', 1)
            case = parameters[0]
            comment = parameters[1]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The add-comment command expects arguments [case_number] [comment]."
                     " The comment does not need to be encapsulated in quotes."
                     " Your case number did not match with any cases in your org.")
        p = mp.Process(
            target=support_add_comment,
            args=(channel_id, case, comment, user_id, user_name,))
        p.start()
    elif command == 'change-priority':
        try:
            parameters = user_inputs[1].split(' ', 1)
            case = parameters[0]
            priority = parameters[1]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The change-priority command expects arguments "
                     "[case_number] [priority, must be either P1|P2|P3|P4]."
                     " Your case number did not match with any cases in your org,"
                     " or the priority did not match the expected values.")
        p = mp.Process(
            target=support_change_priority,
            args=(channel_id, case, priority, user_id,))
        p.start()
    elif command == 'subscribe':
        try:
            parameters = user_inputs[1].split(' ', 1)
            case = parameters[0]
            emails = parameters[1].split()
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The subscribe command expects arguments "
                     "[case_number] [email_1] ... [email_n]."
                     " Your case number did not match with any cases in your org,"
                     " or your command did not match the expected input format.")
        p = mp.Process(
            target=support_subscribe_email,
            args=(channel_id, case, emails, user_id,))
        p.start()
    elif command == 'escalate':
        try:
            parameters = user_inputs[1].split(' ', 2)
            case = parameters[0]
            reason = parameters[1]
            justification = parameters[2]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The escalate command expects arguments "
                     "[reason, must be either RESOLUTION_TIME|TECHNICAL_EXPERTISE"
                     "|BUSINESS_IMPACT] [justification]. The justification does not need to"
                     " be encapsulated in quotes. Either your case number did not match with"
                     " any cases in your org, the reason did not match one of the expected"
                     " values, or the justification was missing")
            p = mp.Process(
                target=support_escalate,
                args=(channel_id, case, user_id, reason, justification, user_name))
            p.start()
    elif command == 'close-case':
        try:
            case = user_inputs[1]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The close-case command expects arguments [case_number]")
        support_close_case(channel_id, case, user_id)
    elif command == 'stop-tracking':
        try:
            case = user_inputs[1]
        except IndexError as e:
            error_message = str(e) + ' : {}'.format(datetime.now())
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The stop-tracking command expects arguments [case_number].")
        stop_tracking(channel_id, channel_name, case, user_id)
    elif command == 'list-tracked-cases':
        list_tracked_cases(channel_id, channel_name, user_id)
    elif command == 'list-tracked-cases-all':
        list_tracked_cases_all(channel_id, user_id)
    elif command == 'case-details':
        case = user_inputs[1]
        case_details(channel_id, case, user_id)
    elif command == 'sitrep':
        sitrep(channel_id, user_id)
    elif command == 'help':
        context = ''
        post_help_message(channel_id, user_id, context)
    else:
        context == "Sorry, that wasn't a recognized command. "
        post_help_message(channel_id, user_id, context)

    return Response(), 200


if __name__ == "__main__":
    mp.set_start_method('spawn')
    p = mp.Process(target=case_updates, args=(False,))
    p.start()
    http_server = WSGIServer(('', 5000), app)
    http_server.serve_forever()
    p.join()
