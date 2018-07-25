# Resources GCP Toolbox

**This is not an official Google product.**


This is a package that can provide inventory of resources in GCP
In addition to accessing projects,zones and disks it also provides a method to keep routes in sync with the GCP services netblocks.

See the method sync_gcp_service_routes(...) for more details.  
sync_gcp_service_routes(...) can be executed at any frequency.This method can be called repeatedly and will continue from where it left off, in case of error.  
See the bottom of the page for an example


The package can be installed by `pip install gcptoolbox'

  def sync_gcp_service_routes(project, routes_prefix, priority, network,
                            apply_changes=False,
                            add_callback=_default_add_callback,
                            delete_callback=_default_delete_callback,
                            tags=None,
                            credentials=None )

      Update the routes for the given project to access GCP services with Google API Access for Private IPs.
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

**NOTE:** Pls also consider [Forseti's Inventory Scanner](http://forsetisecurity.org/docs/quickstarts/inventory/index.html)


### API Usage
Example:

    from gcpinventory import gcpinventory as inventory_service    
    import logging
    logger = logging.getLogger()
    logging.basicConfig()
    logger.setLevel(logging.INFO)

    inventory_service = inventory_service.InventoryService()


    def _my_add_callback(inventory_service,add_routes):
        """
        callback to be invoked on the routes to be added
        :param inventory_service: The handle to the inventory_service
        :param add_routes: The routes that need to be added
        :return:
        """
        inventory_service.logger.info("%d cidr blocks to add to routes" % len(add_routes))
        return

    # The default implementation for  add_callback and delete_callback , just print the list to the logger


    project_id = "my-project-id"
    inventory_service.sync_gcp_service_routes(routes_prefix="my-prefix",
                                               project=project_id,
                                               priority=2000,
                                               network=("projects/%s/global/networks/mynetwork" % project_id),
                                               next_hop_gateway=("projects/%s/global/gateways/default-internet-gateway" % project_id),
                                               apply_changes=True,
                                               add_callback=_my_add_callback
                                               )





## Helpful links

  -  https://cloud.google.com/compute/docs/tutorials/python-guide
  -  https://github.com/google/google-api-python-client
  -  https://developers.google.com/resources/api-libraries/documentation/cloudresourcemanager/v1/python/latest/cloudresourcemanager_v1.projects.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.disks.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.zones.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html
