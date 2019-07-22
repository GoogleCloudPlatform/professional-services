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

# noinspection PyPackageRequirements,PyPackageRequirements,PyPackageRequirements
from google.cloud import bigquery
import ConfigParser


# noinspection PyStatementEffect
def bigquery_label_updater(config_file, projectid, resourceid, tags):
    """
    Gets labels from BigQuery Dataset and appends new labels to it.

    :param config_file: e.g. update_labels.config
    :param projectid: Project Id e.g. cardinal-data-piper-sbx
    :param resourceid:
    :param tags: dictionary of labels key-value pairs combined for a particular resource type: tags: {
                       key: label_key,
                       value: labels_value
                    }
    e.g. ('tags: ', {u'org': u'data-engg'})
    :return: It returns updated dataset object.

    """
    parser = ConfigParser.SafeConfigParser()
    parser.read(config_file)
    key_file = parser.get('property', 'key_file')
    client = bigquery.Client.from_service_account_json(key_file)

    datasetid = projectid + '.' + resourceid
    datasetref = bigquery.dataset.DatasetReference.from_string(datasetid)

    dataset = client.get_dataset(datasetref)
    dataset.labels

    for key, value in tags.items():
        dataset.labels[key] = value

    dataset = client.update_dataset(dataset, ['labels'])

    return dataset


def bigquery_table_label_updater(config_file, projectid, resourceid, subresourceid, tags):
    parser = ConfigParser.SafeConfigParser()
    parser.read(config_file)
    key_file = parser.get('property', 'key_file')
    client = bigquery.Client.from_service_account_json(key_file)

    #datasetid = resourceid
    tableref = client.dataset(resourceid).table(subresourceid)
    table = client.get_table(tableref)

    #table.labels = labels

    for key, value in tags.items():
        table.labels[key] = value

    table = client.update_table(table, ["labels"])

    return table

