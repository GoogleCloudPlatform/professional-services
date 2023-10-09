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


def stop_asset_auto_cc(channel_id, channel_name, asset_type, asset_id,
                       user_id):
    """
    Remove a case from the list of tracked Google Cloud support cases.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages
      to the channel
    channel_name : str
      user designated channel name. For users to understand where their cases
      are being tracked in Slack
    asset_type : str
        the type of asset being tracked in this subscription. Must be of the
        following values: organizations, folders, projects
    asset_id : str
        unique id of the resource being tracked
    user_id : str
        the Slack user_id of the user who submitted the request. Used to send
        ephemeral messages to the user
    """

    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    collection = f"tracked_assets/{channel_id}/{asset_type}"
    db_collection = firestore.Client().collection(collection)
    tracked_asset = (db_collection.where("asset_id", "==", asset_id).get())

    # There should only ever be 1 doc per asset_id
    if tracked_asset and tracked_asset[0].exists:
        asset = tracked_asset[0]
        asset_id = asset.id
        db_collection.document(asset_id).delete()
        client.chat_postMessage(
            channel=channel_id,
            text=(f"Asset {asset_id} is no longer being tracked"
                  f" in {channel_name}")
        )
    else:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=(f"The tracking for {asset_id} has not found"
                  f" for {channel_name}")
        )


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_channel_name = os.environ.get("TEST_CHANNEL_NAME")
    test_user_id = os.environ.get("TEST_USER_ID")
    stop_asset_auto_cc(test_channel_id, test_channel_name, "projects",
                       "testing", test_user_id)
