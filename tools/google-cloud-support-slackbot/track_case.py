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
from get_parent import get_parent
from case_not_found import case_not_found
from get_firestore_tracked_cases import get_firestore_tracked_cases
from firestore_write import firestore_write

logger = logging.getLogger(__name__)


def track_case(channel_id, channel_name, case, user_id):
    """
    Add a Google Cloud support case to the tracked_cases collection in
    Firestore. If the case can"t be found in the list of active support cases,
    notify the user.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    channel_name : str
      designated channel name of the channel. For users to understand where
      their cases are being tracked in Slack
    case : str
      unique id of the case
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    collection = "tracked_cases"
    parent = get_parent(case)
    tracked_cases = get_firestore_tracked_cases()

    if parent == "Case not found":
        case_not_found(channel_id, user_id, case)
    else:
        tracker = {
            "channel_id": channel_id,
            "case": case,
            "channel_name": channel_name
        }

        exists = False

        for tracked_case in tracked_cases:
            tc = tracked_case
            if tc["channel_id"] == channel_id and tc["case"] == case:
                exists = True
                break

        if exists is False:
            firestore_write(collection, tracker)
            client.chat_postMessage(
                channel=channel_id,
                text=f"{channel_name} is now tracking case {case}")
        else:
            try:
                client.chat_postEphemeral(
                    channel=channel_id,
                    user=user_id,
                    text=(f"Case {case} is already being"
                          f" tracked in {channel_name}"))
            except slack.errors.SlackApiError:
                pass


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_channel_name = os.environ.get("TEST_CHANNEL_NAME")
    test_case = os.environ.get("TEST_CASE")
    test_user_id = os.environ.get("TEST_USER_ID")
    track_case(test_channel_id, test_channel_name, test_case, test_user_id)
