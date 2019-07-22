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

# noinspection PyPackageRequirements
from google.cloud import bigtable


def bigtable_label_updater(projectid, resourceid, tags):
    """
    Gets labels from BigTable instance and appends new labels to it.

    :param projectid: Project Id e.g. cardinal-data-piper-sbx
    :param resourceid: BigTable instance e.g. data-piper1
    :param tags: dictionary of labels key-value pairs combined for a particular resource type: tags: {
                       key: label_key,
                       value: labels_value
                    }
    e.g. ('tags: ', {u'org': u'data-engg'})
    :return: It returns updated Bigtable instance object.

    """
    client = bigtable.client.Client(project=projectid, admin=True)
    instances = client.list_instances()

    instance = None
    # scan for the instance with resourceid
    for x in instances:
        if x is not None:
            for y in x:
                if y is not None and y.instance_id == resourceid:
                    instance = y
                    break
    # if instance was not found in the list above
    if instance is None:
        instance = client.instance(resourceid)

    # create or get labels dict to be updated with tags
    if instance.labels is None:
        labels = dict()
    else:
        labels = instance.labels

    # update labels with tags
    for key, value in tags.items():
        labels[key] = value

    # assign the labels back to instance
    instance.labels = labels

    # make update
    instance.update()
    return instance
