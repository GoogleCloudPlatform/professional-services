# Copyright 2019 Google LLC
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

from googleapiclient import discovery

from gcs_to_gke_configmaps import get_credentials
from gcs_to_gke_configmaps import logged
from gcs_to_gke_configmaps import cloud_logger


class GCSObject(object):

    @logged
    def __init__(self, bucket, filename):
        """Creates new GCSObject
        Args:
            bucket (str): The name of the bucket
            filename (str): The name of the file changed.
        """
        self.bucket = bucket
        self.filename = filename

        self._service = None
        self._content = None

    @property
    @logged
    def service(self):
        """The GCS storage service
        Returns:
            service (Resource): The storage service
        """
        if self._service is None:
            self._service = discovery.build(
                'storage',
                'v1',
                credentials=get_credentials(),
                cache_discovery=False)
        return self._service

    @logged
    def content(self, http=None):
        """Obtains the content of the file changed as a string
        Args:
            http: httplib2.Http, An instance of httplib2.Http or something
                that acts like it that HTTP requests will be made through.
                Optional.
        Returns:
            response (str): The content of the file
        """
        if self._content is None:
            request = self.service.objects().get_media(
                bucket=self.bucket,
                object=self.filename)
            self._content = request.execute(http=http)
        return self._content
