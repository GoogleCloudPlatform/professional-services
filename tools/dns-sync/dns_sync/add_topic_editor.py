# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import logging

from googleapiclient import discovery
from oauth2client import client

# It's not currently possible to edit the IAM policy of a topic via the gcloud
# command line tool. This script accepts a topic and owning project-id and adds
# the cloud-logs@system.gserviceaccount.com account as an editor so Stackdriver
# logging export can publish events to it.


def add_member_to_topic(project, topic, role, member):
    """Adds the member to topic in project with role.

    Gets the IAM Policy of the topic and checks if the input member has
    the input role access. If not, adds the member to the IAM Policy with the
    input role.

    Args:
        project: The project-id of the project owning the topic.
        topic: The pub/sub topic name.
        role: The role to add the member as, typically 'roles/editor'.
        member: The member to add to the policy.

    Returns:
        A two item tuple, (role-added, iam-policy).

        role-added: boolean that is true if the member was added, and false if
        the member already existed in the policy.

        iam-policy: the current iam policy of the topic.
    """
    credentials = client.GoogleCredentials.get_application_default()
    pubsub = discovery.build('pubsub', 'v1', credentials=credentials)
    resource = 'projects/{0}/topics/{1}'.format(project, topic)
    iam_policy = pubsub.projects().topics().getIamPolicy(
        resource=resource).execute(
            num_retries=3)
    logging.debug('Existing iam_policy is  %s.', iam_policy)
    if 'bindings' not in iam_policy:
        iam_policy['bindings'] = [{'role': role, 'members': []}]
    role_binding = None
    for binding in iam_policy['bindings']:
        if binding.get('role', None) == role:
            role_binding = binding
    if role_binding is None:
        role_binding = {'role': role, 'members': []}
        iam_policy['bindings'].append(role_binding)
    if member not in role_binding['members']:
        role_binding['members'].append(member)
        logging.debug('Adding %s to role %s.', member, role)
        return (True, pubsub.projects().topics().setIamPolicy(
            resource=resource, body={'policy': iam_policy}).execute(
                num_retries=3))
    return (False, iam_policy)


def main():
    """Command line utility to add a member as an editor of a topic."""

    logging.basicConfig(level=logging.DEBUG)
    ap = argparse.ArgumentParser(
        description=('Adds cloud-logs@system.gserviceaccount.com service '
                     'account as an editor of the input topic. Required for '
                     'Stackdriver logging export to function.'))
    ap.add_argument('project', help='The project id owning the topic.')
    ap.add_argument('topic', help='The name of the topic.')
    args = ap.parse_args()
    project = args.project
    topic = args.topic
    added, policy = add_member_to_topic(
        project, topic, 'roles/editor',
        'serviceAccount:cloud-logs@system.gserviceaccount.com')
    if added:
        logging.info('Succesfully added member to policy %s.', policy)
    else:
        logging.info('Member already in policy %s.', policy)


if __name__ == '__main__':
    main()
