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
"""Handle project related endpoint requests."""

import logging
import itertools

from src.common.lib import projects_lib
from src.common.lib import pubsub_lib

from src.common.utils import common_utils
from src.common.utils import config_utils

_ALL = 'ALL'
_FILTER = 'FILTERS'
_FOLDER = 'FOLDERS'
_PROJECT = 'PROJECTS'


def _publish_project_details(project, config, batch_id, published_projects):
    """Publish project data to pubsub topic.

    Args:
        project: obj, projects_lib._Project object.
        config: obj, config_utils._Config object.
        batch_id: random number.
        published_projects: set, to keep track of processed projects.

    Returns:
      bool, true if published.
    """
    if not project:
        logging.debug('Projects: No project details found - %s', project)
        return False
    if project.id in published_projects:
        logging.debug('Projects: Project already published - %s', project)
        return False

    logging.info('Projects: Trying to publish %s', project)
    message = pubsub_lib.build_message(project.to_dict(), batch_id=batch_id)
    host_project_id = config.value('project')
    topic = config.value('export.pubsub.metrics_topic')
    res = pubsub_lib.publish_message(host_project_id, topic, message)
    logging.info('Projects: Publish results %s to topic %s', res, topic)

    topic = config.value('export.pubsub.thresholds_topic')
    res = pubsub_lib.publish_message(host_project_id, topic, message)
    logging.info('Projects: Publish results %s to topic %s', res, topic)

    published_projects.add(project.id)
    return True


def publish(config_filepath):
    """List projects and publish the data for each project to pubsub topic.

    Args:
        config_filepath: str, path for config file.
    """
    logging.info('Projects: Listing and publishing projects')
    config = config_utils.config(config_filepath)
    batch_id = common_utils.get_unique_id()
    timestamp = common_utils.zulu_timestamp()
    published_projects = set()

    resources = config.value('export.resources', default=tuple())
    for resource in resources:
        projects = _get_resource_projects(resource)
        for project in projects:
            project.timestamp = timestamp
            _publish_project_details(project, config, batch_id,
                                     published_projects)


def _get_resource_projects(resource):
    """Return projects for the resource defined in config."""
    resource_type = resource.get('type', '').upper()
    resource_values = resource.get('include', tuple())

    projects = tuple()
    if resource_type == _FOLDER:
        projects = _get_folder_projects(resource_values)
    elif resource_type == _PROJECT:
        projects = _get_projects(resource_values)
    elif resource_type == _FILTER:
        projects = _get_filtered_projects(resource_values)
    else:
        logging.info('Projects: No projects for resource %s', resource_type)
    return projects


def _get_filtered_projects(filters):
    """Return projects for 'filters' type resource."""
    projects_itr = (projects_lib.get_filtered(f) for f in filters)
    return itertools.chain.from_iterable(projects_itr)


def _get_folder_projects(folder_ids):
    """Return projects for 'folders' type resource."""
    projects_itr = (projects_lib.get_all_folder(fid) for fid in folder_ids)
    return itertools.chain.from_iterable(projects_itr)


def _get_projects(project_ids):
    """Return projects for 'projects' type resource."""
    if _ALL in project_ids:
        return projects_lib.get_all()
    return projects_lib.get_selective(project_ids)
