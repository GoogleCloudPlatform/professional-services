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
import googleapiclient
from enum import Enum
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)


def verify_asset(channel_id, asset_type, asset_id, user_id):
    """
    Changes the priority of a Google Cloud Support case.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    asset_type : str
      the type of asset being tracked in this subscription. Must be of the
      following values: organizations, folders, projects
    asset_id : str
      unique id of the resource being tracked
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user

    Returns
    ----------
    bool
        Validates whether or not all of the provided priorities are in
        our enum
    """
    Asset = Enum('Asset', ['organizations', 'folders', 'projects'])
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    if asset_type not in Asset.__members__:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=(f"Your asset type `{asset_type}` was not valid."
                  " Please provide a priority of value"
                  " `organizations` | `folders` | `projects`")
            )
        return False
    with build("cloudresourcemanager", "v3") as service:
        asset_name = f"{asset_type}/{asset_id}"
        MAX_RETRIES = 3
        if asset_type == Asset.organizations.name:
            service_asset = service.organizations()
        elif asset_type == Asset.folders.name:
            service_asset = service.folders()
        else:
            service_asset = service.projects()
        service_asset_req = service_asset.get(name=asset_name)
        try:
            service_asset_req.execute(
                num_retries=MAX_RETRIES)
        except googleapiclient.errors.HttpError:
            grammar_asset = asset_type[:-1]
            client.chat_postEphemeral(
                channel=channel_id,
                user=user_id,
                text=(f"Your {grammar_asset}-id `{asset_id}` was not valid."
                      " Please provide a valid id and try again."
                      "\nNote: folders and organizations have numeric ids")
                )
            return False
    return True


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_asset_type = os.environ.get("TEST_ASSET")
    test_asset_id = os.environ.get("TEST_ASSET_ID")
    test_user_id = os.environ.get("TEST_USER_ID")
    verify_asset(test_channel_id, test_asset_type,
                 test_asset_id, test_user_id)
