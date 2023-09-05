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
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

logger = logging.getLogger(__name__)


def list_autotrack_all(channel_id, channel_name):
    """
    Display all the Google Cloud assets that are being tracked along with the
    priority list attached to that tracking in the Slack channel to the user
    that submitted the command.

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages
        to the channel
    channel_name : str
        designated channel name of the channel. For users to understand where
        their cases are being tracked in Slack
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))

    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    collection_name = "auto_case_tracker"
    doc = f"{collection_name}/{channel_id}"
    channel_tracking = db.document(doc).get()
    asset_types = channel_tracking.reference.collections()
    response = []

    for asset_type in asset_types:
        tracked_assets = asset_type.get()
        response.append(
            f"Auto tracking is applied to the following {asset_type.id}"
            f" and being tracked in {channel_name}:"
        )
        for asset in tracked_assets:
            response.append(f"{asset.get('asset_id')}:"
                            f" {asset.get('priority_list')}")

    if response:
        client.chat_postMessage(channel=channel_id, text="\n".join(response))
    else:
        client.chat_postMessage(channel=channel_id,
                                text=("No assets are being tracked in"
                                      f" {channel_name} for auto tracking"))


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_channel_name = os.environ.get("TEST_CHANNEL_NAME")
    list_autotrack_all(test_channel_id, test_channel_name)
