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

import os
import slack
import requests
import logging
from datetime import datetime
from get_firestore_cases import get_firestore_cases
from case_not_found import case_not_found
from googleapiclient.discovery import build_from_document
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def support_subscribe_email(channel_id, case, emails, user_id):
    """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    emails : str
        emails to be subscribed to the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    API_KEY = os.environ.get('API_KEY')
    MAX_RETRIES = 3

    # Get our discovery doc and build our service
    r = requests.get('https://cloudsupport.googleapis.com/$discovery/rest'
                     '?key={}&labels=V2_TRUSTED_TESTER&version=v2beta'.format(API_KEY))
    r.raise_for_status()
    support_service = build_from_document(r.json())

    client = slack.WebClient(token=os.environ.get('SLACK_TOKEN'))
    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text="Your request is processing ...")

    cases = get_firestore_cases()
    case_found = False

    for fs_case in cases:
        if case == fs_case['case_number']:
            case_found = True
            parent = fs_case['resource_name']
            body = {
                       "subscriberEmailAddresses": [emails]
                   }
            update_mask = 'case.subscriberEmailAddresses'
            req = support_service.cases().patch(name=parent, updateMask=update_mask, body=body)
            try:
                req.execute(num_retries=MAX_RETRIES)
            except BrokenPipeError as e:
                error_message = str(e) + ' : {}'.format(datetime.now())
                logger.error(error_message)
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text="Your attempt to change the subscriber email addresses has failed."
                         " Please try again later.")
            except HttpError as e:
                error_message = str(e) + ' : {}'.format(datetime.now())
                logger.error(error_message)
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text="Your attempt to change the subscriber email addresses has failed."
                         " Please confirm that 'Enable case sharing' is on in your"
                         " project's Support settings. If this setting was off, then for"
                         " this case you will need to ask support to add the email"
                         " addresses.")
            else:
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text=f"You have updated the subcscriber email addreses to {emails}")

    if case_found is False:
        case_not_found(channel_id, user_id, case)


if __name__ == "__main__":
    channel_id = os.environ.get('TEST_CHANNEL_ID')
    case = 'xxxxxxxx'
    emails = ["testaccount1@example.com", "testaccount2@example.com"]
    user_id = os.environ.get('TEST_USER_ID')
    support_subscribe_email(channel_id, case, emails, user_id)
    case = os.environ.get('TEST_CASE')
    support_subscribe_email(channel_id, case, emails, user_id)
