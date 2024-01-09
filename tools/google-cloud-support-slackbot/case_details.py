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
import json
import logging
from case_not_found import case_not_found
from get_firestore_cases import get_firestore_cases

logger = logging.getLogger(__name__)


def case_details(channel_id, case, user_id):
    """
    Sends the data of a single case as json to the channel where the request
    originated.

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
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    cases = get_firestore_cases()
    break_flag = False

    for fs_case in cases:
        if case == fs_case["case_number"]:
            pretty_json = json.dumps(fs_case, indent=4, sort_keys=True)
            client.chat_postMessage(
                channel=channel_id,
                text=f"Here are the details on case {case}: \n{pretty_json}"
            )
            break_flag = True
            break

    if break_flag is False:
        case_not_found(channel_id, user_id, case)


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_case = "xxxxxxxx"
    test_user_id = os.environ.get("TEST_USER_ID")
    case_details(test_channel_id, test_case, test_user_id)
