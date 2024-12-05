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
import logging
import time
import re
import firebase_admin
from datetime import datetime
from support_service import support_service
from googleapiclient.discovery import build
from firestore_write import firestore_write
from get_firestore_cases import get_firestore_cases
from get_firestore_first_in import get_firestore_first_in
from get_firestore_tracked_cases import get_firestore_tracked_cases
from firestore_delete_cases import firestore_delete_cases
from notify_slack import notify_slack
from support_case import SupportCase
from firebase_admin import credentials
from firebase_admin import firestore
from get_parent import get_parent
from track_case import track_case
from case_details import case_details
from support_subscribe_email import support_subscribe_email
from support_add_comment import support_add_comment

logger = logging.getLogger(__name__)
MAX_RETRIES = 3


def case_updates(is_test):
    """
    Infinite loop that pulls all of the open Google Cloud support cases for our
    org and their associated public comments every 15 seconds and compares it
    to the cases and comments from the previous pull. If any change is detected
    between the two versions of the case, the change is posted to any channel
    that is tracking it.

    Parameters
    ----------
    is_test : bool
      flag indicating if we are running the loop a single time for testing
    """
    ORG_ID = os.environ.get("ORG_ID")
    # Must be double quotes for the query
    query_string = f'organization="organizations/{ORG_ID}" AND state=OPEN'

    service = support_service()

    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    while True:
        loop_skip = False
        sleep_timer = 10
        closed_cases = []
        cases = get_firestore_cases()
        req = service.cases().search(query=query_string)
        try:
            resp = req.execute(num_retries=MAX_RETRIES).get("cases", [])
        except BrokenPipeError as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            time.sleep(5)
            continue

        temp_cases = []

        for case in resp:
            try:
                temp_case = SupportCase(case)
            except NameError as e:
                error_message = f"{e} : {datetime.now()}"
                logger.error(error_message)
                loop_skip = True
                break
            else:
                temp_cases.append(vars(temp_case))

        if loop_skip:
            time.sleep(5)
            continue

        # Check for cases that have closed since the last loop and notify slack
        for fs_case in cases:
            delete_entry = True
            if fs_case["update_time"] == "2100-12-31 23:59:59+00:00":
                delete_entry = False
            else:
                for t_case in temp_cases:
                    if t_case["case_number"] == fs_case["case_number"]:
                        delete_entry = False
                        break
            if delete_entry:
                fs_case["update_time"] = "2100-12-31 23:59:59+00:00"
                guid = firestore_write("cases", fs_case)
                first_doc_in = get_firestore_first_in(fs_case["case_number"],
                                                      fs_case["update_time"])
                if first_doc_in:
                    if guid == first_doc_in["guid"]:
                        notify_slack(fs_case["case_number"], "closed", "")
                        closed_cases.append(fs_case["case_number"])

        # Check for existing cases that have a new update time. Post their
        # relevant update to the channels that are tracking those cases.
        for t_case in temp_cases:
            is_new = True
            for fs_case in cases:
                if t_case["case_number"] == fs_case["case_number"]:
                    is_new = False
                    if not t_case["update_time"] == fs_case["update_time"]:
                        guid = firestore_write("cases", t_case)
                        first_doc_in = get_firestore_first_in(
                            t_case["case_number"], t_case["update_time"])
                    if len(fs_case["comment_list"]) < len(
                           t_case["comment_list"]):
                        if "googleSupport" in t_case["comment_list"][0][
                                "creator"]:
                            if guid == first_doc_in["guid"]:
                                notify_slack(t_case["case_number"], "comment",
                                             t_case["comment_list"][0]["body"])
                    if fs_case["priority"] != t_case["priority"]:
                        if guid == first_doc_in["guid"]:
                            notify_slack(t_case["case_number"], "priority",
                                         t_case["priority"])
                    if fs_case["escalated"] != t_case["escalated"]:
                        if t_case["escalated"]:
                            if guid == first_doc_in["guid"]:
                                notify_slack(t_case, "escalated",
                                             t_case["escalated"])
                        else:
                            if guid == first_doc_in["guid"]:
                                notify_slack(t_case["case_number"],
                                             "de-escalated",
                                             t_case["escalated"])

            if is_new:
                firestore_write("cases", t_case)
                auto_cc(t_case)
                auto_track(t_case)

        # Wait to try again so we don"t spam the API
        time.sleep(sleep_timer)

        # Delete closed cases after waiting to minimize duplicate Slack updates
        for case in closed_cases:
            firestore_delete_cases(case)
        if is_test:
            break


