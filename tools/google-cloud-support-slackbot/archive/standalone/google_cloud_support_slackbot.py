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
import json
import requests
import time
import re
import logging
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, request, Response
from slackeventsapi import SlackEventAdapter
from multiprocessing import Process
from googleapiclient.discovery import build_from_document
from datetime import datetime
from gevent.pywsgi import WSGIServer

# To run this on the cheapest possible VM, we will only log Warnings and Errors
logging.basicConfig(filename='error.log')
flask_logger = logging.getLogger('werkzeug')
flask_logger.setLevel(logging.WARNING)

logging.warning('Started at: {}'.format(datetime.now()))

# Load our environment variables from the .env file
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)

client = slack.WebClient(token=os.environ['SLACK_TOKEN'])
ORG_ID = os.environ['ORG_ID']
SLACK_SIGNING_SECRET = os.environ['SIGNING_SECRET']
API_KEY = os.environ['API_KEY']
MAX_RETRIES = 3

slack_events = SlackEventAdapter(SLACK_SIGNING_SECRET, "/slack/events", app)

# Get our discovery doc and build our service
r = requests.get(
    'https://cloudsupport.googleapis.com/$discovery/rest?key={}&labels=V2_TRUSTED_TESTER&version=v2alpha'
    .format(API_KEY))
r.raise_for_status()
support_service = build_from_document(r.json())

cases_file = 'support_cases.json'
tracked_cases_file = 'tracked_cases.json'
tracked_cases = []

if os.path.exists(tracked_cases_file):
    with open(tracked_cases_file) as tcf:
        try:
            tracked_cases_json = json.load(tcf)
        except json.decoder.JSONDecodeError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
        else:
            for tracked_case in tracked_cases_json:
                tracked_cases.append(tracked_case)


class SupportCase:
    """
    Represent a Google Cloud Support Case.

    Attributes
    ----------
    case_number : str
        a unique string of numbers that is the id for the case
    resource_name : str
        a unique string including the org or project id and the case id examples:
        organizations/12345/cases/67890
        projects/12345/cases/67890
    case_title : str
        the title the user gave the case when they created it
    description : str
        the user's description of the case as provided in the support ticket
    escalated : bool
        whether or not a case has been escalated. This field doesn't exist in 
        the response until after a case has been escalated. True means the case
        is escalated
    case_creator : str
        name of the user that opened the support case
    create_time : str
        timestamp of when the case was created
    update_time : str
        timestamp of the last update made to the case
    priority : str
        the current priority of the case, represented as S0, S1, S2, S3, or S4
    state : str
        the status of the support ticket. Can be NEW, IN_PROGRESS_GOOGLE_SUPPORT,
        ACTION_REQUIRED, SOLUTION_PROVIDED, or CLOSED
    comment_list : list
        all public comments made on the case as strings. Comments are sorted with
        newest comments at the top
    """

    def __init__(self, caseobj):
        """
        Parameters
        ----------
        caseobj : json
            json for an individual case
        """
        self.case_number = re.search('(?:cases/)([0-9]+)', caseobj['name'])[1]
        self.resource_name = caseobj['name']
        self.case_title = caseobj['displayName']
        self.description = caseobj['description']
        if 'escalated' in caseobj:
            self.escalated = caseobj['escalated']
        else:
            self.escalated = False
        self.case_creator = caseobj['creator']['displayName']
        self.create_time = str(
            datetime.fromisoformat(caseobj['createTime'].replace('Z',
                                                                 '+00:00')))
        self.update_time = str(
            datetime.fromisoformat(caseobj['updateTime'].replace('Z',
                                                                 '+00:00')))
        self.priority = caseobj['severity'].replace('S', 'P')
        self.state = caseobj['state']
        self.comment_list = []
        case_comments = support_service.cases().comments()
        request = case_comments.list(parent=self.resource_name)
        while request is not None:
            try:
                comments = request.execute(num_retries=MAX_RETRIES)
            except BrokenPipeError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                time.sleep(1)
            else:
                if "comments" in comments:
                    for comment in comments['comments']:
                        self.comment_list.append(comment)
                request = case_comments.list_next(request, comments)


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
    result = slack_events.server.verify_signature(slack_timestamp,
                                                  slack_signature)
    if result == False:
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
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The track-case command expects argument [case_number]."
                " The case number provided did not match with any cases in your org"
            )
        track_case(channel_id, channel_name, case, user_id)
    elif command == 'add-comment':
        try:
            parameters = user_inputs[1].split(' ', 1)
            case = parameters[0]
            comment = parameters[1]
        except IndexError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=
                "The add-comment command expects arguments [case_number] [comment]."
                " The comment does not need to be encapsulated in quotes."
                " Your case number did not match with any cases in your org.")
        p = Process(target=add_comment,
                    args=(
                        channel_id,
                        case,
                        comment,
                        user_id,
                        user_name,
                    ))
        p.start()
    elif command == 'change-priority':
        try:
            parameters = user_inputs[1].split(' ', 1)
            case = parameters[0]
            priority = parameters[1]
        except IndexError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The change-priority command expects arguments "
                "[case_number] [priority, must be either P1|P2|P3|P4]."
                " Your case number did not match with any cases in your org, or the priority did not match the expected values."
            )
        p = Process(target=change_priority,
                    args=(
                        channel_id,
                        case,
                        priority,
                        user_id,
                    ))
        p.start()
    elif command == 'escalate':
        escalate_disabled = True  # Escalate isn't working right now so it will be disabled until we can fix in v1
        if escalate_disabled == False:
            try:
                parameters = user_inputs[1].split(' ', 2)
                case = parameters[0]
                reason = parameters[1]
                justification = parameters[2]
            except IndexError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text="The escalate command expects arguments "
                    "[reason, must be either REASON_UNSPECIFIED|RESOLUTION_TIME|TECHNICAL_EXPERTISE|BUSINESS_IMPACT] [justification]."
                    " The justification does not need to be encapsulated in quotes."
                    " Either your case number did not match with any cases in your org, the reason did not match one "
                    "of the expected values, or the justification was missing")
            p = Process(target=escalate,
                        args=(channel_id, case, user_id, reason, justification,
                              user_name))
            p.start()
    elif command == 'stop-tracking':
        try:
            case = user_inputs[1]
        except IndexError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="The stop-tracking command expects arguments [case_number]."
            )
        stop_tracking(channel_id, channel_name, case, user_id)
    elif command == 'close-case':
        close_disabled = True  # Close isn't an available command so it will be disabled until the API is ready
        if close_disabled == False:
            try:
                case = user_inputs[1]
            except IndexError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text="The close-case command expects arguments [case_number]"
                )
            close_case(channel_id, case, user_id)
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


