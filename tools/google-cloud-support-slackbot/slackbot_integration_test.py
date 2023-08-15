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
import unittest
import warnings
from post_help_message import post_help_message
from case_not_found import case_not_found
from autotrack_create import autotrack_create
from autotrack_edit import autotrack_edit
from list_autotrack_all import list_autotrack_all
from support_create_case import support_create_case
from autotrack_stop import autotrack_stop
from firestore_write import firestore_write
from get_firestore_first_in import get_firestore_first_in
from get_firestore_cases import get_firestore_cases
from get_parent import get_parent
from case_details import case_details
from track_case import track_case
from get_firestore_tracked_cases import get_firestore_tracked_cases
from notify_slack import notify_slack
from list_tracked_cases import list_tracked_cases
from list_tracked_cases_all import list_tracked_cases_all
from sitrep import sitrep
from support_add_comment import support_add_comment
from support_change_priority import support_change_priority
from support_subscribe_email import support_subscribe_email
from support_close_case import support_close_case
from firestore_delete_cases import firestore_delete_cases
from stop_tracking import stop_tracking
from case_updates import case_updates
from asset_auto_cc import asset_auto_cc
from edit_asset_auto_cc import edit_asset_auto_cc
from stop_asset_auto_cc import stop_asset_auto_cc
from list_asset_auto_cc_subscriptions import list_asset_auto_cc_subscriptions
from verify_asset import verify_asset
from verify_priorities import verify_priorities

unittest.TestLoader.sortTestMethodsUsing = None


