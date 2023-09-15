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
"""
Please do not include support_escalate in any tests! Escalations page the
support team (even if the case is flagged as a test case) and the ask is that
we avoid flooding them with false alarms.
"""
import os
import slack
import logging
from datetime import datetime
from get_parent import get_parent
from case_not_found import case_not_found
from support_service import support_service

logger = logging.getLogger(__name__)


def support_escalate(channel_id, case, user_id, reason, justification,
                     user_name):
    """
    Escalates a Google Cloud support case, setting the escalated boolean to
    True. This code is currently disabled and we will look to include a
    working version of it in the v1 release of the bot.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    case : str
      unique id of the case
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
        ephemeral messages to the user
    reason : str
      reason for the escalation. Must be a value of either RESOLUTION_TIME,
      TECHNICAL_EXPERTISE, or BUSINESS_IMPACT
    justification : str
      user submitted string justifying the need for an escalation
    user_name : str
      Slack user_name of the user that ran the command. Appended to the end of
      the justification to identify who submitted the escalation, otherwise
      all escalations will show as coming from the case creator
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    MAX_RETRIES = 3

    service = support_service()

    client.chat_postEphemeral(channel=channel_id,
                              user=user_id,
                              text="Your request is processing ... ")
    parent = get_parent(case)
    if parent == "Case not found":
        case_not_found(channel_id, user_id, case)
    else:
        signed_justification = (
            justification + (f"\n *Sent by {user_name} via Google Cloud"
                             " Support Slack bot"))
        body = {
            "escalation": {
                "reason": reason,
                "justification": signed_justification
            }
        }
        req = service.cases().escalate(name=parent, body=body)
        try:
            req.execute(num_retries=MAX_RETRIES)
        except BrokenPipeError as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=(
                      "Your attempt to escalate may have failed. Please"
                      " contact your account team or try again later."))
        else:
            client.chat_postEphemeral(channel=channel_id,
                                      user=user_id,
                                      text=f"You have escalated case {case}")


if __name__ == "__main__":
    # Please only test this functionality if the command is failing
    # in production
    are_you_sure_about_that = False
    if are_you_sure_about_that:
        test_channel_id = os.environ.get("TEST_CHANNEL_ID")
        test_case = os.environ.get("TEST_CASE")
        test_user_id = os.environ.get("TEST_USER_ID")
        test_reason = "BUSINESS_IMPACT"
        test_justification = (
            "Please ignore this escalation! This escalation was made for "
            "testing of the Google Cloud Support Slackbot functionalities.")
        test_user_name = "Slackbot Admin"
        support_escalate(test_channel_id, test_case, test_user_id, test_reason,
                         test_justification, test_user_name)
