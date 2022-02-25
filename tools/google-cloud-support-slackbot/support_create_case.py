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
from googleapiclient.discovery import build_from_document

logger = logging.getLogger(__name__)


def support_create_case(channel_id, user_id, user_name, display_name, description,
                        severity, classification_id, classification_display_name,
                        time_zone, project_number, test_case) -> str:
    """
    Creates a support case. This is meant for automated testing purposes as implementing
    this method in Slack would allow individuals to open cases in projects they don't have
    access to.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    user_name : str
        Slack user_name of the user that ran the command. Appended to the end of the
        justification to identify who submitted the escalation, otherwise all escalations
        will show as coming from the case creator
    display_name : str
        title for our case
    description : str
        description of our case
    severity : int
        the current priority of the case, represented as 1, 2, 3, 4
    classification_id : str
        unique id of the classification object
    classification_display_name : str
        details the category, component, and subcomponent
    time_zone : str
        the user's timezone
    project_number : str
        the unique project number
    test_case : bool
        flag for support to know if this is a test case

    Returns
    -------
    case
        unique id of the case
    """
    client = slack.WebClient(token=os.environ.get('SLACK_TOKEN'))
    MAX_RETRIES = 3
    API_KEY = os.environ.get('API_KEY')

    # Get our discovery doc and build our service
    r = requests.get('https://cloudsupport.googleapis.com/$discovery/rest'
                     '?key={}&labels=V2_TRUSTED_TESTER&version=v2beta'.format(API_KEY))
    r.raise_for_status()
    support_service = build_from_document(r.json())

    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text="Your request is processing ... ")

    signed_description = (description + '\n *Sent by {} via Google Cloud Support'
                          ' Slack bot'.format(user_name))
    body = {
               'display_name': display_name,
               'description': signed_description,
               'severity': severity,
               'classification': {
                   'id': '100H41Q3DTMN0TBKCKD0SGRFDLO7AT35412MSPR9DPII4229DPPN8OBECDIG',
                   'displayName': 'Compute \u003e Compute Engine \u003e Instance'
               },
               'time_zone': time_zone,
               'testCase': True
           }
    resource_name = 'projects/' + project_number
    req = support_service.cases().create(parent=resource_name, body=body)
    try:
        resp = req.execute(num_retries=MAX_RETRIES)
    except BrokenPipeError as e:
        error_message = str(e) + ' : {}'.format(datetime.now())
        logger.error(error_message)
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text="Your attempt to create a case may have failed. Please contact your"
                 " account team or try again later.")
    else:
        case = resp['name'].split('/')[-1]
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=f"You have created case {case}")
        return case


if __name__ == "__main__":
    channel_id = os.environ.get('TEST_CHANNEL_ID')
    user_id = os.environ.get('TEST_USER_ID')
    user_name = os.environ.get('TEST_USER_NAME')
    display_name = 'IGNORE -- Google Cloud Support Slackbot test'
    description = ('This is an automatically case created by the Google Cloud'
                   ' Support Slackbot. Please delete this case if it is open for'
                   ' more than 30 minutes')
    severity = 4
    classification_id = '100H41Q3DTMN0TBKCKD0SGRFDLO7AT35412MSPR9DPII4229DPPN8OBECDIG'
    classification_display_name = 'Compute \u003e Compute Engine \u003e Instance'
    time_zone = '-7:00'
    project_number = os.environ.get('TEST_PROJECT_NUMBER')
    test_case = True
    print(support_create_case(channel_id, user_id, user_name, display_name, description,
          severity, classification_id, classification_display_name, time_zone,
          project_number, test_case))
