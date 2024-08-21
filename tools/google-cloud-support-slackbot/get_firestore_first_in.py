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
from datetime import datetime

logger = logging.getLogger(__name__)


def get_firestore_first_in(case, update_time) -> dict:
    """
    Pulls all the docs for a case with the specified update time and
    returns the doc with the earliest app-generated timestamp.

    Parameters
    ----------
    case : str
        a unique string of numbers that is the id for the case
    update_time : str
        the reported time that the case was last updated

    Returns
    -------
    first_doc_in
        the matching document in the collection with the earliest timestamp
    """
    # Initialize the Firebase app if it hasn"t already been done
    if not firebase_admin._apps:
        PROJECT_ID = os.environ.get("PROJECT_ID")
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            "projectId": PROJECT_ID,
        })

    db = firestore.client()

    collection_ref = db.collection("cases")

    query = (collection_ref.where("update_time", "==",
                                  update_time).where("case_number", "==",
                                                     case))
    docs = query.get()
    first_doc_in = {}

    i = 0
    try:
        first_doc_in = docs[0].to_dict()
    except IndexError as e:
        error_message = f"{e} : {datetime.now()}"
        logger.error(error_message)
        return first_doc_in
    firestore_timestamp = ""
    for doc in docs:
        doc_timestamp = doc.to_dict()["firestore_timestamp"]
        if i == 0:
            firestore_timestamp = doc_timestamp
        elif float(doc_timestamp) < float(firestore_timestamp):
            firestore_timestamp = doc_timestamp
            first_doc_in = docs[i].to_dict()
        i += 1

    return first_doc_in


if __name__ == "__main__":
    test_case = os.environ.get("TEST_CASE")
    test_update_time = "2021-07-12 22:34:21+00:00"
    print(str(get_firestore_first_in(test_case, test_update_time)))
