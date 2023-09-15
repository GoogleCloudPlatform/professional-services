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
from get_firestore_tracked_cases import get_firestore_tracked_cases

logger = logging.getLogger(__name__)


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
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    tracked_cases = get_firestore_tracked_cases()
    for t in tracked_cases:
        if t["case"] == case:
            if update_type == "comment":
                client.chat_postMessage(
                    channel=t["channel_id"],
                    text=("You have an update from your support engineer on"
                          f" case {case}: \n{update_text}")
                )
            elif update_type == "priority":
                client.chat_postMessage(
                    channel=t["channel_id"],
                    text=(f"The priority of case {case} has been changed"
                          f" to {update_text}"))
            elif update_type == "closed":
                client.chat_postMessage(channel=t["channel_id"],
                                        text=f"Case {case} has been closed")
            elif update_type == "escalated":
                client.chat_postMessage(channel=t["channel_id"],
                                        text=f"Case {case} has been escalated")
            elif update_type == "de-escalated":
                client.chat_postMessage(
                    channel=t["channel_id"],
                    text=f"Case {case} has been de-escalated")


if __name__ == "__main__":
    test_case = os.environ.get("TEST_CASE")
    test_update_type = "comment"
    test_update_text = ("This is a test comment that doesn't actually appear"
                        " on the case.")
    notify_slack(test_case, test_update_type, test_update_text)
    test_update_type = "priority"
    test_update_text = "Priority unchanged"
    notify_slack(test_case, test_update_type, test_update_text)
    test_update_type = "closed"
    notify_slack(test_case, test_update_type, test_update_text)
    test_update_type = "escalated"
    notify_slack(test_case, test_update_type, test_update_text)
    test_update_type = "de-escalated"
    notify_slack(test_case, test_update_type, test_update_text)
