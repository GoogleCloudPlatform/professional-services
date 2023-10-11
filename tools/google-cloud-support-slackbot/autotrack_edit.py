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
import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from google.api_core.exceptions import NotFound
from verify_priorities import verify_priorities

logger = logging.getLogger(__name__)


def autotrack_edit(channel_id, channel_name, asset_type, asset_id, user_id,
                   priority_list):
    """
    Modify the existing Firestore doc that auto tracks cases by Google Cloud
    resource (Organization, Folder, Project).

    Parameters
    ----------
    channel_id : str
        unique string used to idenify a Slack channel. Used to send messages
        to the channel
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
    priority_list : str[]
        case priorities to automatically be tracked
    """
    valid_priority = verify_priorities(channel_id, priority_list, user_id)
    if valid_priority is False:
        pass

    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    collection_name = "auto_case_tracker"

    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    collection = f"{collection_name}/{channel_id}/{asset_type}"
    db_collection = db.collection(collection)
    tracked_asset = (db_collection.where("asset_id", "==", asset_id).get())

    # There should only ever be 1 doc per asset_id
    if tracked_asset and tracked_asset[0].exists:
        asset_snapshot = tracked_asset[0]
        try:
            asset = asset_snapshot.reference
            asset.update({"priority_list": priority_list})
            client.chat_postMessage(
                channel=channel_id,
                text=(f"{channel_name} is now tracking the {asset_type[:-1]}"
                      f" {asset_id} to auto track cases of priority"
                      f" {priority_list}.")
            )
            return
        except NotFound as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            client.chat_postEphemeral(channel=channel_id,
                                      user=user_id,
                                      text="Please try again later.")
    else:
        client.chat_postEphemeral(
            channel=channel_id,
            user=user_id,
            text=(f"The {asset_type} {asset_id} is not currently being tracked"
                  f" in {channel_name}. Use the following command to create a"
                  f" tracker: \n /google-cloud-support autotrack-create"
                  f" {asset_type} {asset_id} P1 ... P4")
        )


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_channel_name = os.environ.get("TEST_CHANNEL_NAME")
    test_user_id = os.environ.get("TEST_USER_ID")
    test_project_id = os.environ.get("TEST_PROJECT_ID")
    test_priority_list = ["P1", "P2"]
    autotrack_edit(test_channel_id, test_channel_name, "projects",
                   test_project_id, test_user_id, test_priority_list)
