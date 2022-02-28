# Copyright 2021 Google Inc. All Rights Reserved.
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
"""Helper functions to interact with GCP projects."""

import functools

import cachetools

from src.common.lib import gcp

_CACHE_MAX_SIZE = 4096
_CACHE_TTL = 300

_NA = 'N/A'


# pylint:disable=too-many-instance-attributes
class Project:
    """Object to represent project data."""
    def __init__(self):
        self.id = ''  # pylint:disable=invalid-name
        self.name = ''
        self.number = ''
        self.parent_type = ''
        self.parent_id = ''
        self.parent_name = ''
        self.ancestry = ''
        self.timestamp = ''

    def to_dict(self):
        """Return objects data as dict."""
        return {
            'id': self.id,
            'name': self.name,
            'number': self.number,
            'parent_type': self.parent_type,
            'parent_id': self.parent_id,
            'parent_name': self.parent_name,
            'ancestry': self.ancestry,
            'timestamp': self.timestamp
        }

    @classmethod
    def from_dict(cls, data):
        """Build Project object from dict data."""
        prj = cls()
        prj.id = data.get('id', '')
        prj.name = data.get('name', '')
        prj.number = data.get('number', '')
        prj.parent_type = data.get('parent_type', '')
        prj.parent_id = data.get('parent_id', '')
        prj.parent_name = data.get('parent_name', '')
        prj.ancestry = data.get('ancestry', '')
        prj.timestamp = data.get('timestamp', '')
        return prj

    def __str__(self):
        return 'Project - Id: %s, Name: %s' % (self.id, self.name)


# pylint:enable=too-many-instance-attributes


def _cache_key(*args):
    return args[:-1]


@cachetools.cached(cache=cachetools.TTLCache(maxsize=_CACHE_MAX_SIZE,
                                             ttl=_CACHE_TTL),
                   key=_cache_key)
def _get_ancestry(project_id, project_number, prjs_client):
    """Get ancestry details for a given project."""
    request = prjs_client.getAncestry(projectId=project_id)
    res = gcp.execute_request(request)
    if not res:
        return ''
    ancestry = [r['resourceId']['id'] for r in res['ancestor'][::-1]]
    ancestry[-1] = project_number
    prj_ancestry = '/'.join(ancestry)
    return prj_ancestry


@cachetools.cached(cache=cachetools.TTLCache(maxsize=_CACHE_MAX_SIZE,
                                             ttl=_CACHE_TTL),
                   key=_cache_key)
def _get_parent_details(parent_type, parent_id, flds_client):
    """Get folder name for a project."""
    parent_name = None
    if parent_type == 'folder':
        request = flds_client.get(name='folders/%s' % parent_id)
        result = gcp.execute_request(request)
        result = result or {}
        parent_name = result.get('displayName')
    parent_name = parent_name or _NA
    return parent_name


def _get_prjs_data(filter_str, prjs_client):
    """Query and paginate all active projects."""
    request = prjs_client.list(filter=filter_str)
    while request is not None:
        response = gcp.execute_request(request)
        if not response:
            break
        yield response.get('projects', tuple())
        request = prjs_client.list_next(previous_request=request,
                                        previous_response=response)


def _project(project_json, prjs_client, flds_client):
    """Build Project data."""
    project = Project()
    if not project_json:
        return project

    project.name = project_json['name']
    project.id = project_json['projectId']
    project.number = project_json['projectNumber']

    parent_type = project_json.get('parent', {}).get('type', _NA)
    parent_id = project_json.get('parent', {}).get('id', _NA)
    parent_name = _get_parent_details(parent_type, parent_id, flds_client)
    project.ancestry = _get_ancestry(project.id, project.number, prjs_client)
    project.parent_type = parent_type
    project.parent_id = parent_id
    project.parent_name = parent_name
    return project


def _paginate_projects_data(filter_str='lifecycleState:ACTIVE',
                            prjs_client=None,
                            creds=None):
    """Paginate through project 'list' API results."""
    prjs_client = prjs_client or gcp.projects_service(creds=creds)
    all_data = _get_prjs_data(filter_str, prjs_client)
    for projects_data in all_data:
        yield projects_data


def _paginate_projects(filter_str, creds=None):
    """Return projects based on the input filter.

    Args:
        filter_str: str, to filter the projects returned.

    Yields:
        Project, object.
    """
    prjs_client = gcp.projects_service(creds=creds)
    flds_client = gcp.folders_service(creds=creds)
    project = functools.partial(_project,
                                prjs_client=prjs_client,
                                flds_client=flds_client)

    all_projects_data = _paginate_projects_data(filter_str, prjs_client, creds)
    for page_data in all_projects_data:
        for prj_data in page_data:
            yield project(prj_data)


def get_all(creds=None):
    """Return all projects.

    Args:
        creds: obj, service_account.Credentials objects.

    Yields:
        Project, object.
    """
    filter_str = 'lifecycleState:ACTIVE'
    projects = _paginate_projects(filter_str, creds)
    for project in projects:
        yield project


def get_all_folder(folder_id, creds=None):
    """Return all projects under a folder.

    Args:
        folder_id: str, folder id.
        creds: obj, service_account.Credentials objects.

    Yields:
        Project, object.
    """
    filter_str = 'parent.type:folder parent.id:%s lifecycleState:ACTIVE'
    projects = _paginate_projects(filter_str % folder_id, creds)
    for project in projects:
        yield project


def get_filtered(filter_str, creds=None):
    """Return all projects based on the filter.

    Args:
        filter_str: str, filter str, for example: 'label.env:test'.
        creds: obj, service_account.Credentials objects.

    Yields:
        Project, object.
    """
    projects = _paginate_projects(filter_str, creds)
    for project in projects:
        yield project


def get_selective(project_ids, creds=None):
    """Return project information for given projects.

    Args:
        project_id: list of str, project ids.
        creds: obj, service_account.Credentials objects.

    Yields:
        Project, object.
    """
    for project_id in project_ids:
        yield get(project_id, creds)


def get(project_id, creds=None):
    """Return details about a specific project.

    Args:
        project_id: str, project id.
        creds: obj, service_account.Credentials objects.

    Returns:
        Project, object.
    """
    filter_str = 'projectId:%s lifecycleState:ACTIVE' % project_id
    projects = _paginate_projects(filter_str, creds)
    try:
        return next(projects)
    except StopIteration:
        return None
