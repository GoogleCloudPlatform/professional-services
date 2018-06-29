# Resources Inventory

This is a collection of scripts that can provide inventory of resources in GCP

 **NOTE:** At the time of this document, the samples is for listing disks only
 
 **NOTE:** Pls also consider [Forseti's Inventory Scanner](http://forsetisecurity.org/docs/quickstarts/inventory/index.html) 
## Usage

Install the Python Client Library as described [here](https://cloud.google.com/compute/docs/tutorials/python-guide)

Review the [list_disks.py](./list_disks.py)

Execute [list_disks.py](./list_disks.py) as the useer who has access to the projects from which you need the list


## Helpful links

  -  https://cloud.google.com/compute/docs/tutorials/python-guide
  -  https://developers.google.com/resources/api-libraries/documentation/cloudresourcemanager/v1/python/latest/cloudresourcemanager_v1.projects.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.disks.html#list
  -  https://developers.google.com/resources/api-libraries/documentation/compute/v1/python/latest/compute_v1.zones.html#list

