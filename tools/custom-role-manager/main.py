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
import yaml
import argparse
import logging
import fnmatch
import googleapiclient.discovery
from googleapiclient import http
from pythonjsonlogger import jsonlogger
import google_auth_httplib2
import google.auth

NAME = 'custom-role-manager'
TERRAFORM_TEMPLATES = {
    'pre':
        '',
    'organization':
        '''resource "google_organization_iam_custom_role" "{terraform_id}" {{
  role_id     = "{role_id}"
  org_id      = "{organization_id}"
  title       = "{role_title}"
  description = "{role_description}"
  permissions = {role_permissions}
}}
      
      ''',
    'project':
        '''resource "google_project_iam_custom_role" "{terraform_id}" {{
  role_id     = "{role_id}"
  title       = "{role_title}"
  description = "{role_description}"
  permissions = {role_permissions}
}}

      ''',
    'post':
        ''
}
TERRAFORM_PRE = False
TERRAFORM_RESOURCES = {}


def process_permission(logger, role, permissions_to_grant, permission_name):
    permission_candidate = None
    if 'include' in role:
        for include_permission in role['include']:
            permission_candidate = None
            if include_permission.startswith(
                    '/') and include_permission.endswith('/'):  # Regexp
                if re.match(include_permission[1:len(include_permission) - 1],
                            permission_name):
                    permission_candidate = permission_name
                    break
            else:
                if fnmatch.fnmatch(permission_name, include_permission):
                    permission_candidate = permission_name
                    break

    if permission_candidate:
        if 'exclude' in role:
            for exclude_permission in role['exclude']:
                if exclude_permission.startswith(
                        '/') and exclude_permission.endswith('/'):  # Regexp
                    if re.match(
                            exclude_permission[1:len(exclude_permission) - 1],
                            permission_candidate):
                        permission_candidate = None
                        break
                else:
                    if fnmatch.fnmatch(permission_candidate,
                                       exclude_permission):
                        permission_candidate = None
                        break
        if permission_candidate:
            permissions_to_grant.append(permission_candidate)
    else:
        permission_candidate = permission_name
    return permissions_to_grant


def process_role(logger, service, role, output_terraform=False):
    global TERRAFORM_PRE, TERRAFORM_TEMPLATES, TERRAFORM_RESOURCES
    if 'source' not in role:
        logger.error('Source not defined for role.', extra={'role': role['id']})
        sys.exit(2)

    role_exists = True
    role_name = '%s/roles/%s' % (role['parent'], role['id'])
    if role['parent'].startswith('organizations/'):
        role_request = service.organizations().roles().get(name=role_name)
    else:
        role_request = service.projects().roles().get(name=role_name)
    try:
        role_response = role_request.execute()
    except googleapiclient.errors.HttpError as e:
        if e.resp.status == 404 or e.resp.status == 400:
            role_exists = False
        else:
            raise e

    if not isinstance(role['source'], list):
        sources = [role['source']]
    else:
        sources = role['source']

    permissions_to_grant = []
    for source in sources:
        if source.startswith('roles/'):
            source_request = service.roles().get(name=source)
            source_response = source_request.execute()
            for p in source_response['includedPermissions']:
                permissions_to_grant = process_permission(
                    logger, role, permissions_to_grant, p)

        if source.startswith('//'):
            next_page_token = None
            while True:
                permissions = service.permissions().queryTestablePermissions(
                    body={
                        'fullResourceName': source,
                        'pageToken': next_page_token
                    }).execute()
                for p in permissions['permissions']:
                    if ('stage' not in p or p['stage'] != 'DEPRECATED') and (
                            'customRolesSupportLevel' not in p or
                            p['customRolesSupportLevel'] != 'NOT_SUPPORTED'):
                        permissions_to_grant = process_permission(
                            logger, role, permissions_to_grant, p['name'])
                else:
                    if 'stage' in p and p['stage'] == 'DEPRECATED':
                        logger.info('Permission %s is deprecated.' %
                                    (p['name']),
                                    extra={
                                        'permission': p['name'],
                                    })
                    if 'customRolesSupportLevel' in p and p[
                            'customRolesSupportLevel'] == 'NOT_SUPPORTED':
                        logger.info(
                            'Permission %s is not supported in custom roles.' %
                            (p['name']),
                            extra={
                                'permission': p['name'],
                            })

                if 'nextPageToken' in permissions:
                    next_page_token = permissions['nextPageToken']
                else:
                    break
    if 'append' in role:
        for permission in role['append']:
            permissions_to_grant.append(permission)

    logger.info('%d permissions determined for role %s.' %
                (len(permissions_to_grant), role['id']),
                extra={
                    'role': role['id'],
                    'permissions': permissions_to_grant
                })
    if output_terraform:
        if not TERRAFORM_PRE:
            print(TERRAFORM_TEMPLATES['pre'])
            TERRAFORM_PRE = True
        organization_id = ''
        project_id = ''
        terraform_id = role['tfId'] if 'tfId' in role else role['id']
        tf_template = 'project'
        if 'organizations/' in role['parent']:
            organization_id = role['parent'].replace('organizations/', '')
            tf_template = 'organization'
            TERRAFORM_RESOURCES[
                terraform_id] = 'google_organization_iam_custom_role.%s' % (
                    terraform_id)
        else:
            project_id = role['parent'].replace('projects/', '')
            TERRAFORM_RESOURCES[
                terraform_id] = 'google_project_iam_custom_role.%s' % (
                    terraform_id)
        role_id = role['id']
        role_title = role['title'] if 'title' in role else ''
        role_description = role['description'] if 'description' in role else ''
        role_permissions = str(permissions_to_grant).replace('\'', '"')
        print(TERRAFORM_TEMPLATES[tf_template].format(
            role_id=role_id,
            terraform_id=terraform_id,
            organization_id=organization_id,
            project_id=project_id,
            role_title=role_title.replace('"', '\\"'),
            role_description=role_description.replace('"', '\\"'),
            role_permissions=role_permissions))

    elif not role_exists:
        logger.info('Creating role: %s' % (role['id']),
                    extra={
                        'role': role['id'],
                    })
        create_role_request_body = {
            'roleId': role['id'],
            'role': {
                'title': role['title'],
                'description': role['description'],
                'includedPermissions': permissions_to_grant,
                'stage': role['stage'],
            }
        }

        if role['parent'].startswith('organizations/'):
            role_create_request = service.organizations().roles().create(
                parent=role['parent'], body=create_role_request_body)
        else:
            role_create_request = service.projects().roles().create(
                parent=role['parent'], body=create_role_request_body)
        role_create_response = role_create_request.execute()
        logger.warning('Role created: %s' % (role['id']),
                       extra={
                           'role': role['id'],
                           'role_name': role_create_response['name'],
                           'etag': role_create_response['etag']
                       })
    elif not output_terraform:
        if 'includedPermissions' not in role_response:
            role_response['includedPermissions'] = []
        added_permissions = set(permissions_to_grant) - set(
            role_response['includedPermissions'])
        removed_permissions = set(
            role_response['includedPermissions']) - set(permissions_to_grant)
        if len(added_permissions) > 0 or len(removed_permissions) > 0:
            logger.info('Permissions changed for role: %s' % (role['id']),
                        extra={
                            'role': role['id'],
                            'role_name': role_response['name'],
                            'added_permissions': list(added_permissions),
                            'removed_permissions': list(removed_permissions),
                            'etag': role_response['etag']
                        })

            patch_role_request_body = {
                'name': role_response['name'],
                'title': role['title'],
                'description': role['description'],
                'includedPermissions': permissions_to_grant,
                'stage': role['stage'],
                'etag': role_response['etag']
            }

            if role['parent'].startswith('organizations/'):
                role_patch_request = service.organizations().roles().patch(
                    name=role_response['name'], body=patch_role_request_body)
            else:
                role_patch_request = service.projects().roles().patch(
                    name=role_response['name'], body=patch_role_request_body)
            role_patch_response = role_patch_request.execute()
            logger.warning('Role updated: %s' % (role['id']),
                           extra={
                               'role': role['id'],
                               'role_name': role_patch_response['name'],
                               'added_permissions': list(added_permissions),
                               'removed_permissions': list(removed_permissions),
                               'etag': role_patch_response['etag']
                           })
        else:
            logger.info('Permissions unchanged for role: %s' % (role['id']),
                        extra={
                            'role': role['id'],
                            'role_name': role_response['name'],
                            'etag': role_response['etag']
                        })


