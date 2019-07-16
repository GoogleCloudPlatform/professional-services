# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from apiclient.discovery import build
from oauth2client.service_account import ServiceAccountCredentials
import httplib2
import ConfigParser
import logging
import os

logging.getLogger('googleapiclient.discovery_cache').setLevel(logging.ERROR)


def project_label_updater(config_file, projectid, tags):
    """
    Gets labels from Project Id and appends new labels to it.

    Raises:
    The exception if key file, crm_version not found in config file and credentials cannot be formed.

    :param config_file:
    :param projectid:
    :param tags: dictionary of labels key-value pairs combined for a particular resource type: tags: {
                       key: label_key,
                       value: labels_value
                    }
    e.g. ('tags: ', {u'org': u'data-engg', u'manager': u'martina', u'env': u'dev', u'size': u'8'})
    :return: It returns updated project object.

    """
    parser = ConfigParser.SafeConfigParser()
    parser.read(config_file)
    try:
        key_file = parser.get('property', 'key_file')
        crm_version = parser.get('property', 'crm_version')
    except ConfigParser.NoOptionError:
        logging.error("Please Provide Service Account Key File and Cloud Resource Manager Api Version")
        print "Please Provide Service Account Key File and Cloud Resource Manager Api Version"
        raise ValueError

    scope = ['https://www.googleapis.com/auth/cloud-platform',
             'https://www.googleapis.com/auth/spreadsheets',
             'https://www.googleapis.com/auth/drive']

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file

    try:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
    except Exception as inst:
        print str(inst)
        raise EnvironmentError

    http = httplib2.Http()
    credentials.authorize(http)

    crm = build('cloudresourcemanager', crm_version, http=http)
    project = crm.projects().get(projectId=projectid).execute()
    logging.info("Project is found")

    if 'labels' not in project:
        project['labels'] = dict()

    for key, value in tags.items():
        project['labels'][key] = value

    logging.info("Updating Project")

    project = crm.projects().update(
        projectId=projectid, body=project).execute()

    return project

