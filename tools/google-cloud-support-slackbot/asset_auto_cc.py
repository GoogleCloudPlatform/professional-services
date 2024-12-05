#!/usr/bin/env python3

# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0P
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import slack
import logging
from firestore_write import firestore_write
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from verify_asset import verify_asset

logger = logging.getLogger(__name__)


def asset_auto_cc(channel_id, channel_name, asset_type, asset_id, user_id,
                  cc_list):
    """
    Add a subscription on Google Cloud resource (Organization, Folder, Project)
    to automatically CC a specified list of emails to new Google Cloud support
    cases that fall under the specified resource

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    channel_name : str
      designated channel name of the channel. For users to understand where
      their cases are being tracked in Slack
    asset_type : str
      the type of asset being tracked in this subscription. Must be of the
      following values: organizations, folders, projects
    asset_id : str
      unique id of the resource being tracked
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    emails : str[]
      emails to be subscribed to a new case within the given resource
      automatically
  """
    valid_asset = verify_asset(channel_id, asset_type, asset_id, user_id)
    if valid_asset is False:
        return

    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))

    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    tracked_assets = db.collection("tracked_assets")

    # Explicitly define the channel document to avoid ghost ancestors
    if not tracked_assets.document(channel_id).get().exists:
        tracked_assets.add({}, channel_id)

    channel_tracking = tracked_assets.document(channel_id).collection(
        asset_type)

    tracked_asset = (channel_tracking.where("asset_id", "==", asset_id).get())

    # An existing doc indicates a pre-existing tracking
    if tracked_asset and tracked_asset[0].exists:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=(f"The {asset_type[:-1]} {asset_id} is already being tracked"
                  f" in {channel_name}. Consider updating the pre-existing CC"
                  " list using the following command: \n"
                  f"/google-cloud-support edit-auto-subscribe {asset_type}"
                  f" {asset_id}"
                  " [email 1] ... [email n]")
        )
    else:
        collection = f"tracked_assets/{channel_id}/{asset_type}"

        firestore_write(
            collection, {
                "asset_id": asset_id,
                "asset_type": asset_type,
                "channel_id": channel_id,
                "channel_name": channel_name,
                "user_id": user_id,
                "cc_list": cc_list
            })

        client.chat_postMessage(
            channel=channel_id,
            text=(f"{channel_name} is now tracking the {asset_type[:-1]}"
                  f" {asset_id} to auto CC {cc_list}.")
        )


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_channel_name = os.environ.get("TEST_CHANNEL_NAME")
    test_case = os.environ.get("TEST_CASE")
    test_user_id = os.environ.get("TEST_USER_ID")
    test_cc_list = ["test123@gmail.com"]
    asset_auto_cc(test_channel_id, test_channel_name, "projects",
                  "slackbot-testing", test_user_id, test_cc_list)
