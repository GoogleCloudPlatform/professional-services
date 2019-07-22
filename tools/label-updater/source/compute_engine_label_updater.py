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
import httplib2
import os
import ConfigParser
import logging
from oauth2client.service_account import ServiceAccountCredentials


def gce_label_updater(config_file, projectid, resourceid, zone, tags):
    """
    Gets labels from Compute Engine VM instance and appends new labels to it.

    Raises:
    The exception if key file, crm_version not found in config file and credentials cannot be formed.
    It also raises exception if get instance label and set instance label call fail.

    :param config_file:
    :param projectid: Project Id e.g. cardinal-data-piper-sbx
    :param resourceid: Compute engine instance id e.g. data-piper-1
    :param zone: Zone of compute engine e.g. us-west2-a
    :param tags: dictionary of labels key-value pairs combined for a particular resource type: tags: {
                       key: label_key,
                       value: labels_value
                    }
    e.g. ('tags: ', {u'org': u'data-engg'})
    :return: It returns updated VM instance object.

    """

    # TODO : access_setup.access_set_up(config_file)

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
    try:
        crm_compute = build('compute', crm_version, http=http)
        instance = crm_compute.instances().get(project=projectid, instance=resourceid, zone=zone).execute()
    except Exception as inst:
        logging.error(inst)
        raise LookupError

    if 'labels' not in instance:
        instance['labels'] = dict()

    for key, value in tags.items():
        instance['labels'][key] = value

    logging.info("Instance before update", instance)
    # instance.update()
    try:
        crm_compute.instances().setLabels(
            project=projectid, instance=resourceid, body=instance, zone=zone).execute()
        logging.info("Compute engine updated successfully")
    except Exception as inst:
        logging.error(inst)
        raise IOError
    return instance
