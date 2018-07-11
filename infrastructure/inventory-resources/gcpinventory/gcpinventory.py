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
from netblocks import netblocks
from collections import defaultdict
from uuid import uuid1
import logging


class InventoryServiceException(Exception):
    """ Exception that is raised if there are any unhandled errors during the call to the GCP API
    """

    def __init__(self, message):
        self.message = message


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
        self.logger = logging.getLogger(__name__)
        self.errors = []

    def flush_errors(self):
        self.errors = []

    def _execute_(self, request):
        """
        Args:
            request: The Http request object

        Returns:
            A dict with the response
            If there is an HttpError, it will append the error to the errors attribute and return a empty dict

        Raises:
            InventoryServiceException: An exception occurred
        """
        try:
            response = request.execute()
            return response
        except HttpError as httpError:
            message = json.loads(httpError.content)
            self.errors.append(message)
            self.logger.error(message)
            raise InventoryServiceException(message)
        except Exception as ex:
            template = "An exception of type {0} occurred. Details:\n{1!r}"
            message = template.format(type(ex).__name__, ex)
            self.logger.error(message)
            raise InventoryServiceException(message)

    def list_zones(self, project):
        """List the zones for the given project

        Args:
            project: The project id

        Yields:
             The zones for this project

        Raises:
            InventoryServiceException: An exception occurred
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
                 InventoryServiceException: An  exception occurred
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
                InventoryServiceException: An exception occurred
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

    def list_routes(self, project):
        """List the routes for the given project and zone.

            Args:
                project: The project id

            Yields:
                 The routes for this project

            Raises:
                InventoryServiceException: An exception occurred
        """
        #https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html
        request = self.compute_service.routes().list(project=project, maxResults=self.max_results)
        while request is not None:
            response = self._execute_(request)
            if 'items' in response:
                for item in response['items']:
                    yield item
                request = self.compute_service.routes().list_next(previous_request=request,
                                                                  previous_response=response)
            else:
                return

    def create_route(self, project, name, priority, network, destination_range, next_hop_gateway):
        """Create the routes.

            Args:
                project: The project id
                name: The name of the route
                priority: The priority for the route (integer)
                network: The network for this route (FQDN)
                destination_range: The cidr that the route is applicable to
                next_hop_gateway: The next hop gateway(FQDN)

            Yields:
                 The response of the created route object

            Raises:
                InventoryServiceException: An exception occurred
        """
        # https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html

        body= {}

        body["name"] = name
        body["priority"] = priority
        body["network"] =  network
        body["destRange"] = destination_range
        body["nextHopGateway"] = next_hop_gateway
        request = self.compute_service.routes().insert(project=project, body=body)
        if request is not None:
            response = self._execute_(request)
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
        request = self.compute_service.routes().delete(project=project, route=route)
        if request is not None:
            response = self._execute_(request)
            return response

    def _default_add_callback(self,add_routes):
        self.logger.info("%d cidr blocks to add to routes" % len(add_routes))

    def _default_delete_callback(self,delete_routes):
        self.logger.info("%d cidr blocks to delete from routes" % len(delete_routes))

    def sync_gcp_service_routes(self, project, routes_prefix, priority, network, next_hop_gateway,
                                apply_changes=False,
                                add_callback=_default_add_callback,
                                delete_callback=_default_delete_callback ):
        """ Update the routes for the given project to access GCP services with Google API Access for Private IPs.
            Use this method to publish routes to Google netblocks.
            Use this when you have a default route to something more preferred (ie VPN or NAT GW).
            The method will add/delete the routes to match the cidr ranges listed under _spf.google.com
            as described at https://github.com/hm-distro/netblocks/tree/master/netblocks.

            This method can be called repeatedly and will continue from where it left off, in case of error.

            Args:
                project: The project id
                routes_prefix: The prefix to use for all the routes created
                priority: The priority of the route(integer)
                network: The network for this route (FQDN)
                next_hop_gateway: The next hop gateway(FQDN)
                apply_changes : Boolean whether  to apply the changes or not
                add_callback: the callback function to be called with the add_routes param. The default impl just logs the list
                delete_callback: The callback function to be called with the delete_routes param.The default impl just logs the list

            Raises:
                InventoryServiceException: An exception occurred
        """
        # Get the current netblocks from GCP
        latest_service_netblocks = set()
        api = netblocks.NetBlocks()
        all_cidr_blocks = api.fetch([netblocks.GOOGLE_INITIAL_SPF_NETBLOCK_DNS])
        self.logger.info("Total cidr %d" % len(all_cidr_blocks))
        for cidr in all_cidr_blocks:
            # Only interested in the ipv4 blocks
            if cidr.startswith("ip4"):
                latest_service_netblocks.add(cidr[4:])  # get the ip address after the prefix 'ip4:'

        self.logger.info("Total cidr(ipv4) %d" % len(latest_service_netblocks))

        # Handle to the inventory service
        inventory_service = InventoryService()

        all_project_routes = inventory_service.list_routes(project)

        current_routes_netblocks = set()

        # dict to map the cidr range to the route name,
        # in case there are two routes with the same destination cidr
        current_routes_maps = defaultdict(list)

        for route in all_project_routes:
            # Only interested in routes with the prefix
            if str(route['name']).startswith(routes_prefix):
                current_routes_netblocks.add(route['destRange'])
                # Do a reverse map from the destination cidr back to the route names.
                # This in case, there are more than one route with the same destination cidr
                current_routes_maps[route['destRange']].append(route['name'])

        # Check if any routes need to be added
        add_routes = latest_service_netblocks - current_routes_netblocks
        #self.logger.info("%d cidr blocks to add to routes" % len(add_routes))
        add_callback(self,add_routes)

        delete_routes = current_routes_netblocks - latest_service_netblocks
        #self.logger.info("%d cidr blocks to delete from routes" % len(delete_routes))
        delete_callback(self,delete_routes)

        if apply_changes:
            for route in add_routes:
                _route = inventory_service.create_route(project=project, name=routes_prefix + str(uuid1()), priority=priority,
                                                   network=network, destination_range=route,
                                                   next_hop_gateway=next_hop_gateway
                                                   )
                self.logger.info("Added: " + str(_route))
        else:
            self.logger.info("(Add)No changes applied as apply_changes:%s", apply_changes)

        if apply_changes:
            for route in delete_routes:
                # Just in case there are multiple routes names with the same destination cidr
                for route_name in current_routes_maps[route]:
                    self.logger.info("Deleted: " + str(route_name))
                    inventory_service.delete_route(project=project,route=route_name)
        else:
            self.logger.info("(Delete)No changes applied as apply_changes:%s", apply_changes)

    def errors(self):
        return self.errors
