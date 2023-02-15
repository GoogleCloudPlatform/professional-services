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
from get_firestore_tracked_cases import get_firestore_tracked_cases


def list_tracked_cases_all(channel_id, user_id):
    """
    Display all the Google Cloud support cases being tracked in the Slack
    worskpace to the user that submitted the command.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    tracked_cases = get_firestore_tracked_cases()

    all_tracked_cases = []
    for tc in tracked_cases:
        temp = {"channel": tc["channel_name"], "case": tc["case"]}
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


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_user_id = os.environ.get("TEST_USER_ID")
    list_tracked_cases_all(test_channel_id, test_user_id)
