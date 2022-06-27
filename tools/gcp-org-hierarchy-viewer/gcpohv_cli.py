# -*- coding: utf-8 -*-

# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import sys
import collections
import functools

import asciitree
from google.auth import exceptions
from google.oauth2 import service_account
from googleapiclient import discovery, errors

_ORG = '🏢'
_FOLDER = '📁'
_PROJ = '📦'


def setup_credentials(credentials_file):
    """ Given a path to a credentials file, sets up Oauth scopes (read only),
      instantiates and returns a Credentials object.

    Args:
        credentials_file: Path to credentials file as a str

    Returns:
        google.oauth2.service_account.Credentials or None
    """
    if not credentials_file:
        return None

    scopes = ['https://www.googleapis.com/auth/cloud-platform.read-only']
    return service_account.Credentials.from_service_account_file(
        credentials_file, scopes=scopes)


def setup_clients(credentials_file):
    """ Sets up API clients for Cloud Resource Manager and returns them
      as a tuple.

    Args:
        credentials_file:  Path to credentials file as a str.

    Returns:
        Tuple of two googleapiclient.discovery.Resource(s) for Cloud Resource
          Manager.
    """
    creds = setup_credentials(credentials_file)
    crm_v1 = discovery.build('cloudresourcemanager',
                             'v1',
                             credentials=creds,
                             static_discovery=True)
    crm_v2 = discovery.build('cloudresourcemanager',
                             'v2',
                             credentials=creds,
                             static_discovery=True)
    return crm_v1, crm_v2


def resource_filter(value, resource, field='displayName'):
    """ Given a mapping (resource), gets the data at resource[field] and
      checks for equality for the argument value. When field is 'name', it is
      expected to look like 'organization/1234567890', and returns only the
      number after the slash.

    Args:
        value: Value to use in an equality check against `resource[field]`.
        resource: A mapping type.
        field: A valid map key which is used to do a lookup in `resource`.

    Returns:
        Boolean representing whether `value` is equal to `resource[field]`.
    """
    if field == 'name':
        return resource[field].split('/')[1] == value
    return resource[field] == value


