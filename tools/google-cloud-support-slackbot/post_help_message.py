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

logger = logging.getLogger(__name__)


def post_help_message(channel_id, user_id, context):
    """
    Informs the user of the app"s available commands.

    Parameters
    ----------
    channel_id : str
      unique string used to idenify a Slack channel. Used to send messages to
      the channel
    user_id : str
      the Slack user_id of the user who submitted the request. Used to send
      ephemeral messages to the user
    context : str
      Extra information to go with the help message. Usually a statement of a
      command not existing
    """
    client = slack.WebClient(token=os.environ.get("SLACK_TOKEN"))
    client.chat_postEphemeral(
        channel=channel_id,
        user=user_id,
        text=f"{context}Here are the available commands:"
        "\n/google-cloud-support track-case [case number] -- case updates"
        " will be posted to this channel"
        "\n/google-cloud-support add-comment [case number] [comment] --"
        " adds a comment to the case"
        "\n/google-cloud-support change-priority [case number]"
        " [priority, e.g. P1] -- changes the priority of the case"
        "\n/google-cloud-support subscribe [case number] [email 1]"
        " ... [email n]"
        " -- subscribes the given emails addresses to the case to receive"
        " updates to their inboxes. This overwrites the previous list"
        " of emails"
        "\n/google-cloud-support escalate [case number] [reason]"
        " [justification] -- escalates the support case. Reason must be"
        " either RESOLUTION_TIME, TECHNICAL_EXPERTISE, or BUSINESS_IMPACT"
        "\n/google-cloud-support close-case [case number] -- closes a case"
        "\n/google-cloud-support stop-tracking [case number] -- case updates"
        " will no longer be posted to this channel"
        "\n/google-cloud-support list-tracked-cases -- lists all cases being"
        " tracked in this channel"
        "\n/google-cloud-support list-tracked-cases-all -- lists all cases"
        " being tracked in the workspace"
        "\n/google-cloud-support case-details [case_number] -- pull all of"
        " the case data as json"
        "\n/google-cloud-support sitrep -- report of all active cases in"
        " the org"
        "\n/google-cloud-support auto-subscribe [asset type] [asset name]"
        " [email 1] ... [email n] -- creates a subscription to a specific"
        " asset that will automatically add the provided emails as CC on any"
        " under the asset. asset type must one of the following"
        " values: organizations, folders, projects"
        "\n/google-cloud-support edit-auto-subscribe [asset type]"
        " [asset name] [email 1] ... [email n] -- edits an existing asset"
        " subscription with the provided emails. Warning: this will overwrite"
        " existing emails in the subscription. asset type must be one of the"
        " following values: organizations, folders, projects"
        "\n/google-cloud-support stop-auto-subscribe [asset type]"
        " [asset_name] -- deletes an existing asset subscription. asset type"
        " must be one of the following values: organizations,"
        " folders, projects"
        "\n/google-cloud-support list-auto-subscriptions-all -- lists all"
        " the subscriptions being in the current channel"
        "\n/google-cloud-support autotrack-create [asset type] [asset name]"
        " [P1] ... [P4] -- automatically tracks all new cases of matching"
        " priority in the specified asset in this channel. asset type must"
        " be one of the following values: organizations, folders, projects"
        "\n/google-cloud-support autotrack-edit [asset type]"
        " [asset name] [P1] ... [P4] -- edits autotracking of"
        " an asset in this channel. This overwrites the existing list of"
        " priorities. asset type must be one of the"
        " following values: organizations, folders, projects"
        "\n/google-cloud-support autotrack-stop [asset type]"
        " [asset_name] -- deletes autotracking against an asset. asset type"
        " must be one of the following values: organizations,"
        " folders, projects"
        "\n/google-cloud-support list-autotrack-all -- lists all"
        " the assets being autotracked in the current channel and the"
        " priorities they are configured for"
    )


if __name__ == "__main__":
    test_channel_id = os.environ.get("TEST_CHANNEL_ID")
    test_user_id = os.environ.get("TEST_USER_ID")
    test_context = "This is a test of the post_help_message function. "
    post_help_message(test_channel_id, test_user_id, test_context)
