#!/usr/bin/env python
# Copyright 2018 Google Inc.
#
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

'''
syncOwners.py reads the membership of a Google Group and
uses that to populate the "verified owners" of a domain
in the Google Search Console
'''

import json

from apiclient.discovery import build
from google.oauth2 import service_account

def get_config():
    '''
    Read config from json file
    '''

    with open('config.json') as config_file:
        data = json.load(config_file)
    return data['domain'], data['group'], data['adminUser'], data['service-account-key']

def get_members(credentials, group, admin_user):
    '''
    Retrieve list of email addresses of all members of the group
    Args:
    credentials: Google OAuth credentials
    group: Email address of the group to check membership for
    admin_user: The email address of a user in the domain with admin rights
    '''

    delegated_credentials = credentials.with_subject(admin_user)
    admin_service = build('admin', 'directory_v1', credentials=delegated_credentials)
    admin_response = admin_service.members().list(groupKey=group).execute()
    members = []
    for member in admin_response['members']:
        members.append(member['email'])
    return members

def set_permissions(credentials, domain, users):
    '''
    Update the "verified owners" list for the specified domain
    Args:
    credentials: Google OAuth credentials
    domain: the dns name of the domain to update
    users: list of users to be applied as "verified owners"
    '''

    url = 'dns://'
    url += domain
    service = build('siteVerification', 'v1', credentials=credentials)
    response = service.webResource().update(
        id=url,
        body={
            'owners': users,
            'site': {
                'type': 'INET_DOMAIN',
                'identifier': domain
            }
        }).execute()
    return response

def main():
    ''' Main entry-point for the program '''

    domain, group, admin_user, service_account_key = get_config()
    scopes = ['https://www.googleapis.com/auth/siteverification', \
    'https://www.googleapis.com/auth/admin.directory.group.member.readonly']
    credentials = \
    service_account.Credentials.from_service_account_file(service_account_key, scopes=scopes)
    verified_users = get_members(credentials, group, admin_user)
    result = set_permissions(credentials, domain, verified_users)
    print result

if __name__ == '__main__':
    main()
