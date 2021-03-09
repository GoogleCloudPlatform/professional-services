#!/usr/bin/env python
# Copyright 2021 Google Inc.
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
# limitations under the License..
"""
This file is used to create instance from a machine image.
"""

import logging
import googleapiclient.discovery


def get_cloudresourcemanager():
    crm = googleapiclient.discovery.build('cloudresourcemanager', 'v1',
                                          cache_discovery=False)
    logging.getLogger('googleapiclient.discovery_cache').setLevel(
        logging.ERROR)
    return crm


def get_number(project_id):
    project = get_cloudresourcemanager().projects().get(projectId=project_id) \
                                                                     .execute()
    return project['projectNumber'] if 'projectNumber' in project else None
