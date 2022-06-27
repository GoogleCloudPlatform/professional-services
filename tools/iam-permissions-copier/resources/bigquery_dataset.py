#    Copyright 2022 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

from .base import Resource
from google.cloud import bigquery

BQ_ROLE_MAP = {
    "READER": "roles/bigquery.dataViewer",
    "WRITER": "roles/bigquery.dataEditor",
    "OWNER": "roles/bigquery.dataOwner",
}


class BqDataset(Resource):
    ASSET_TYPE = "bigquery.googleapis.com/Dataset"
    RESOURCE_ID_PATTERN = (
        "\/\/bigquery.googleapis.com\/projects\/(.*)\/datasets\/(.*)"
    )
    _internal_client = bigquery.Client()

    @staticmethod
    def _client():
        return BqDataset._internal_client

    def _build_resource_path(self):
        (project_id, dataset_name) = self._parsed_resource_id()
        return (project_id, dataset_name)

    def _get_current_policy(self, resource):
        (project_id, dataset_name) = resource

        dataset_id = "{project_id}.{dataset_name}".format(
            project_id=project_id, dataset_name=dataset_name
        )

        return self._client().get_dataset(dataset_id)

    def _get_updated_policy(self, resource):
        dataset = self._get_current_policy(resource)

        entry = bigquery.AccessEntry(
            role=self._role,
            entity_type="userByEmail",
            entity_id=self._new_member.replace("user:", ""),
        )

        entries = list(dataset.access_entries)
        entries.append(entry)
        dataset.access_entries = entries

        return dataset

    def _process_updated_iam_policy(self, resource_path, dataset):
        return self._client().update_dataset(dataset, ["access_entries"])

    def _get_role_bindings(self):
        dataset = self._updated_policy_snapshot.access_entries
        return list(
            map(
                lambda a: {
                    "role": BQ_ROLE_MAP[a.role],
                    "members": ["user:{id}".format(id=a.entity_id).lower()],
                },
                list(filter(lambda b: b.entity_type == "userByEmail", dataset)),
            )
        )

    def delete_test_instance(self):
        (project_id, dataset_name) = self._build_resource_path()
        self._client().delete_dataset(
            "{project}.{name}".format(project=project_id, name=dataset_name)
        )

    @classmethod
    def make_test_instance(cls):
        name = cls.get_test_instance_name().replace("-", "_")

        dataset_id = "{project}.{name}".format(
            project=cls.TEST_PROJECT_ID, name=name
        )
        dataset = bigquery.Dataset(dataset_id)
        cls._internal_client.create_dataset(dataset)

        return cls.get_test_instance(
            "//bigquery.googleapis.com/projects/{project}/datasets/{dataset}".format(
                project=BqDataset.TEST_PROJECT_ID,
                dataset=name,
            ),
            BQ_ROLE_MAP["READER"],
        )