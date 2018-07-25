# Copyright 2017 Google Inc. All Rights Reserved.
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
import logging
import backoff
from googleapiclient import discovery
from googleapiclient.errors import HttpError
from ratelimit import limits, RateLimitException
from exception_logging import exception

logger = logging.getLogger(__name__)

ONE_MINUTE=60

class CloudMonitoring:
    def __init__(self, versionId='v3', credentials=None):
        self.service = discovery.build("monitoring", versionId, credentials=credentials,
        cache_discovery=False) # 'cache_discovery = False' to silence ImportError
        # https://github.com/google/google-api-python-client/issues/299

    def get_metric_descriptor(self, project, type):
        name = "projects/{}/metricDescriptors/{}".format(project, type)
        request = self.service.projects().metricDescriptors().get(name=name)
        response = request.execute()
        return response

    def create_metric_descriptor(self, project, metric_descriptor):
        name = "projects/{}".format(project)
        request = self.service.projects().metricDescriptors().create(name=name, body=metric_descriptor)
        response = request.execute()
        return response

    def delete_metric_descriptor(self, project, type):
        name = "projects/{}/metricDescriptors/{}".format(project, type)
        request = self.service.projects().metricDescriptors().delete(name=name)
        response = request.execute()
        return response

    def fatal_code(err):
        return err.resp.status != 429 and err.resp.status / 100 != 5

    @backoff.on_exception(backoff.expo,
                            HttpError,
                            giveup=fatal_code)
    @backoff.on_exception(backoff.expo,
                            RateLimitException,
                            max_tries=3)
    @limits(calls=6000, period=ONE_MINUTE)
    def create_time_series(self, project, time_series):
        name = "projects/{}".format(project)
        request = self.service.projects().timeSeries().create(name=name, body=time_series)
        response = request.execute()
        return response

    # def list_metric_descriptors(self, project, fields=None):
    #     name = "projects/{}".format(project)
    #     request = self.service.projects().metricDescriptors().list(name=name, fields=fields)
    #     response = request.execute()
    #     return response


class ServiceManagement:
    def __init__(self, versionId='v1', credentials=None):
        self.service = discovery.build('servicemanagement', versionId, credentials=credentials)

    def list_project_services(self, projectId, fields=None):
        request = self.service.services().list(consumerId='project:{}'.format(projectId), fields=fields)
        while request is not None:
            response = request.execute()
            if 'services' in response:
                for item in response['services']:
                    yield item
            request = self.service.services().list_next(previous_request=request, previous_response=response)

    def is_service_enabled(self, projectId, serviceName):
        enabled = False

        try:
            for s in self.list_project_services(projectId, fields='services/serviceName'):
                if s['serviceName'] == serviceName:
                    enabled = True
                    break
        except HttpError as err:
            logger.warning(err)

        return enabled

class Compute:
    def __init__(self, versionId='v1', credentials=None):
        self.service = discovery.build('compute', versionId, credentials=credentials,
        cache_discovery=False) # 'cache_discovery = False' to silence ImportError
        # https://github.com/google/google-api-python-client/issues/299)

    def get_project(self, project, fields=None):
        request = self.service.projects().get(project=project, fields=fields)
        response = request.execute()
        return response;

    def list_project_regions(self, project, fields=None):
        request = self.service.regions().list(project=project, fields=fields)
        while request is not None:
            response = request.execute()
            for item in response['items']:
                yield item
            request = self.service.regions().list_next(previous_request=request, previous_response=response)

    @exception(logger)
    def list_project_zones(self, project, fields=None):
        """List the zones for the given project

        Args:
            project: The project id
            fields: (optional) An expression to filter the fields returned. Default is None.

        Yields:
             The zones for this project
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.zones.html#list
        request = self.service.zones().list(project=project, fields=fields)
        while request is not None:
            response = request.execute()
            for item in response['items']:
                yield item
            request = self.service.zones().list_next(previous_request=request, previous_response=response)


    def list_instances(self, project, zones=None, fields=None):
        if zones is None:
            zones = self.list_project_zones(project=project)
        for zone in zones:
            request = self.service.instances().list(project=project, zone=zone['description'], fields=fields)
            while request is not None:
                response = request.execute()
                if 'items' in response:
                    for item in response['items']:
                        yield item
                request = self.service.instances().list_next(previous_request=request, previous_response=response)

    @exception(logger)
    def list_disks(self, projects, zones=None, fields=None):
        """List the disks for the given project and zone.

            Args:
                project: The project id
                zones: (optional) The zone to query.  Default of None enumerates all project zones.
                fields: (optional) An expression to filter the fields returned. Default is None.

            Yields:
                 The disks for this project
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.disks.html#list

        if zones is None:
            zones = self.list_project_zones(project=project)
        for zone in zones:
            request = self.service.disks().list(project=project, zone=zone['description'], fields=fields)
            while request is not None:
                response = request.execute()
                if 'items' in response:
                    for item in response['items']:
                        yield item
                request = self.service.disks().list_next(previous_request=request, previous_response=response)

    @exception(logger)
    def list_routes(self, project):
        """List the routes for the given project and zone.

            Args:
                project: The project id

            Yields:
                 The routes for this project
        """
        #https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html
        request = self.service.routes().list(project=project)
        while request is not None:
            response = request.execute()
            if 'items' in response:
                for item in response['items']:
                    yield item
                request = self.service.routes().list_next(previous_request=request,
                                                                  previous_response=response)
            else:
                return

    @exception(logger)
    def insert_default_internet_gateway_route(self, project, name, priority, network, destination_range, tags=None):
        """Create the routes.

            Args:
                project: The project id
                name: The name of the route
                priority: The priority for the route (integer)
                network: name of network for this route
                destination_range: The cidr that the route is applicable to
                tags: (optional) list of instance tags to which this route applies to.  Default is None

            Yields:
                 The response of the created route object
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html

        body= {}

        body["name"] = name
        body["priority"] = priority
        body["network"] =  "projects/{}/global/networks/{}".format(project, network)
        body["destRange"] = destination_range
        body["nextHopGateway"] = "projects/{}/global/gateways/default-internet-gateway".format(project)
        request = self.service.routes().insert(project=project, body=body)
        if request is not None:
            response = request.execute()
            return response

    def delete_route(self, project, route):
        """Delete the routes.

            Args:
                project: The project id
                route: The route name to delete
            Raises:
                InventoryServiceException: An exception occurred
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html
        request = self.service.routes().delete(project=project, route=route)
        if request is not None:
            response = request.execute()
            return response


