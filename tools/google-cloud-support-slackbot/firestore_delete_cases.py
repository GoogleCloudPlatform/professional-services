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


def firestore_delete_cases(case):
    """
    Delete all cases from Firestore with a matching case number.

    Parameters
    ----------
    case : str
      unique id of the case
    """
    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    collection = "cases"
    db = firestore.client()
    firestore_cases = db.collection(collection).where("case_number", "==",
                                                      case).get()

    for firestore_case in firestore_cases:
        fs_case = firestore_case.to_dict()
        db.collection(collection).document(fs_case["guid"]).delete()


if __name__ == "__main__":
    test_case = os.environ.get("TEST_CASE")
    firestore_delete_cases(test_case)
