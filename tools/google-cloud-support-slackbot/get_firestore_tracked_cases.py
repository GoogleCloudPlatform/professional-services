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
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

logger = logging.getLogger(__name__)


def get_firestore_tracked_cases() -> list:
    """
    Fetches the cases in Firestore and returns the copy for each case id with
    the greatest timestamp value.

    Returns
    -------
    tracked_cases
      list of dicts containing the tracked case information
    """
    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    tracked_cases = []
    collection = "tracked_cases"
    firestore_tracked_cases = db.collection(collection).get()
    for case in firestore_tracked_cases:
        tracked_cases.append(case.to_dict())

    return tracked_cases


if __name__ == "__main__":
    print(str(get_firestore_tracked_cases()))