class MonolithicTestCase(unittest.TestCase):
    """
    Test all of our functions and procedures except escalate.

    Attributes
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    channel_name : str
      designated channel name of the channel. For users to understand where
      their cases are being tracked in Slack
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    user_name : str
      Slack user_name of the user that ran the command. Appended to the end of
      the comment to identify who submitted submitted it, otherwise all
      comments will show as coming from the case creator
    project_number : str
      unique number of the project where we will be creating and modifying our
      test case
    case : str
      unique id of the case
    content : dict
      json data that we are writing
    update_time : str
      the reported time that the case was last updated
    guid : str
      unique string that is used by the firestore_read module to determine if
      this instance was the first to write the data into Firestore
    resource_name : str
      parent or name of the case in the format of "projects/12345/cases/67890"
      or "organizations/12345/cases/67890"
    """
    channel_id = os.environ.get("TEST_CHANNEL_ID")
    channel_name = os.environ.get("TEST_CHANNEL_NAME")
    user_id = os.environ.get("TEST_USER_ID")
    user_name = os.environ.get("TEST_USER_NAME")
    project_number = os.environ.get("TEST_PROJECT_NUMBER")
    asset_id = os.environ.get("TEST_ASSET_ID")
    asset = os.environ.get("TEST_ASSET")
    case = "xxxxxxxx"
    content = {}
    update_time = "2021-07-12 22:34:21+00:00"
    guid = ""
    resource_name = ""

    # pylint: disable=assignment-from-no-return,assignment-from-none
    def test_step00_post_help_message(self):
        """
        Run the post_help_message procedure. If successful, a message will
        appear in Slack.
        """
        context = "This is a unit test of the post_help_message procedure. "
        post_help_message_output = post_help_message(self.channel_id,
                                                     self.user_id, context)
        self.assertEqual(post_help_message_output, None)

    def test_step01_verify_asset(self):
        """
        Run the post_help_message procedure. If successful, a message will
        appear in Slack.
        """
        verify_asset_output = verify_asset(self.channel_id,
                                           self.asset,
                                           self.asset_id,
                                           self.user_id)
        self.assertEqual(verify_asset_output, True)

    def test_step02_verify_priorities(self):
        """
        Run the post_help_message procedure. If successful, a message will
        appear in Slack.
        """
        priority_list = ['P2', 'P3']
        verify_priorities_output = verify_priorities(self.channel_id,
                                                     priority_list,
                                                     self.user_id)
        self.assertEqual(verify_priorities_output, True)

    def test_step03_case_not_found(self):
        """
        Run the case_not_found procedure. If successful, a message will appear
        in Slack.
        """
        case_not_found_output = case_not_found(self.channel_id, self.user_id,
                                               self.case)
        self.assertEqual(case_not_found_output, None)

    def test_step04_autotrack_create(self):
        """
        Run the autotrack_create function. If successful, a message will
        appear in Slack.
        """
        autotrack_create_output = autotrack_create(
            self.channel_id,
            self.channel_name, self.asset, self.asset_id,
            self.user_id, ["P4"]
        )
        self.assertEqual(autotrack_create_output, None)

    def test_step05_autotrack_edit(self):
        """
        Run the autotrack_edit function. If successful, a message will
        appear in Slack.
        """
        autotrack_edit_output = autotrack_edit(
            self.channel_id, self.channel_name, self.asset, self.asset_id,
            self.user_id, ["P3", "P4"]
        )
        self.assertEqual(autotrack_edit_output, None)

    def test_step06_list_autotrack_all(self):
        """
        Run the list_autotrack_all function. If successful, a message will
        appear in Slack.
        """
        list_autotrack_all_output = list_autotrack_all(
                self.channel_id, self.channel_name
        )
        self.assertEqual(list_autotrack_all_output, None)

    def test_step07_autotrack_stop(self):
        """
        Run the autotrack_stop function. If successful, a message will
        appear in Slack.
        """
        autotrack_stop_output = autotrack_stop(
            self.channel_id, self.channel_name, self.asset, self.asset_id,
            self.user_id
        )
        self.assertEqual(autotrack_stop_output, None)

    def test_step08_support_create_case(self):
        """
        Run the support_create_case function. This function is not available as
        a user command as dealing with the dozens of enumerations of
        classification would be a poor user experience.
        """
        display_name = "IGNORE -- Google Cloud Support Slackbot test"
        description = str(
            "This is an automatically case created by the Google Cloud"
            " Support Slackbot. Please delete this case if it is open for"
            " more than 30 minutes"
        )
        severity = 4
        classification_id = (
            "100H41Q3DTMN0TBKCKD0SGRFDLO7AT35412MSPR9DPII4229DPPN8O"
            "BECDIG"
        )
        classification_display_name = ("Compute \u003e Compute Engine \u003e"
                                       " Instance")
        time_zone = "-7:00"
        test_case = True
        support_create_case_output = support_create_case(
            self.channel_id, self.user_id, self.user_name, display_name,
            description, severity, classification_id,
            classification_display_name, time_zone, self.project_number,
            test_case)
        self.assertEqual(len(support_create_case_output), 8)
        self.__class__.case = support_create_case_output

    def test_step09_firestore_write(self):
        """
        Run the firestore_write function.
        """
        self.__class__.resource_name = (f"projects/{self.project_number}"
                                        f"/cases/{self.case}")
        content = {
            "case_number":
                self.case,
            "resource_name":
                self.resource_name,
            "case_title":
                "--PSO SLACKBOT TEST--",
            "description":
                ("---Testing the firestore write functionality!---\n"
                 "I'm doing some work on a Slack bot that will use our"
                 " Cloud Support APIs. I'll be testing out the API"
                 " functionality and need open cases to do so. Please"
                 " ignore this case.\n\nThanks"),
            "escalated":
                False,
            "case_creator":
                "Slackbot Admin",
            "create_time":
                "2021-07-12 17:55:11+00:00",
            "update_time":
                self.update_time,
            "priority":
                "P4",
            "state":
                "IN_PROGRESS_GOOGLE_SUPPORT",
            "comment_list": [{
                "name": ("projects/xxxxxxxx/cases/xxxxxxxx/comments"
                         "/xxxxxxxxxxxxxxxxxx"),
                "createTime": "2021-07-12T21:34:19Z",
                "creator": {
                    "displayName": "Slackbot Admin",
                    "googleSupport": True
                },
                "body": "This is a public case comment",
                "plainTextBody": "This is a public case comment"
            }]
        }
        collection = "cases"
        self.__class__.guid = firestore_write(collection, content)
        self.assertEqual(len(self.__class__.guid), 36)

    def test_step10_get_firestore_first_in(self):
        """
        Run the get_firestore_first_in function.
        """
        first_in_case = get_firestore_first_in(self.case, self.update_time)
        self.assertEqual(first_in_case["guid"], self.__class__.guid)

    def test_step11_get_firestore_cases(self):
        """
        Run the get_firestore_cases function.
        """
        cases = get_firestore_cases()
        self.assertTrue(cases)

    def test_step12_get_parent_failure(self):
        """
        Run the get_parent function and test the failure branch.
        """
        parent = get_parent("xxxxxxxx")
        self.assertEqual(parent, "Case not found")

    def test_step13_get_parent_success(self):
        """
        Run the get_parent function and test the success branch.
        """
        parent = get_parent(self.__class__.case)
        self.assertEqual(parent, self.resource_name)

    def test_step14_case_updates(self):
        """
        Run the case_updates procedure.
        """
        warnings.simplefilter("ignore", ResourceWarning)
        case_updates_output = case_updates(True)
        self.assertEqual(case_updates_output, None)

    def test_step15_case_details(self):
        """
        Run the case_details function. If successful, a message will appear in
        Slack.
        """
        case_details_output = case_details(self.channel_id, self.case,
                                           self.user_id)
        self.assertEqual(case_details_output, None)

    def test_step16_track_case(self):
        """
        Run the track_case function. If successful, a message will appear in
        Slack.
        """
        track_case_output = track_case(self.channel_id, self.channel_name,
                                       self.case, self.user_id)
        self.assertEqual(track_case_output, None)

    def test_step17_get_firestore_tracked_cases(self):
        """
        Run the get_firestore_tracked_cases function.
        """
        tracked_cases = get_firestore_tracked_cases()
        self.assertTrue(tracked_cases)

    def test_step18_notify_slack_comment(self):
        """
        Run the notify_slack procedure for comment. If successful, a message
        will appear in Slack.
        """
        update_type = "comment"
        update_text = (
            "This is a test comment that doesn\"t actually appear on the"
            "case.")

        notify_slack_comment_output = notify_slack(self.case, update_type,
                                                   update_text)
        self.assertEqual(notify_slack_comment_output, None)

    def test_step19_notify_slack_priority(self):
        """
        Run the notify_slack procedure for priority. If successful, a message
        will appear in Slack.
        """
        update_type = "priority"
        update_text = "P5"
        notify_slack_priority_output = notify_slack(self.case, update_type,
                                                    update_text)
        self.assertEqual(notify_slack_priority_output, None)

    def test_step20_notify_slack_closed(self):
        """
        Run the notify_slack procedure for closed. If successful, a message
        will appear in Slack.
        """
        update_type = "closed"
        update_text = ""
        notify_slack_closed_output = notify_slack(self.case, update_type,
                                                  update_text)
        self.assertEqual(notify_slack_closed_output, None)

    def test_step21_notify_slack_escalated(self):
        """
        Run the notify_slack procedure for escalated. If successful, a message
        will appear in Slack.
        """
        update_type = "escalated"
        update_text = ""
        notify_slack_escalated_output = notify_slack(self.case, update_type,
                                                     update_text)
        self.assertEqual(notify_slack_escalated_output, None)

    def test_step22_notify_slack_deescalated(self):
        """
        Run the notify_slack procedure for de-escalated. If successful, a
        message will appear in Slack.
        """
        update_type = "de-escalated"
        update_text = ""
        notify_slack_deescalated_output = notify_slack(self.case, update_type,
                                                       update_text)
        self.assertEqual(notify_slack_deescalated_output, None)

    def test_step23_list_tracked_cases(self):
        """
        Run the list_tracked_cases procedure. If successful, a message will
        appear in Slack.
        """
        list_tracked_cases_output = list_tracked_cases(self.channel_id,
                                                       self.channel_name,
                                                       self.user_id)
        self.assertEqual(list_tracked_cases_output, None)

    def test_step24_list_tracked_cases_all(self):
        """
        Run the list_tracked_cases_all procedure. If successful, a message will
        appear in Slack.
        """
        list_tracked_cases_all_output = list_tracked_cases_all(
            self.channel_id, self.user_id
        )
        self.assertEqual(list_tracked_cases_all_output, None)

    def test_step25_sitrep(self):
        """
        Run the sitrep procedure. If successful, a message will
        appear in Slack.
        """
        sitrep_output = sitrep(self.channel_id)
        self.assertEqual(sitrep_output, None)

    def test_step26_support_add_comment(self):
        """
        Run the support_add_comment procedure. If successful, a message will
        appear in Slack.
        """
        comment = "This is a test comment generated by our testing script."
        support_add_comment_output = support_add_comment(
            self.channel_id, self.case, comment, self.user_id, self.user_name
        )
        self.assertEqual(support_add_comment_output, None)

    def test_step27_support_change_priority(self):
        """
        Run the support_change_priority procedure. If successful, a message
        will appear in Slack.
        """
        priority = "P3"
        support_change_priority_output = support_change_priority(
            self.channel_id, self.case, priority, self.user_id
        )
        self.assertEqual(support_change_priority_output, None)

    def test_step28_support_subscribe_email(self):
        """
        Run the support_change_priority procedure. If successful, a message
        will appear in Slack
        """
        emails = ["testaccount1@example.com", "testaccount2@example.com"]
        support_subscribe_email_output = support_subscribe_email(
            self.channel_id, self.case, emails, self.user_id
        )
        self.assertEqual(support_subscribe_email_output, emails)

    def test_step29_support_close_case(self):
        """
        Run the support_close_case procedure. If successful, a message will
        appear in Slack.
        """
        support_close_case_output = support_close_case(self.channel_id,
                                                       self.case, self.user_id)
        self.assertEqual(support_close_case_output, None)

    def test_step30_firestore_delete_cases_output(self):
        """
        Run the firestore_delete_cases procedure.
        """
        firestore_delete_cases_output = firestore_delete_cases(self.case)
        self.assertEqual(firestore_delete_cases_output, None)

    def test_step31_stop_tracking(self):
        """
        Run the stop_tracking procedure. If successful, a message will appear
        in Slack.
        """
        stop_tracking_output = stop_tracking(
            self.channel_id, self.channel_name,
            self.case, self.user_id
        )
        self.assertEqual(stop_tracking_output, None)

    def test_step32_asset_auto_cc(self):
        """
        Run the auto_asset_cc procedure.
        """
        asset_auto_cc_output = asset_auto_cc(
            self.channel_id, self.channel_name, "projects",
            self.project_number, self.user_id,
            ["test1@example.com", "test2@example.com"]
        )
        self.assertEqual(asset_auto_cc_output, None)

    def test_step33_edit_asset_auto_cc(self):
        """
        Run the edit_asset_auto_cc procedure.
        """
        edit_asset_auto_cc_output = edit_asset_auto_cc(
            self.channel_id, self.channel_name, "projects",
            self.project_number, self.user_id,
            ["test300@example.com", "test302@example.com"]
        )
        self.assertEqual(edit_asset_auto_cc_output, None)

    def test_step34_list_asset_auto_cc_subscriptions(self):
        """
        Run the list_asset_auto_cc_subscriptions procedure.
        """
        list_asset_auto_cc_subs_output = list_asset_auto_cc_subscriptions(
                self.channel_id, self.channel_name)
        self.assertEqual(list_asset_auto_cc_subs_output, None)

    def test_step35_stop_asset_auto_cc(self):
        """
        Run the stop_asset_auto_cc procedure.
        """
        stop_asset_auto_cc_output = stop_asset_auto_cc(
            self.channel_id, self.channel_name,
            "projects", self.project_number,
            self.user_id
        )
        self.assertEqual(stop_asset_auto_cc_output, None)


if __name__ == '__main__':
    unittest.main()