def post_help_message(channel_id, user_id, context):
    """
    Informs the user of the app's available commands.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    context : str
        Extra information to go with the help message. Usually a statement of a command not existing
    """
    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text=f"{context}Here are the available commands:"
        "\n/google-cloud-support track-case [case number] -- case updates will be posted to this channel"
        "\n/google-cloud-support add-comment [case number] [comment] -- adds a comment to the case"
        "\n/google-cloud-support change-priority [case number] [priority, e.g. P1] -- changes the priority of the case"
        "\n/google-cloud-support stop-tracking [case number] -- case updates will no longer be posted to this channel"
        "\n/google-cloud-support list-tracked-cases -- lists all cases being tracked in this channel"
        "\n/google-cloud-support list-tracked-cases-all -- lists all cases being tracked in the workspace"
        "\n/google-cloud-support case-details [case_number] -- pull all of the case deta as json"
        "\n/google-cloud-support sitrep -- report of all active cases in the org"
    )


def case_not_found(channel_id, user_id, case):
    """
    Informs the user of their case could not be found.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    case : str
        unique id of the case
    """
    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text=f"Case {case} could not be found in your org."
        " If this case was recently created, please give the system 60 seconds to fetch it."
        " Otherwise, double check your case number or confirm the org being tracked with your Slack admin."
    )