class Cli:
    """ Represents the entire CLI, UX, and the logic required to support it. """
    def __init__(self, credentials_file, organization, folder, use_org_id):
        """ Inits Cli class.

        Args:
            credentials_file: Path to a credentials file as a str.
            organization: Organization ID as a str.
            folder: Folder ID as a str.
            use_org_id: Boolean; whether to match by organization ID or name
        """
        self.organization = organization
        self.folder = folder
        self.use_org_id = use_org_id
        self._crm_v1, self._crm_v2 = setup_clients(credentials_file)

    # Default projects.list() returns limited number of items and a nextPageToken
    # This function will recursively load all projects
    def load_all_projects(self,token = None):
        projects = None
        if token == None:
            projects = self._crm_v1.projects().list().execute()
        else:
            projects = self._crm_v1.projects().list(pageToken=token).execute()
        if "nextPageToken" in projects:
            next_page_projects = self.load_all_projects(projects["nextPageToken"])
            projects["projects"] = projects["projects"] + next_page_projects["projects"]
        return projects

    def _get_projects(self):
        """ Gets all available projects and organize by parent type,
          organization and folder.

        Returns:
            2-tuple of dicts
        """
        projs = self.load_all_projects()
        
        fold_parents = collections.defaultdict(list)

        gen = (p for p in projs['projects']
               if 'parent' in p and p['parent']['type'] == 'folder'
               and p['lifecycleState'] == 'ACTIVE')
        for p in gen:
            fold_parents[p['parent']['id']].append(p)

        org_parents = collections.defaultdict(list)

        gen = (p for p in projs['projects']
               if 'parent' in p and p['parent']['type'] == 'organization'
               and p['lifecycleState'] == 'ACTIVE')
        for p in gen:
            org_parents[p['parent']['id']].append(p)

        return fold_parents, org_parents

    def run(self):
        """ Runs the CLI login flow.

        Returns:
            None
        """
        fold_parents, org_parents = self._get_projects()

        def recurse_and_attach(parent, tree):
            """ Given a tree (a dict) and a parent node, traverses depth-first
              in the org hierarchy, attaching children to parents in tree.

            Args:
                parent: parent node as str
                tree: mapping to use to construct the org hierarchy

            Returns:
                None
            """
            result = self._crm_v2.folders().list(parent=parent).execute()
            if 'folders' in result:
                for folder in result['folders']:
                    f_str = '{} {} ({})'.format(_FOLDER, folder["displayName"],
                                                folder["name"].split("/")[1])
                    tree[f_str] = {}

                    _id = folder["name"].split('/')[1]
                    if _id in fold_parents:
                        for project in fold_parents[_id]:
                            proj_name = '{} {}'.format(_PROJ,
                                                       project["projectId"])
                            tree[f_str][proj_name] = {}

                    recurse_and_attach(folder['name'], tree[f_str])

        t = {}

        # If an org flag is set, finds the org by name or ID, walks the org
        # hierarchy starting at the organization, uses the tree and attaches
        # folders and projects recursively
        if self.organization:
            resp = self._crm_v1.organizations().search(body={}).execute()
            orgs = resp.get('organizations')

            if not orgs:
                raise SystemExit('No organizations found')

            org_id = [
                org['name'].split('/')[1] for org in orgs
                if self.organization in org['displayName']
                or self.organization in org['name']
            ][0]

            if self.use_org_id:
                filter_func = functools.partial(resource_filter,
                                                self.organization,
                                                field='name')
            else:
                filter_func = functools.partial(resource_filter,
                                                self.organization)

            try:
                org = next(filter(filter_func, orgs))
            except StopIteration:
                raise SystemExit('Could not find organization {}'
                                 ''.format(self.organization))

            org_name = '{} {} ({})'.format(_ORG, org["displayName"],
                                           org["name"].split('/')[1])
            t[org_name] = {}

            recurse_and_attach(org['name'], t[org_name])

            for project in org_parents.get(org_id, []):
                proj_name = '{} {}'.format(_PROJ, project["projectId"])
                t[org_name][proj_name] = {}

        # If the folder flag is set, walks the organization hierarchy starting
        # at a folder node and attaches folders and projects.
        if self.folder:
            folder = self._crm_v2.folders().get(
                name='folders/{}'.format(self.folder)).execute()
            fold_name = '{} {} ({})'.format(_FOLDER, folder["displayName"],
                                            self.folder)
            t[fold_name] = {}

            recurse_and_attach(folder['name'], t[fold_name])

            for project in fold_parents.get(self.folder, []):
                proj_name = '{} {}'.format(_PROJ, project["projectId"])
                t[fold_name][proj_name] = {}

        tr = asciitree.LeftAligned(draw=asciitree.BoxStyle())
        print(tr(t))


def parse_args():
    """ Sets up an argument parser and parses the args, returning the argument
    namespace.

    Returns:
        argparse.Namespace
    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-k',
        '--key-file',
        help='Path to service account credentials. If you chose to omit this, '
        'SDK will fall back to default credentials and possibly spew '
        'warnings.')
    parser.add_argument('--use-id',
                        action='store_true',
                        help='if supplied, searches on org id instead of name')

    group = parser.add_mutually_exclusive_group()
    group.add_argument('-o',
                       '--organization',
                       help='organization name to use for search')
    group.add_argument('-f', '--folder', help='folder ID to use for search')

    args = parser.parse_args()

    if not (args.organization or args.folder):
        parser.print_help()
        print(
            '\nOne of [--organization ORGANIZATION | --folder FOLDER] is '
            'required.',
            file=sys.stderr)
        sys.exit(1)

    return args


def main():
    """ Entry point; invoked if __name__ == '__main__'.  Mostly just runs Cli.
    """
    args = parse_args()
    try:
        cli = Cli(args.key_file, args.organization, args.folder, args.use_id)
    except exceptions.DefaultCredentialsError as e:
        m = 'No credentials provided; use -k or see --help'
        raise RuntimeError(m) from e

    try:
        cli.run()
    except errors.HttpError as e:
        if e.resp['status'] == '403':
            m = ('Permission denied with request to Google API.  Ensure '
                 'account has the correct permissions.')
        else:
            m = 'Error occurred contacting the Google API'
        raise RuntimeError(m) from e


if __name__ == '__main__':
    main()
