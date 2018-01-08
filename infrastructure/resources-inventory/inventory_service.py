# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from googleapiclient import discovery
from googleapiclient.http import HttpError
import json
import logging

logger = logging.getLogger()
logging.basicConfig()
logger.setLevel(logging.ERROR)


class InventoryServiceException(Exception):
    """ Exception that is raised if there are any unhandled errors during the call to the GCP API
    """
    pass


class InventoryService:
    """Inventory Service that is the entry point to fetching the GCP resources
    This class is work in progress and more methods to access the resources will be added

    Attributes:
        errors: The list of errors encountered during the processsing
        compute_version_id: The compute api version to use. Defaults to v1
        resource_version_id: The cloud resource manager version to use. Defaults to v1
        max_results: The max number of results to fetch in each call to the API. Defaults to 500
        logger: logger handler

    """

    def __init__(self, compute_version_id='v1', resource_version_id='v1', max_results=500):
        """ Initialize the class for the api versions etc.. 

        Args:
            compute_version_id: The compute api version to use. Defaults to v1
            resource_version_id: The cloud resource manager version to use. Defaults to v1
            max_results: The max number of results to fetch in each call to the API. Defaults to 500
        """
        self.compute_service = discovery.build('compute', compute_version_id)
        self.resource_service = discovery.build('cloudresourcemanager', resource_version_id)
        self.max_results = max_results
        self.errors = []
        self.logger = logging.getLogger(__name__)

    def _execute_(self, request):
        """ 

        Args:
            request: The Http request object

        Returns: 
            A dict with the response
            If there is an HttpError, it will append the error to the errors attribute and return a empty dict

        Raises:
            InventoryServiceException: A unhandled (non HttpError) exception occurred
        """
        try:
            response = request.execute()
            return response
        except HttpError as httpError:
            self.errors.append(json.loads(httpError.content))
            return {}  # Empty dict
        except Exception as ex:
            template = "An exception of type {0} occurred. Details:\n{1!r}"
            message = template.format(type(ex).__name__, ex)
            logger.error(message)
            raise InventoryServiceException(message)

    def list_zones(self, project):
        """List the zones for the given project

        Args:
            project: The project id

        Yields:
             The zones for this project

        Raises:
            InventoryServiceException: A unhandled (non HttpError) exception occurred
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.zones.html#list
        request = self.compute_service.zones().list(project=project, maxResults=self.max_results)
        while request is not None:
            response = self._execute_(request)
            if 'items' in response:
                for item in response['items']:
                    yield item
                request = self.compute_service.zones().list_next(previous_request=request, previous_response=response)
            else:
                return

    def list_projects(self):
        """List the projects that the user has access to.

             Yields:
                  The zones for this project

             Raises:
                 InventoryServiceException: A unhandled (non HttpError) exception occurred
        """
        # https://developers.google.com/resources/api-libraries/documentation/cloudresourcemanager/v1/python/latest/cloudresourcemanager_v1.projects.html#list
        request = self.resource_service.projects().list(pageSize=self.max_results)
        while request is not None:
            response = self._execute_(request)
            if 'projects' in response:
                for item in response['projects']:
                    yield item
                request = self.resource_service.projects(). \
                    list_next(previous_request=request, previous_response=response)
            else:
                return

    def list_disks(self, project, zone):
        """List the disks for the given project and zone.

            Args:
                project: The project id
                zone: The zone id

            Yields:
                 The disks for this project

            Raises:
                InventoryServiceException: A unhandled (non HttpError) exception occurred
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.disks.html#list
        request = self.compute_service.disks().list(project=project, zone=zone, maxResults=self.max_results)
        while request is not None:
            response = self._execute_(request)
            if 'items' in response:
                for item in response['items']:
                    yield item
                request = self.compute_service.disks().list_next(previous_request=request, previous_response=response)
            else:
                return

    def errors(self):
        return self.errors