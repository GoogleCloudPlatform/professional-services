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
import services

logger = logging.getLogger(__name__)

def _default_add_callback(add_routes):
    logger.info("%d cidr blocks to add to routes" % len(add_routes))

def _default_delete_callback(delete_routes):
    logger.info("%d cidr blocks to delete from routes" % len(delete_routes))

def sync_gcp_service_routes(project, routes_prefix, priority, network,
                            apply_changes=False,
                            add_callback=_default_add_callback,
                            delete_callback=_default_delete_callback,
                            tags=None,
                            credentials=None ):
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
            network: The network for this route
            apply_changes : Boolean whether  to apply the changes or not
            add_callback: the callback function to be called with the add_routes param. The default impl just logs the list
            delete_callback: The callback function to be called with the delete_routes param.The default impl just logs the list
            tags: (optional) list of instance tags to which this route applies to.  Default is None
            credentials: (optional) credentials to make API calls with. Default is None.

    """
    add_callback([])
    # Get the current netblocks from GCP
    latest_service_netblocks = set()
    api = netblocks.NetBlocks()
    all_cidr_blocks = api.fetch([netblocks.GOOGLE_INITIAL_SPF_NETBLOCK_DNS])
    logger.info("Total cidr %d" % len(all_cidr_blocks))
    for cidr in all_cidr_blocks:
        # Only interested in the ipv4 blocks
        if cidr.startswith("ip4"):
            latest_service_netblocks.add(cidr[4:])  # get the ip address after the prefix 'ip4:'

    logger.info("Total cidr(ipv4) %d" % len(latest_service_netblocks))

    # Handle to the compute service
    compute_service = services.Compute(credentials=credentials)
    all_project_routes = compute_service.list_project_routes(project)

    current_routes_netblocks = set()

    # dict to map the cidr range to the route name,
    # in case there are two routes with the same destination cidr
    current_routes_maps = defaultdict(list)

    logger.info("routes prefix " + routes_prefix)
    for route in all_project_routes:
        # Only interested in routes with the prefix
        if str(route['name']).startswith(routes_prefix):
            current_routes_netblocks.add(route['destRange'])
            # Do a reverse map from the destination cidr back to the route names.
            # This in case, there are more than one route with the same destination cidr
            current_routes_maps[route['destRange']].append(route['name'])


    # Check if any routes need to be added
    add_routes = latest_service_netblocks - current_routes_netblocks
    logger.info("current routes %d" % len(current_routes_netblocks))
    logger.info("add routes %d" % len(add_routes))

    #logger.info("%d cidr blocks to add to routes" % len(add_routes))
    add_callback([])

    add_callback(add_routes)

    delete_routes = current_routes_netblocks - latest_service_netblocks
    #logger.info("%d cidr blocks to delete from routes" % len(delete_routes))
    delete_callback(delete_routes)

    if apply_changes:
        for route in add_routes:
            _route = compute_service.insert_project_default_internet_gateway_route(project=project, name=routes_prefix + str(uuid1()), priority=priority,
                                               network=network, destination_range=route)
            logger.info("Added: " + str(_route))
    else:
        logger.info("(Add)No changes applied as apply_changes:%s", apply_changes)

    if apply_changes:
        for route in delete_routes:
            # Just in case there are multiple routes names with the same destination cidr
            for route_name in current_routes_maps[route]:
                logger.info("Deleted: " + str(route_name))
                compute_service.delete_project_route(project=project,route=route_name)
    else:
        logger.info("(Delete)No changes applied as apply_changes:%s", apply_changes)
