#!/usr/bin/env python3
#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import os
import re
import sys
import argparse
import pickle
from googleapiclient import discovery, errors
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

SCOPES = [
    'https://www.googleapis.com/auth/iam',
    'https://www.googleapis.com/auth/admin.directory.rolemanagement'
]

parser = argparse.ArgumentParser(
    description='Tool to grant G Suite admin roles to a service account.')
parser.add_argument('--role',
                    default='Groups Administrator',
                    help='Role to grant.')
parser.add_argument('--project',
                    default='',
                    help='Set the project where the service account is.')
parser.add_argument('--credentials',
                    default='credentials.json',
                    help='An OAuth2 client secrets file in JSON.')

parser.add_argument(
    'customer_id',
    help='Customer ID from admin.google.com > Account > Account settings')
parser.add_argument('service_account', help='Service account email.')
args = parser.parse_args()
if not os.path.exists(args.credentials):
    print(
        'You\'ll need to create an OAuth2 client ID and secret for this application.',
        file=sys.stderr)
    print(
        'In Cloud Console, go to APIs & Services > Credentials > Create Credential, ',
        file=sys.stderr)
    print('Then click on Create credentials and select OAuth client ID.\n',
          file=sys.stderr)
    print(
        'Select Desktop app and type application name (eg. "Workspace Role Granter")',
        file=sys.stderr)
    print(
        'Click Ok and find the application the list and click the download button.\n',
        file=sys.stderr)
    print(
        'Place the file in current directory named as credentials.json\nor specify path with --credentials argument.',
        file=sys.stderr)
    sys.exit(1)

# The file token.pickle stores the user's access and refresh tokens, and is
# created automatically when the authorization flow completes for the first
# time.
credentials = None
PICKLE_FILE = 'grant-gsuite-role.pickle'
if os.path.exists(PICKLE_FILE):
    with open(PICKLE_FILE, 'rb') as token:
        credentials = pickle.load(token)
# If there are no (valid) credentials available, let the user log in.
if not credentials or not credentials.valid:
    if credentials and credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    else:
        flow = InstalledAppFlow.from_client_secrets_file(
            args.credentials, SCOPES)
        credentials = flow.run_local_server(port=0)
    # Save the credentials for the next run
    with open(PICKLE_FILE, 'wb') as token:
        pickle.dump(credentials, token)

if not args.project:
    p = re.compile('(@)(.+?)(\.iam\.gserviceaccount.com)')
    m = p.search(args.service_account)
    if m:
        args.project = m.group(2)

admin_service = discovery.build('admin',
                                'directory_v1',
                                credentials=credentials)
request = admin_service.roles().list(customer=args.customer_id)
response = request.execute()
roleId = None
while request:
    for role in response['items']:
        if role['roleName'] == args.role or role['roleDescription'] == args.role:
            roleId = role['roleId']
            break
    request = admin_service.roles().list_next(request, response)
    if request:
        response = request.execute()
if not roleId:
    print('Unable to find role "%s"!' % (args.role), file=sys.stderr)
    sys.exit(1)

iam_service = discovery.build('iam', 'v1', credentials=credentials)
request = iam_service.projects().serviceAccounts().get(
    name="projects/%s/serviceAccounts/%s" %
    (args.project, args.service_account))
response = request.execute()
if not 'uniqueId' in response:
    print('Unable to find service account "%s"!' % (args.service_account),
          file=sys.stderr)
    sys.exit(1)
uniqueId = response['uniqueId']

try:
    admin_service.roleAssignments().insert(customer=args.customer_id,
                                           body={
                                               'assignedTo': uniqueId,
                                               'roleId': roleId,
                                               'scopeType': 'CUSTOMER'
                                           }).execute()
    print('Service account "%s" (%s) has been granted role %s!' %
          (args.service_account, uniqueId, roleId),
          file=sys.stderr)
except errors.HttpError as exc:
    if 'HttpError 500' in str(exc):
        print(
            'Received error 500, which probably means service account already has permissions.',
            file=sys.stderr)
    else:
        raise exc