def track_case(channel_id, channel_name, case, user_id):
    """
    Add a Google Cloud support case to a list of tracked cases. If the case can't be
    found in the list of active support cases, notify the user.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    channel_name : str
        designated channel name of the channel. For users to understand where their
        cases are being tracked in Slack
    case : str
        unique id of the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    parent = get_parent(case)
    if parent == 'Case not found':
        case_not_found(channel_id, user_id, case)
    else:
        tracker = {
            "channel_id": channel_id,
            "case": case,
            "channel_name": channel_name
        }

        exists = False

        for tc in tracked_cases:
            if tc['channel_id'] == channel_id and tc['case'] == case:
                exists = True
                break

        if exists == False:
            tracked_cases.append(tracker)

            try:
                file_overwrite(tracked_cases_file, tracked_cases)
            except OSError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                time.sleep(0.1)
                file_overwrite(tracked_cases_file, tracked_cases)

            client.chat_postMessage(
                channel=channel_id,
                text=f"{channel_name} is now tracking case {case}")
        else:
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=f"Case {case} is already being tracked in {channel_name}")


def add_comment(channel_id, case, comment, user_id, user_name):
    """
    Add a comment to a Google Cloud support case.
    
    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    comment : str
        comment to be added to the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    user_name : str
        Slack user_name of the user that ran the command. Appended to the end of the
        comment to identify who submitted submitted it, otherwise all comments will
        show as coming from the case creator
    """
    client.chat_postEphemeral(channel=channel_id,
                              user=user_id,
                              text="Your request is processing ...")
    parent = get_parent(case)

    if parent == 'Case not found':
        case_not_found(channel_id, user_id, case)
    else:
        req_body = {
            "body":
                comment +
                '\n*Comment submitted by {} via Google Cloud Support Slack bot*'
                .format(user_name)
        }
        req = support_service.cases().comments().create(parent=parent,
                                                        body=req_body)
        try:
            req.execute(num_retries=MAX_RETRIES)
        except BrokenPipeError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text="Your comment may not have posted. Please try again later."
            )
        else:
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=f"You added a new comment on case {case}: {comment}")


def change_priority(channel_id, case, priority, user_id):
    """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    priority : str
        the current priority of the case, represented as S0, S1, S2, S3, or S4
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    client.chat_postEphemeral(channel=channel_id,
                              user=user_id,
                              text="Your request is processing ...")
    parent = get_parent(case)
    if parent == 'Case not found':
        case_not_found(channel_id, user_id, case)
    else:
        body = {"severity": priority.replace("P", "S")}
        update_mask = "case.severity"
        req = support_service.cases().patch(name=parent,
                                            updateMask=update_mask,
                                            body=body)
        try:
            req.execute(num_retries=MAX_RETRIES)
        except BrokenPipeError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=
                "Your attempt to change the case priority has failed. Please try again later."
            )
        else:
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=
                f"You have changed the priority of case {case} to {priority}.")


def escalate(channel_id, case, user_id, reason, justification, user_name):
    """
    Escalates a Google Cloud support case, setting the escalated boolean to True.
    This code is currently disabled and we will look to include a working version
    of it in the v1 release of the bot.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    reason : str
        reason for the escalation. Must be a value of either REASON_UNSPECIFIED, 
        RESOLUTION_TIME, TECHNICAL_EXPERTISE, or BUSINESS_IMPACT
    justification : str
        user submitted string justifying the need for an escalation
    user_name : str
        Slack user_name of the user that ran the command. Appended to the end of the
        justification to identify who submitted the escalation, otherwise all escalations 
        will show as coming from the case creator
    """
    client.chat_postEphemeral(channel=channel_id,
                              user=user_id,
                              text="Your request is processing ... ")
    parent = get_parent(case)
    if parent == 'Case not found':
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=
            f"Case {case} could not be found in your org. If this case was recently created, please give the system 60 seconds to fetch it. Otherwise, double check your case number or confirm the org being tracked with your Slack admin."
        )
    else:
        signed_justification = justification + '\n *Sent by {} via Google Cloud Support Slack bot'.format(
            user_name)
        body = {
            'escalation': {
                'reason': reason,
                'justification': signed_justification
            }
        }
        req = support_service.cases().escalate(name=parent, body=body)
        try:
            req.execute(num_retries=MAX_RETRIES)
        except BrokenPipeError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=
                "Your attempt to escalate may have failed. Please contact your account team or try again later."
            )
        else:
            client.chat_postEphemeral(channel=channel_id,
                                      user=user_id,
                                      text=f"You have escalated case {case}")


def stop_tracking(channel_id, channel_name, case, user_id):
    """
    Remove a case from the list of tracked Google Cloud support cases.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    channel_name : str
        user designated channel name. For users to understand where their cases are being 
        tracked in Slack
    case : str
        unique id of the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    exists = False
    for tc in tracked_cases:
        if tc['channel_id'] == channel_id and tc['case'] == case:
            tracked_cases.remove(tc)

            try:
                file_overwrite(tracked_cases_file, tracked_cases)
            except OSError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                time.sleep(0.2)
                file_overwrite(tracked_cases_file, tracked_cases)

            exists = True
            break

    if exists == True:
        client.chat_postMessage(
            channel=channel_id,
            text=f"Case {case} is no longer being tracked in {channel_name}")
    else:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=f"Case {case} not found in tracker for {channel_name}")


# Close a given support case, this API is not yet available
def close_case(channel_id, case, user_id):
    """
    Closes a Google Cloud support case.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text=f"You have closed case {case} and it will no longer be tracked")

    # Notify the channels tracking this case that the case has been closed and then remove the case
    # the case from the tracker for that channel
    for tc in tracked_cases:
        if tc['case'] == case:
            client.chat_postMessage(
                channel=tc['channel_id'],
                text=f"Case {case} has been closed and will no longer be tracked"
            )
            tracked_cases.remove(tc)


