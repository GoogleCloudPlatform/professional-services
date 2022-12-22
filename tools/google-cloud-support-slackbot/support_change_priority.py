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
import requests
import logging
from datetime import datetime
from get_parent import get_parent
from case_not_found import case_not_found
from googleapiclient.discovery import build_from_document

logger = logging.getLogger(__name__)


def support_change_priority(channel_id, case, priority, user_id):
  """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to \
      the channel
    case : str
      unique id of the case
    priority : str
      the current priority of the case, represented as S0, S1, S2, S3, or S4
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send \
      ephemeral messages to the user
    """
  API_KEY = os.environ.get("API_KEY")
  MAX_RETRIES = 3

  # Get our discovery doc and build our service
  r = requests.get(f"https://cloudsupport.googleapis.com/$discovery/rest\
      ?key={API_KEY}&labels=V2_TRUSTED_TESTER&version=v2beta",
                   timeout=5)
  r.raise_for_status()
  support_service = build_from_document(r.json())

  client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
  client.chat_postEphemeral(channel=channel_id,
                            user=user_id,
                            text="Your request is processing ...")
  parent = get_parent(case)
  if parent == "Case not found":
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
      error_message = str(e) + " : {}".format(datetime.now())
      logger.error(error_message)
      client.chat_postEphemeral(
          channel=channel_id,
          user=user_id,
          text="Your attempt to change the case priority has failed."
          " Please try again later.")
    else:
      client.chat_postEphemeral(
          channel=channel_id,
          user=user_id,
          text=f"You have changed the priority of case {case} to {priority}")


if __name__ == "__main__":
  test_channel_id = os.environ.get("TEST_CHANNEL_ID")
  test_case = os.environ.get("TEST_CASE")
  test_priority = "S3"
  test_user_id = os.environ.get("TEST_USER_ID")
  support_change_priority(test_channel_id, test_case, test_priority,
                          test_user_id)
