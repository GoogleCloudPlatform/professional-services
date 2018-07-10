# Resources Inventory

This is a collection of scripts that can provide inventory of resources in GCP
In addition to accessing projects,zones and disks it also provides a method to keep routes in sync with the GCP services netblocks.
see the method sync_gcp_service_routes(...) for more details

The package can be installed by `pip install gcp-inventory-service'

**NOTE:** Pls also consider [Forseti's Inventory Scanner](http://forsetisecurity.org/docs/quickstarts/inventory/index.html) 


### API Usage
Example:

    from gcp_inventory_service import gcp_inventory_service as inventory_service
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
  -  https://developers.google.com/resources/api-libraries/documentation/cloudresourcemanager/v1/python/latest/cloudresourcemanager_v1.projects.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.disks.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.zones.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.routes.html

