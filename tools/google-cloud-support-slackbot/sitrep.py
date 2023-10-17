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
from get_firestore_cases import get_firestore_cases

logger = logging.getLogger(__name__)


def sitrep(channel_id):
    """
    Lists the following details for all cases in the org:
    case id, priority, title, isEscalated, case creation time, last case
    update time, case status, and case creator.
    Additionally, provides a summary of the number of the number of cases open
    by priority, the total number of cases, and the total number of escalated
    cases.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    p1 = 0
    p2 = 0
    p3 = 0
    p4 = 0
    esc_count = 0
    report = (
        "This is the current state of Google Cloud Support cases:"
        "\n\ncase,priority,title,escalated,create_time,last_updated,state,"
        "case_creator")
    cases = get_firestore_cases()

    for case in cases:
        if case["priority"] == "P1":
            p1 += 1
        elif case["priority"] == "P2":
            p2 += 1
        elif case["priority"] == "P3":
            p3 += 1
        else:
            p4 += 1

        if case["escalated"]:
            esc_count += 1

        report = report + (
            f"\n{case['case_number']}, {case['priority']},"
            f" {case['case_title']}, { case['escalated']},"
            f" {case['create_time']}, {case['update_time']},"
            f" {case['state']}, {case['case_creator']}"
        )

    report = report + (f"\n\n"
                       f"\n{p1} P1 cases are open"
                       f"\n{p2} P2 cases are open"
                       f"\n{p3} P3 cases are open"
                       f"\n{p4} P4 cases are open"
                       f"\nTotal cases open: {p1 + p2 + p3 + p4}"
                       f"\nEscalated cases: {esc_count}")

    client.chat_postMessage(channel=channel_id, text=f"{report}")


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    sitrep(test_channel_id)
