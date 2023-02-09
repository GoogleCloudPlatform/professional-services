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


def get_firestore_cases() -> list:
    """
    Fetches the cases in Firestore and returns the copy for each case id with
    the greatest timestamp value.

    Returns
    -------
    support_cases
        list of dicts containing the case information for all of our cases
    """
    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()
    collection = "cases"
    firestore_cases = db.collection(collection).get()
    support_cases = []

    for firestore_case in firestore_cases:
        fs_case = firestore_case.to_dict()
        fs_timestamp = float(fs_case["firestore_timestamp"])
        if len(support_cases) == 0:
            support_cases.append(fs_case)
        else:
            i = 0
            case_number = fs_case["case_number"]
            temp_cases = support_cases
            case_exists = False
            for support_case in temp_cases:
                if support_case["case_number"] == case_number:
                    case_exists = True
                    if fs_timestamp > float(
                            support_case["firestore_timestamp"]):
                        support_cases[i] = fs_case
                        break
                i += 1
            if case_exists is False:
                support_cases.append(fs_case)

    return support_cases


if __name__ == "__main__":
    print(str(get_firestore_cases()))
