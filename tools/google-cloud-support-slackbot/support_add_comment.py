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
from get_parent import get_parent
from support_service import support_service
from case_not_found import case_not_found

logger = logging.getLogger(__name__)


def support_add_comment(channel_id,
                        case,
                        comment,
                        user_id,
                        user_name,
                        allow_alerts=True):
    """
    Add a comment to a Google Cloud support case.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    case : str
      unique id of the case
    comment : str
      comment to be added to the case
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    user_name : str
      Slack user_name of the user that ran the command. Appended to the end of
      the comment to identify who submitted it, otherwise all comments will
      show as coming from the case creator
    allow_alerts : bool
      flag to determine whether to silent Slack ephemeral message
    """
    MAX_RETRIES = 3

    service = support_service()

    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))

    parent = get_parent(case)

    if parent == "Case not found":
        case_not_found(channel_id, user_id, case)
    else:
        req_body = {
            "body": (comment +
                     (f"\n*Comment submitted by {user_name} via Google Cloud"
                      "Support Slack bot*"))
        }
        req = service.cases().comments().create(parent=parent,
                                                body=req_body)
        slack_response = ""
        try:
            req.execute(num_retries=MAX_RETRIES)
        except BrokenPipeError as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            slack_response = ("Your comment may not have posted."
                              " Please try again later.")

        else:
            slack_response = ("You added a new comment on case"
                              f" {case}: {comment}")

        finally:
            if allow_alerts:
                client.chat_postEphemeral(channel=channel_id,
                                          user=user_id,
                                          text=slack_response)


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_case = os.environ.get("TEST_CASE")
    test_comment = ("This is a test comment created by the Google Cloud"
                    " Support Slackbot")
    test_user_id = os.environ.get("TEST_USER_ID")
    test_user_name = os.environ.get("TEST_USER_NAME")
    support_add_comment(test_channel_id, test_case, test_comment, test_user_id,
                        test_user_name)
