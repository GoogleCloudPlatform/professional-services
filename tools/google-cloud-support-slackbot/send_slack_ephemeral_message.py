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
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def send_slack_ephemeral_message(client,
                                 channel_id,
                                 user_id,
                                 text,
                                 silence_alerts=False):
  """
    Informs the user of their case could not be found.

    Parameters
    ----------
    client : WebClient
      allows communication to Slack API
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages
      to the channel
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    text : str
      string to send in Slack message
    silence_alerts : bool
      determines whether to send the Slack ephemeral message or not
    """
  if not silence_alerts:
    try:
      client.chat_postEphemeral(channel=channel_id, user=user_id, text=text)
    except slack.errors.SlackApiError as e:
      error_message = f"{e} : {datetime.now()}"
      logger.error(error_message)


if __name__ == "__main__":
  slack_client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
  test_channel_id = os.environ.get("TEST_CHANNEL_ID")
  test_user_id = os.environ.get("TEST_USER_ID")
  test_case = "xxxxxxxx"
  send_slack_ephemeral_message(slack_client, test_channel_id, test_user_id,
                               test_case)
