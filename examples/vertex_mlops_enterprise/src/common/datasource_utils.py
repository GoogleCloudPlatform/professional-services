# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Utilities for generating BigQuery data querying scirpts."""


from google.cloud import aiplatform as vertex_ai


def get_source_query(bq_dataset_name, bq_table_name, ml_use, limit=None):
    query = f"""
    SELECT *
    """
    
    if not ml_use:
        query += f"""
    EXCEPT (Time, ML_use, Class)
    FROM {bq_dataset_name}.{bq_table_name} 
    """
    else:
        query += f"""
    EXCEPT (Time, ML_use)
    FROM {bq_dataset_name}.{bq_table_name} 
    WHERE ML_use = '{ml_use}'
    """
        
    if limit:
        query += f"LIMIT {limit}"

    return query


def get_training_source_query(
    project, region, dataset_display_name, ml_use, limit=None
):
    vertex_ai.init(project=project, location=region)
    
    dataset = vertex_ai.TabularDataset.list(
        filter=f"display_name={dataset_display_name}", order_by="update_time"
    )[-1]
    bq_source_uri = dataset.gca_resource.metadata["inputConfig"]["bigquerySource"][
        "uri"
    ]
    _, bq_dataset_name, bq_table_name = bq_source_uri.replace("g://", "").split(".")

    return get_source_query(bq_dataset_name, bq_table_name, ml_use, limit)


def get_serving_source_query(bq_dataset_name, bq_table_name, limit=None):
    return get_source_query(bq_dataset_name, bq_table_name, ml_use=None, limit=limit)
