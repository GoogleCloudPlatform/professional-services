# GCP Architecture Visualizer

This tool serves a single, simple purpose: visualizing a user's GCP architecture and environment, so that they have a dynamic and simple-to-use way to view their world in GCP.

It does this by:

* Ingesting a strictly-formatted CSV input file, which is generally output from a [Forseti Security](http://forsetisecurity.org) Inventory scan.
* Dynamically building the parent->child tree of inventory resources in GCP.
* Drawing an interactive tree structure using D3.js, containing useful GCP info and per-resource icons.


## Usage

The tool has been tested with [Forseti Security](http://forsetisecurity.org) 2.0, and can be used to draw out any CSV input (currently stored in gcp-data.csv) that conforms to the following schema:

```
id, resource_type, category, resource_id, parent_id, resource_name
```

CSV generation currently performed using Google Cloud SQL export from Forseti Security Inventory tables, using the query below:

```
SELECT id, resource_type, category, resource_id, parent_id, IFNULL(resource_data->>'$.displayName', '') as resource_data_displayname, IFNULL(resource_data->>'$.name', '') as resource_data_name FROM gcp_inventory WHERE inventory_index_id = (SELECT id FROM inventory_index ORDER BY completed_at_datetime DESC LIMIT 1) AND (category='resource') AND  (resource_type='organization' OR resource_type='project' OR resource_type='folder' OR resource_type='appengine_app' OR resource_type='kubernetes_cluster' OR resource_type='cloudsqlinstance');
```

Other useful queries:

__Get id of latest inventory scan (timestamp):__
```
SELECT id FROM inventory_index WHERE inventory_status = “SUCCESS” ORDER BY completed_at_datetime DESC LIMIT 1;
```

__Check schema of gcp_inventory table (in case schema changes, and query needs to be updated):__
```
Describe forseti_security.gcp_inventory;
```

## Examples

Fully functional example available [here](https://storage.googleapis.com/forsetiviz-external/gcp-arch-viz.html). Looks like this:

![gcp-arch-viz animation](https://storage.googleapis.com/forsetiviz-external/gcp-arch-viz.gif)