def list_tracked_cases(channel_id, channel_name, user_id):
    """
    Display all of the tracked Google Cloud support cases for the current channel
    to the user that submitted the command.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    channel_name : str
        user designated channel name. For users to understand where their cases are being 
        tracked in Slack
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    local_tracked_cases = []
    for tc in tracked_cases:
        if tc['channel_id'] == channel_id:
            local_tracked_cases.append(tc['case'])
    if len(local_tracked_cases) > 0:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=f"Currently tracking cases {local_tracked_cases}")
    else:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text="There are no cases currently being tracked in this channel")


def list_tracked_cases_all(channel_id, user_id):
    """
    Display all the Google Cloud support cases being tracked in the Slack worskpace
    to the user that submitted the command.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    all_tracked_cases = []
    for tc in tracked_cases:
        temp = {"channel": tc['channel_name'], "case": tc['case']}
        all_tracked_cases.append(temp)

    if len(all_tracked_cases) > 0:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=f"Currently tracking cases {all_tracked_cases}")
    else:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text="There are no cases currently being tracked in Slack")


def case_details(channel_id, case, user_id):
    """
    Sends the data of a single case as json to the channel where the request originated.
    
    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    case : str
        unique id of the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    with open(cases_file) as f:
        cases = json.load(f)

    if case in cases:
        pretty_json = json.dumps(cases[case], indent=4, sort_keys=True)
        client.chat_postMessage(
            channel=channel_id,
            text=f"Here are the details on case {case}: \n{pretty_json}")
    else:
        case_not_found(channel_id, user_id, case)


def sitrep(channel_id, user_id):
    """
    Lists the following details for all cases in the org:
    case id, priority, title, isEscalated, case creation time, last case update time,
    case status, and case creator.

    Additionally, provides a summary of the number of the number of cases open by
    priority, the total number of cases, and the total number of escalated cases.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages to the channel
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send ephemeral
        messages to the user
    """
    p1 = 0
    p2 = 0
    p3 = 0
    p4 = 0
    esc_count = 0
    report = (
        'This is the current state of Google Cloud Support cases:'
        '\n\ncase,priority,title,escalated,create_time,last_updated,state,case_creator'
    )
    with open(cases_file) as f:
        cases = json.load(f)

    for case in cases:
        if cases[case]['priority'] == 'P1':
            p1 += 1
        elif cases[case]['priority'] == 'P2':
            p2 += 1
        elif cases[case]['priority'] == 'P3':
            p3 += 1
        else:
            p4 += 1

        if cases[case]['escalated'] == True:
            esc_count += 1

        report = report + '\n{},{},{},{},{},{},{},{}'.format(
            case, cases[case]['priority'], cases[case]['case_title'],
            cases[case]['escalated'], cases[case]['create_time'],
            cases[case]['update_time'], cases[case]['state'],
            cases[case]['case_creator'])

    report = (report + '\n\n'
              '\n{} P1 cases are open'
              '\n{} P2 cases are open'
              '\n{} P3 cases are open'
              '\n{} P4 cases are open'
              '\nTotal cases open: {}'
              '\nEscalated cases: {}').format(str(p1), str(p2), str(p3),
                                              str(p4), str(p1 + p2 + p3 + p4),
                                              str(esc_count))

    client.chat_postMessage(channel=channel_id, text=f"{report}")


def case_updates():
    """
    Infinite loop that pulls all of the open Google Cloud support cases for our org and their 
    associated public comments every 15 seconds and compares it to the cases and 
    comments from the previous pull. If any change is detected between the two versions 
    of the case, the change is posted to any channel that is tracking it.
    """
    query_string = 'organization="organizations/{}" AND state=OPEN'.format(
        ORG_ID)

    while True:
        loop_skip = False
        sleep_timer = 15
        cases = {}
        if os.path.exists(cases_file):
            with open(cases_file) as f:
                try:
                    cases = json.load(f)
                except json.decoder.JSONDecodeError as e:
                    logging.error(e, ' : {}'.format(datetime.now()))
                    pass

        req = support_service.cases().search(query=query_string)
        try:
            resp = req.execute(num_retries=MAX_RETRIES).get('cases', [])
        except BrokenPipeError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            time.sleep(5)
            continue

        temp_cases = {}

        for case in resp:
            try:
                temp_case = SupportCase(case)
            except NameError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                loop_skip = True
                break
            try:
                temp_cases[temp_case.case_number] = temp_case
            except AttributeError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
                loop_skip = True
                break

        if loop_skip == True:
            time.sleep(5)
            continue

        # Remove the cases from our dictionary that are no longer active
        for key in cases:
            delete_entry = True
            for temp_key in temp_cases:
                if key == temp_key:
                    delete_entry = False
                    break
            if delete_entry == True:
                notify_slack(key, 'closed', '')
                del cases[key]

        # Check for existing cases that have a new update time. Post their relevant update
        # to the channels that are tracking those cases.
        for temp_key in temp_cases:
            if temp_key in cases:
                if cases[temp_key]['comment_list'] != temp_cases[
                        temp_key].comment_list:
                    if 'googleSupport' in temp_cases[temp_key].comment_list[0][
                            'creator']:
                        notify_slack(
                            temp_key, 'comment',
                            temp_cases[temp_key].comment_list[0]['body'])
                if cases[temp_key]['priority'] != temp_cases[temp_key].priority:
                    notify_slack(temp_key, 'priority',
                                 temp_cases[temp_key].priority)
                if cases[temp_key]['escalated'] != temp_cases[
                        temp_key].escalated:
                    if temp_cases[temp_key].escalated == True:
                        notify_slack(temp_key, 'escalated',
                                     temp_cases[temp_key].escalated)
                    else:
                        notify_slack(temp_key, 'de-escalated',
                                     temp_cases[temp_key].escalated)

        # Replace the stored case list with our latest pull and update the file
        try:
            file_overwrite(cases_file, temp_cases)
        except OSError as e:
            logging.error(e, ' : {}'.format(datetime.now()))
            sleep_timer = 2

        # Wait to try again so we don't spam the API
        time.sleep(sleep_timer)


def notify_slack(case, update_type, update_text):
    """
    Sends update messages to Slack.
    
    Parameters
    ----------
    case : str
        unique id of the case
    update_type : str
        specifies what was changed in the case
    update_text : str
        update relevant content that is injected into the Slack message
    """
    if os.path.exists(tracked_cases_file):
        tracker = []
        with open(tracked_cases_file) as tcf:
            try:
                tracked_cases_json = json.load(tcf)
            except json.decoder.JSONDecodeError as e:
                logging.error(e, ' : {}'.format(datetime.now()))
            else:
                for tracked_case in tracked_cases_json:
                    tracker.append(tracked_case)
        for t in tracker:
            if t['case'] == case:
                if update_type == 'comment':
                    client.chat_postMessage(
                        channel=t['channel_id'],
                        text=
                        f"You have an update from your support engineer on case {case}: \n{update_text}"
                    )
                elif update_type == 'priority':
                    client.chat_postMessage(
                        channel=t['channel_id'],
                        text=
                        f"The priority of case {case} has been changed to {update_text}"
                    )
                elif update_type == 'closed':
                    client.chat_postMessage(channel=t['channel_id'],
                                            text=f"Case {case} has been closed")
                elif update_type == 'escalated':
                    client.chat_postMessage(
                        channel=t['channel_id'],
                        text=f"Case {case} has been escalated")
                elif update_type == 'de-escalated':
                    client.chat_postMessage(
                        channel=t['channel_id'],
                        text=f"Case {case} has been de-escalated")


def file_overwrite(output_file, content_dict):
    """
    Replaces the json of a file or creates the file if it doesn't already exist.

    Parameters
    ----------
    output_file : str
        the name of the file we will be creating or replacing the content
    content_dict : dict
        data to be written to the file. Currently either our tracked cases or
        all Google Cloud support cases
    """
    if os.path.exists(output_file):
        with open(output_file, "r+") as f:
            _ = f.read()
            f.seek(0)
            f.write(json.dumps(content_dict, default=lambda x: x.__dict__))
            f.truncate()
    else:
        with open(output_file, "w") as f:
            f.write(json.dumps(content_dict, default=lambda x: x.__dict__))


def get_parent(case) -> str:
    """
    Retrieves the full parent path for a given case id.

    Parameters
    ----------
    case : str
        unique id of the case
    """
    fetch_cases = {}
    if os.path.exists(cases_file):
        with open(cases_file) as f:
            fetch_cases = json.load(f)
    if case in fetch_cases:
        return fetch_cases[case]['resource_name']
    else:
        return 'Case not found'


if __name__ == "__main__":
    p = Process(target=case_updates)
    p.start()
    http_server = WSGIServer(('', 5000), app)
    http_server.serve_forever()
    p.join()
