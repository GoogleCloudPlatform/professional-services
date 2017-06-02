#!/usr/bin/env python
# Copyright 2017 Google Inc.
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

"""
    labelmaker.py is a tool that reads key:value pairs from a json file, and
    labels the running instance and all attached drives accordingly. It
    is designed to run on boot in a startup-script or userdata.
"""

from __future__ import print_function

import sys
import json
from operator import itemgetter
import requests
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials


def label(self_link, access_token, data):
    """ Format and make label request

        Args:
            self_link -- Resource uri
            access_token -- auth token set in header
            data -- label data as dict
        Returns:
           Http status code of request
    """
    headers = {
        "Authorization": "Bearer %s" % access_token,
        "Content-Type":  "application/json"
    }
    try:
        req = requests.post("%s/setLabels" % self_link, headers=headers,
            data=json.dumps(data))
        req.raise_for_status()
    except requests.exceptions.HTTPError as err:
        print(err, file=sys.stderr)
    if req.status_code == requests.codes.ok:
        print("Labels set on %s" % ':'.join(self_link.split('/')[-2:]))
    return req.status_code

def get_metadata():
    """ Read metadata from local instance

        Args:
            None
        Returns:
            Dict of instance metadata
    """

    metadata_server = "http://metadata/computeMetadata/v1/instance"
    headers = {"Metadata-Flavor": "Google"}
    return json.loads(requests.get("%s/?recursive=true" % metadata_server,\
         headers=headers).text)

def label_merge(current, fingerprint, new):
    """ Merge label dicts, and apply fingerprint

        Args:
            current -- current label object
            fingerprint -- fringerprint of current label object
            new -- request labels
        Returns:
            Merged Dict of labels
    """
    labels = current.copy()
    labels.update(new)
    return {"labels": labels, "labelFingerprint": fingerprint}

def main(argv):
    # Load label file
    try:
        new_lables = json.load(open(argv[1]))
    except IndexError:
        print("%s <lables.json> required!" %  __file__, file=sys.stderr)
        sys.exit(1)
    except ValueError as err:
        print("%s invalid json: %s" % (sys.argv[1], err), file=sys.stderr)
        sys.exit(1)


    # Pull defaults from metadata
    metadata = get_metadata()
    project, zone = itemgetter(1, 3)(metadata['zone'].split("/"))
    instance_name = metadata['name']

    # Google Creds
    creds = GoogleCredentials.get_application_default()

    # Describe Instance
    conn = discovery.build('compute', 'beta', credentials=creds)
    instance = conn.instances().get(project=project, zone=zone,
                                    instance=instance_name).execute()

    # Label Instance
    label(instance['selfLink'], creds.get_access_token().access_token,
          label_merge(instance['labels'] if 'labels' in instance else {},
                      instance["labelFingerprint"], new_lables))

    # Label Disks
    for i in instance['disks']:
        # Skip local disk
        if 'source' not in i:
            continue
        disk = conn.disks().get(project=project, zone=zone,
                                disk=i['source'].split('/')[-1]).execute()

        label(disk['selfLink'], creds.get_access_token().access_token,
              label_merge(disk['labels'] if 'labels' in disk else {},
                          disk["labelFingerprint"], new_lables))

if __name__ == '__main__':
    main(sys.argv)
