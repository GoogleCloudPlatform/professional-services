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
from google.cloud import storage


def storage_label_updater(resourceid, tags):
    """
    Gets labels from Storage bucket and appends new labels to it.

    :param resourceid: Bucket name e.g. data-piper-1
    :param tags: dictionary of labels key-value pairs combined for a particular resource type: tags: {
                       key: label_key,
                       value: labels_value
                    }
    e.g. ('tags: ', {u'org': u'data-engg'})
    :return: It returns updated bucket object.

    """
    storage_client = storage.Client()
    bucket_name = resourceid
    bucket = storage_client.get_bucket(bucket_name)

    labels = bucket.labels
    for key, value in tags.items():
        labels[key] = value

    bucket.labels = labels

    bucket.patch()
    return bucket