class CloudResourceManager:
    def __init__(self, versionId='v1', credentials=None):
        self.service = discovery.build("cloudresourcemanager", versionId, credentials=credentials)

    @exception(logger)
    def list_projects(self, filter=None, fields=None):
        """List the projects that the user has access to.

            Args:
                filter: (optional) An expression for filtering the set projects. Default is None.
                fields: (optional) An expression to filter the fields returned. Default is None.

             Yields:
                  The zones for this project
        """
        # https://developers.google.com/resources/api-libraries/documentation/cloudresourcemanager/v1/python/latest/cloudresourcemanager_v1.projects.html#list

        request = self.service.projects().list(filter=filter, fields=fields)
        while request is not None:
            response = request.execute()
            for item in response['projects']:
                yield item
            request = self.service.projects().list_next(previous_request=request, previous_response=response)

    def search_organizations(self, filter=None, fields=None):
        body = {'filter':filter}
        request = self.service.organizations().search(body=body, fields=fields)
        while request is not None:
            response = request.execute()
            for item in response['organizations']:
                yield item
            request = self.service.organizations().search_next(previous_request=request, previous_response=response)

class CloudLogging:
    def __init__(self, versionId='v2', credentials=None):
        self.service = discovery.build("logging", versionId, credentials=credentials)

    def write_entries(self, entries):
        request = self.service.entries().write(body=entries)
        response = request.execute()

    # def create_metric(self, projectId=projectId, logMetric=logMetric):
    #     request = self.service.projects().metrics().create(projectId=projectId, body=logMetric)
    #     response = request.execute()



class BigQuery:
    def __init__(self, versionId='v2', projectId=None, credentials=None):
        self.service = discovery.build("bigquery", versionId, credentials=credentials)
        self.projectId=projectId

    def __check_projectId(self, projectId):
        if projectId is not None:
            return projectId
        if self.projectId is None:
            raise ValueError("projectId not defined")
        return self.projectId

    def insert_job(self, job_resource, projectId=None):
        projectId = self.__check_projectId(projectId)
        request = self.service.jobs().insert(projectId=projectId, body=job_resource)
        response = request.execute()
        return response

    def insert_query(self, query, projectId=None, query_configuration=None):
        job_resource =  {
                          "configuration": {
                            "query": {
                              "query": query
                            }
                          }
                        }
        if query_configuration is not None:
            job_resource['configuration']['query'].update(query_configuration)

        return self.insert_job(job_resource, projectId)

    def query(self, query, projectId=None, queryRequest=None):
        projectId = self.__check_projectId(projectId)
        body = {
                  "kind": "bigquery#queryRequest",
                  "query": query
              }
        if queryRequest is not None:
            body.update(queryRequest)
        request = self.service.jobs().query(projectId=projectId, body=body)
        response = request.execute()
        return response

    def get_job(self, jobId, projectId=None):
        projectId = self.__check_projectId(projectId)
        request = self.service.jobs().get(projectId=projectId, jobId=jobId)
        response = request.execute()
        return response

    def get_job_state(self, jobId, projectId=None):
        return self.get_job(jobId, projectId)['status']['state']

    def get_query_results(self, jobId, projectId=None):
        projectId = self.__check_projectId(projectId)
        request = self.service.jobs().getQueryResults(projectId=projectId, jobId=jobId)
        response = request.execute()
        return response
