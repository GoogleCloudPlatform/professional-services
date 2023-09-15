#!/usr/bin/env python3

# Copyright 2023 Google LLC

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
import logging
from datetime import datetime
from get_firestore_cases import get_firestore_cases
from case_not_found import case_not_found
from support_service import support_service
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def support_subscribe_email(channel_id, case, emails, user_id):
    """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages
        to the channel
    case : str
        unique id of the case
    emails : str
        emails to be subscribed to the case
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send
        ephemeral messages to the user

    Returns
    ----------
    str[]
        a list of unique emails that have been newly added to the Google
        Cloud Support case
    """
    MAX_RETRIES = 3

    service = support_service()

    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    try:
        client.chat_postEphemeral(channel=channel_id,
                                  user=user_id,
                                  text="Your request is processing ...")
    except slack.errors.SlackApiError:
        pass
    cases = get_firestore_cases()
    case_found = False

    for fs_case in cases:
        if case == fs_case["case_number"]:
            case_found = True
            parent = fs_case["resource_name"]

            get_case_req = service.cases().get(name=parent)

            try:
                # Retrieve current list of CC'd emails
                case_details = get_case_req.execute(num_retries=MAX_RETRIES)
                new_cc = emails
                if "subscriberEmailAddresses" in case_details:
                    current_cc = case_details["subscriberEmailAddresses"]
                    # List of added emails not already in CC list for
                    # notifications
                    new_cc = [x for x in emails if x not in current_cc]
                    # Update list
                    emails.extend(current_cc)

                # Update CC list
                body = {"subscriberEmailAddresses": [emails]}
                update_mask = "subscriberEmailAddresses"
                update_req = service.cases().patch(
                    name=parent, updateMask=update_mask, body=body)
                update_req.execute(num_retries=MAX_RETRIES)
            except BrokenPipeError as e:
                error_message = f"{e} : {datetime.now()}"
                logger.error(error_message)
                try:
                    client.chat_postEphemeral(
                        channel=channel_id,
                        user=user_id,
                        text=(
                              "Your attempt to change the subscriber email"
                              " addresses has failed. Please try again"
                              " later."))
                except slack.errors.SlackApiError:
                    pass
            except HttpError as e:
                error_message = f"{e} : {datetime.now()}"
                logger.error(error_message)
                try:
                    client.chat_postEphemeral(
                        channel=channel_id,
                        user=user_id,
                        text=(
                              "Your attempt to change the subscriber email"
                              " addresses has failed. Please confirm that"
                              " 'Enable case sharing' is on in your project's"
                              " Support settings. If this setting was off,"
                              " then for this case you will need to ask"
                              " support to add the email addresses."))
                except slack.errors.SlackApiError:
                    pass
            else:
                updated_cc_list = list(set(emails))
                client.chat_postMessage(
                    channel=channel_id,
                    text=(f"The subcscriber email addresses for {case}"
                          f" have been updated to {updated_cc_list}"))

                return new_cc

    if not case_found:
        case_not_found(channel_id, user_id, case)

    return []


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_case = "xxxxxxxx"
    test_emails = ["testaccount1@example.com", "testaccount5@example.com"]
    test_user_id = os.environ.get("TEST_USER_ID")
    support_subscribe_email(test_channel_id, test_case, test_emails,
                            test_user_id)