def auto_cc(case):
    # Loop through all the Channel IDs and check which ones have the new case
    # in their auto cc tracking
    collection = "tracked_assets"
    db = firestore.client()
    tracked_assets = db.collection(collection).get()
    case_num = case["case_number"]
    case_parent = get_parent(case_num)
    project_id = re.search("projects\/[^\/]+", case_parent).group()

    with build("cloudresourcemanager", "v3") as service:
        projects = service.projects()
        folders = service.folders()
        try:
            project_req = projects.get(name=project_id)
            case_project = project_req.execute(num_retries=MAX_RETRIES)
            parent = case_project["parent"]
            parent_type, parent_id = parent.split('/')
            folder_ids = []
            while parent_type == "folders":
                folder_ids.append(parent_id)
                folder_req = folders.get(name=parent)
                folder_resp = folder_req.execute(num_retries=MAX_RETRIES)
                parent = folder_resp["parent"]
                parent_type, parent_id = parent.split('/')

        except BrokenPipeError as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            return

        project_id = project_id.split("/")[1]
        # 'parent' is either org due to no folders in between project & org
        # or we've reached the top level folder in hierarchy after folder
        # traversal
        org_id = parent_id

    for channel in tracked_assets:
        channel_doc = db.document(f"{collection}/{channel.id}")

        # Organization check
        org_new_emails = tracking_check(channel_doc, "organizations", org_id,
                                        case_num)
        # Folder check
        folder_new_emails = []
        for folder in folder_ids:
            folder_new_emails.extend(
                tracking_check(channel_doc, "folders", folder, case_num))
        # Project check
        project_new_emails = tracking_check(channel_doc, "projects",
                                            project_id, case_num)
        combined_new_emails = []
        for emails in (org_new_emails, folder_new_emails, project_new_emails):
            joined = ", ".join(emails)
            if joined:
                combined_new_emails.append(joined)

        if combined_new_emails:
            response = ("The following emails have been added automatically"
                        " through asset subscription:"
                        f" {', '.join(combined_new_emails)}")

            # Write a comment on the case to notify all newly added emails.
            # Silence the Slack messages to avoid spam. Can leave user_id blank
            # since we're silencing the Slack notifications
            support_add_comment(channel.id, case_num, response, "",
                                "Auto Asset Subscription", False)


def auto_track(case):
    # Loop through all the autotracked assets and track our case if it belongs
    # to any of them
    collection = "auto_case_tracker"
    db = firestore.client()
    tracked_assets = db.collection(collection).get()
    case_num = case["case_number"]
    case_priority = case["priority"]
    case_parent = get_parent(case_num)
    project_id = re.search("projects\/[^\/]+", case_parent).group()

    with build("cloudresourcemanager", "v3") as service:
        projects = service.projects()
        folders = service.folders()
        try:
            project_req = projects.get(name=project_id)
            case_project = project_req.execute(num_retries=MAX_RETRIES)
            parent = case_project["parent"]
            parent_type, parent_id = parent.split('/')
            folder_ids = []
            while parent_type == "folders":
                folder_ids.append(parent_id)
                folder_req = folders.get(name=parent)
                folder_resp = folder_req.execute(num_retries=MAX_RETRIES)
                parent = folder_resp["parent"]
                parent_type, parent_id = parent.split('/')

        except BrokenPipeError as e:
            error_message = f"{e} : {datetime.now()}"
            logger.error(error_message)
            return

        project_id = project_id.split("/")[1]
        # 'parent' is either org due to no folders in between project & org
        # or we've reached the top level folder in hierarchy after folder
        # traversal
        org_id = parent_id

    for channel in tracked_assets:
        channel_doc = db.document(f"{collection}/{channel.id}")
        tracked_cases = get_firestore_tracked_cases()
        exists = False

        for tc in tracked_cases:
            if tc["channel_id"] == channel_doc and tc["case"] == case_num:
                exists = True
                break

        if exists is True:
            continue

        # Organization check
        reported = autotrack_case(channel_doc, "organizations", org_id,
                                  case_num, case_priority)
        if reported is True:
            continue
        # Folder check
        for folder in folder_ids:
            reported = autotrack_case(channel_doc, "folders", folder, case_num,
                                      case_priority)
        if reported is True:
            continue
        # Project check
        autotrack_case(channel_doc, "projects", project_id, case_num,
                       case_priority)


def tracking_check(channel, asset_type, asset_id, case_num):
    asset = channel.collection(asset_type).get()
    for item in asset:
        item_dict = item.to_dict()
        print("Item dict: ", item_dict)
        if item_dict["asset_id"] == asset_id:
            # Skipping user_id since to not bombard requester with noise
            new_emails = support_subscribe_email(item_dict["channel_id"],
                                                 case_num,
                                                 item_dict["cc_list"],
                                                 "")
            return new_emails
    return []


def autotrack_case(channel, asset_type, asset_id, case_num, case_priority):
    asset = channel.collection(asset_type).get()
    for item in asset:
        item_dict = item.to_dict()
        if (item_dict["asset_id"] == asset_id and case_priority
                in item_dict["priority_list"]):
            # Skipping user_id to not bombard autotrack requester with noise
            track_case(item_dict["channel_id"], item_dict["channel_name"],
                       case_num, "")
            case_details(item_dict["channel_id"], case_num, "")
            return True
    return False


if __name__ == "__main__":
    case_updates(True)