def setup_logging():
    logger = logging.getLogger(NAME)
    if os.getenv('LOG_LEVEL'):
        logger.setLevel(int(os.getenv('LOG_LEVEL')))
    else:
        logger.setLevel(logging.INFO)
    json_handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    json_handler.setFormatter(formatter)
    logger.addHandler(json_handler)
    return logger


logger = setup_logging()


def process_pubsub(event, context):
    logger.info('%s starting to process Pub/Sub message.' % (NAME))
    with open('config.yaml') as f:
        config = yaml.load(f, Loader=yaml.SafeLoader)
        if 'roles' not in config:
            logger.error('Roles are not defined in the configuration!')
            sys.exit(1)
        for role in config['roles']:
            process_role(logger, service, role)


if __name__ == '__main__':
    arg_parser = argparse.ArgumentParser(
        description=
        'Create custom roles by filtering existing permissions or roles')
    arg_parser.add_argument('--config',
                            type=str,
                            help='Configuration file',
                            default='config.yaml')
    arg_parser.add_argument(
        '--terraform',
        action='store_true',
        help='Output a Terraform compatible custom role definition instead',
        default=False)
    args = arg_parser.parse_args()
    credentials, project_id = google.auth.default(
        ['https://www.googleapis.com/auth/cloud-platform'])
    branded_http = google_auth_httplib2.AuthorizedHttp(credentials)
    branded_http = http.set_user_agent(
        branded_http, 'google-pso-tool/custom-role-manager/1.0.0')
    service = googleapiclient.discovery.build('iam', 'v1', http=branded_http)
    with open(args.config) as f:
        config = yaml.load(f, Loader=yaml.SafeLoader)
        if 'roles' not in config:
            logger.error('Roles are not defined in the configuration!')
            sys.exit(1)
        if 'terraform' in config:
            for k, v in config['terraform'].items():
                TERRAFORM_TEMPLATES[k] = v
        for role in config['roles']:
            process_role(logger, service, role, args.terraform)
        if TERRAFORM_PRE:
            resources = ''
            for k, v in TERRAFORM_RESOURCES.items():
                if resources == '':
                    resources = '{'
                else:
                    resources += ', '
                resources += '"%s" = %s' % (k, v)
            if resources != '':
                resources += '}'
            print(TERRAFORM_TEMPLATES['post'].format(resources=resources))
