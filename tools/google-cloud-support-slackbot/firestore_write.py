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
import firebase_admin
import logging
import uuid
import time
from firebase_admin import credentials
from firebase_admin import firestore

logger = logging.getLogger(__name__)


def firestore_write(collection, content) -> str:
    """
    Takes the provided json and attaches a guid and timestamp to it and then
    writes it to the specified collection.

    Parameters
    ----------
    collection : str
      name of the collection that we are writing to
    content : dict
      json data that we are writing

    Returns
    -------
    guid
      unique string that is used by the firestore_read module to determine if
      this instance was the first to write the data into Firestore
    """
    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    guid = str(uuid.uuid4())
    timestamp = time.time()
    content["guid"] = guid
    content["firestore_timestamp"] = timestamp

    doc_ref = db.collection(collection).document(guid)
    doc_ref.set(content)

    return guid


if __name__ == "__main__":
    project_number = os.environ.get("TEST_PROJECT_NUMBER")
    case = os.environ.get("TEST_CASE")
    resource_name = f"projects/{project_number}/cases/{case}"
    test_content = {
        "case_number":
            case,
        "resource_name":
            resource_name,
        "case_title":
            "--PSO SLACKBOT TEST--",
        "description":
            ("---Testing the firestore write functionality!---\n"
             "I'm doing some work on a Slack bot that will use our Cloud"
             " Support APIs. I'll be testing out the API functionality and"
             " need open cases to do so. Please ignore this case.\n\nThanks"),
        "escalated":
            False,
        "case_creator":
            "Slackbot Admin",
        "create_time":
            "2021-07-12 17:55:11+00:00",
        "update_time":
            "2021-07-12 22:34:21+00:00",
        "priority":
            "P4",
        "state":
            "IN_PROGRESS_GOOGLE_SUPPORT",
        "comment_list": [{
            "name": (resource_name + "/comments/xxxxxxxxxxxxxxxxxx"),
            "createTime": "2021-07-12T21:34:19Z",
            "creator": {
                "displayName": "Slackbot Admin",
                "googleSupport": True
            },
            "body": "This is a public case comment",
            "plainTextBody": "This is a public case comment"
        }]
    }
    test_collection = "cases"
    print(str(firestore_write(test_collection, test_content)))
