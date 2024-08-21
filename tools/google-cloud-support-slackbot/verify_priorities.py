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
from enum import Enum

logger = logging.getLogger(__name__)


def verify_priorities(channel_id, priorities, user_id):
    """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    priorities : str[]
      the current priority of the case, represented as P1, P2, P3, or P4
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user

    Returns
    ----------
    bool
        Validates whether or not all of the provided priorities are in
        our enum
    """
    valid_priorities = Enum('Priority', ['P1', 'P2', 'P3', 'P4'])
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    for priority in priorities:
        if priority not in valid_priorities.__members__:
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=(f"Your priority `{priority}` was not valid. Please"
                      " provide a priority of value `P1` | `P2` | `P3`| `P4`")
                )
            return False
    return True


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_priority = ['P3']
    test_user_id = os.environ.get("TEST_USER_ID")
    verify_priorities(test_channel_id, test_priority,
                      test_user_id)
