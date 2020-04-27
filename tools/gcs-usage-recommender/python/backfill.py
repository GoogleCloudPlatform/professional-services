# Copyright 2019 Google Inc.
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

import datetime
import json
import sys
import logging
from typing import Dict, List
from google.api_core.exceptions import Forbidden, BadRequest
from google.cloud import resource_manager
from google.cloud import storage


def get_resource_manager_client() -> resource_manager.Client:
    """Retrieves Resource Manager Cleint

    Returns:
        resource_manager.Client object
    """
    return resource_manager.Client()


def get_project_ids(resource_mgr_client: resource_manager.Client,
                    organization_id: int) -> List[str]:
    """Generates list of project_ids within a GCP org.

    Args:
        resource_mgr_client: resource_manager.Client
        organization_id: Integer representing GCP org ID

    Returns:
        List of strings holding all project IDs.
    """
    project_filter = {
        'parent.id': organization_id,
        'parent.type': 'organization'
    }
    return [p.project_id for p in
            resource_mgr_client.list_projects(project_filter)]


def get_buckets(project_ids: List[str],
                gcs_client: storage.Client) -> List[Dict[str, str]]:
    """Retrieves list of metadata for all buckets in a GCP org.

    Args:
        project_ids: List of strings holding project IDs
        gcs_client: storage.Client object

    Returns:
        List of dictionaries mapping bucket-level metadata.
    """
    output_list = []
    try:
        for project_id in project_ids:
            try:
                bucket_list = list(gcs_client.list_buckets(project=project_id))
                for bucket in bucket_list:
                    output_list.append({
                        "bucket_name": bucket.name,
                        "project_id": project_id,
                        "last_read_timestamp": "",
                        "days_since_last_read": -1,
                        "read_count_30_days": -1,
                        "read_count_90_days": -1,
                        "export_day": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
                        "recommended_OLM": ""
                    })
            except Forbidden as err:
                logging.error(f"""Access denied on bucket {bucket.name}.
                              {err}""")

            except BadRequest as err:
                logging.error(f"Could not find bucket {bucket.name}.")
                logging.error(err)
                pass
        return output_list

    except Exception as err:
        logging.error(f"""Could not access buckets in {project_id}.
                      {err}""")


def write_json_to_local(data: List[Dict[str, str]]) -> None:
    """Takes JSON and converts to Newline-deliminted JSON file.

    Args:
        data: List of dictionary objects holding info about buckets.

    Returns:
         None; Creates local output file.
    """
    with open('initial_gcs_inventory.json', 'w') as out_file:
        for row in data:
            json.dump(row, out_file)
            out_file.write('\n')


def main():
    """Main method used to invoke script."""
    try:
        organization_id = sys.argv[1]
        gcs_client = storage.Client()
        resource_mgr_client = get_resource_manager_client()
        project_id_list = get_project_ids(resource_mgr_client, organization_id)
        bucket_list = get_buckets(project_id_list, gcs_client)
        write_json_to_local(bucket_list)

    except Exception as err:
        logging.error(err)

if __name__ == "__main__":
    main()
