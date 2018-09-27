#!/usr/bin/python

import httplib2
import json

from apiclient import errors
from apiclient.discovery import build
from oauth2client.client import OAuth2WebServerFlow
from google.oauth2 import service_account

def getConfig():
        with open('config.json') as f:
                data = json.load(f)
        return data["domain"], data["group"], data["adminUser"], data["service-account-key"]

def getMembers(credentials, group, adminUser):
        delegated_credentials = credentials.with_subject(adminUser)
        admin_service = build('admin', 'directory_v1', credentials=delegated_credentials)
        admin_response= admin_service.members().list(groupKey=group).execute()
        members = []
        for member in admin_response[u'members']:
                members.append(member[u'email'])
        return members

def setPermissions(credentials, domain, users):
        url = 'dns://'
        url += domain
        service = build('siteVerification', 'v1', credentials=credentials)
        response = service.webResource().update(
        id=url,
        body={
                "owners": users,
                "site": {
                        "type": "INET_DOMAIN",
                        "identifier": domain
                }
        }).execute()
        return response

if __name__ == '__main__':
        domain, group, adminUser, serviceAccountKey = getConfig()
        scopes = ['https://www.googleapis.com/auth/siteverification', 'https://www.googleapis.com/auth/admin.directory.group.member.readonly']
        credentials = service_account.Credentials.from_service_account_file(serviceAccountKey, scopes=scopes)
        verifiedUsers = getMembers(credentials, group, adminUser)
        result = setPermissions(credentials, domain, verifiedUsers)
        print result
