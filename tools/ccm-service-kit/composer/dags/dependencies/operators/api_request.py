# Copyright 2022 Google LLC All Rights Reserved.
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

from airflow.providers.google.cloud.hooks.gcs import GCSHook
from airflow.models import BaseOperator
from typing import Dict, Any, Optional
import requests

class LoadFileFromAPI(BaseOperator):

    """
    This custom operator will get the data from an API requests
    and load the file into a GCS bucket.
    It will use Airflow's GCSHook rather than the client
    library directly.

    Args:
        bucket_name (str): The name of the bucket to
            load the data.
        prefix (Optional[str]): The prefix for files. Optional, defaults
            to None.
        proxy(str): The proxy to reach public internet. Optional, defaults to None
        token(str): The token for the API. Optional, defaults to None
        url(str): the url for the API. 
        file_name(str): name of the file
        mime_type: type of file
        gcp_conn_id (str): The connection ID to use for
            interacting with GCS. Like we mentioned above,
            the connection contains the credentails
            that will be used. The default connection
            ID is usually 'google_cloud_default'.
    
    Resources:
        * GCSHook documentation: https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_api/airflow/providers/google/cloud/hooks/gcs/index.html?highlight=gcshook#airflow.providers.google.cloud.hooks.gcs.GCSHook
    """

    def __init__(
        self,
        *,
        url: str,
        file_name: str,
        mime_type: str,
        bucket_name: str,
        prefix: Optional[str] = None,
        proxy: Optional[str] = None,
        token: Optional[str] = None,
        gcp_conn_id: str = 'google_cloud_default',
        **kwargs
    ) -> None:

        super().__init__(**kwargs)

        self.bucket_name: str = bucket_name
        self.prefix: Optional[str] = prefix
        self.proxy: Optional[str]= proxy
        self.token: Optional[str] = token
        self.url: str = url
        self.file_name: str = file_name
        self.mime_type: str = mime_type
        self.gcp_conn_id: str = gcp_conn_id
        
    
    def execute(self, context: Dict[str, Any]) -> None:

        head = {'Authorization': 'token {}'.format(self.token)}
 
        file_from_api = requests.get(
            url = self.url,
            proxies = self.proxy,
            headers = head
        )
        data = file_from_api.content

        file_from_api.raise_for_status()
        self.log.info(f'Response HTTP status code {file_from_api.status_code} ')

        # We instantiate the GCSHook using the connection ID
        # The hook will handle Authentication with GCP
        gcs_hook: GCSHook = GCSHook(gcp_conn_id=self.gcp_conn_id)   

        gcs_hook.upload(
            bucket_name= self.bucket_name,
            object_name= self.file_name,
            mime_type=  self.mime_type,
            data= data
        )

