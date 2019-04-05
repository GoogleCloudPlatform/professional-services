#!/usr/bin/env python

from __future__ import print_function

import argparse
import sys

from apiclient.discovery import build

import google.auth
from google.auth import iam
from google.auth.transport import requests
from google.oauth2 import service_account


TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
GROUP_READ_SCOPES = [
    'https://www.googleapis.com/auth/admin.directory.group.readonly'
]


def group_list(name, credentials, version='directory_v1'):
    service = build('admin', version, credentials=credentials)
    request = service.members().list(groupKey=name, roles='MEMBER')
    members = []
    while request is not None:
        response = request.execute()
        members += [i['email'] for i in response.get('members', [])]
        request = service.members().list_next(request, response)

    return members


def delegated_credential(credentials, subject, scopes):
    try:
        admin_creds = credentials.with_subject(subject).with_scopes(scopes)
    except AttributeError:  # Looks like a compute creds object

        # Refresh the boostrap credentials. This ensures that the information
        # about this account, notably the email, is populated.
        request = requests.Request()
        credentials.refresh(request)

        # Create an IAM signer using the bootstrap credentials.
        signer = iam.Signer(request, credentials,
                            credentials.service_account_email)

        # Create OAuth 2.0 Service Account credentials using the IAM-based
        # signer and the bootstrap_credential's service account email.
        admin_creds = service_account.Credentials(
            signer, credentials.service_account_email, TOKEN_URI,
            scopes=scopes, subject=subject)
    except Exception:
        raise

    return admin_creds


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--group', required=True)
    parser.add_argument('--delegated-subject', required=True)
    args = parser.parse_args(argv)

    # Credentials from GOOGLE_APPLICATION_CREDENTIALS if set, otherwise
    # use GCE Metadara service
    credentials, _ = google.auth.default()

    admin_creds = delegated_credential(credentials, args.delegated_subject,
                                       GROUP_READ_SCOPES)
    print('\n'.join(group_list(args.group, admin_creds)))


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
