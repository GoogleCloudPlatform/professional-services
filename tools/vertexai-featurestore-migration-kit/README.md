# Legacy Feature Store  to Feature Store 2.0 Migration

## Configuration File

* **`project_id`:**  Your Google Cloud Project ID.
* **`region`:**  The Google Cloud region where your feature stores are located.
* **`bq_dataset_prefix`:** Prefix for the BigQuery dataset name
* **`bq_table_prefix:`:** Prefix for the BigQuery table name
* **`legacy_feature_store`:**  Configuration for the legacy Vertex AI Feature Store.
    * **`feature_store_mode`:**
        * **`all`:**  Process all feature stores in your project.
        * **`list`:** Process only the feature stores specified in the `feature_stores` section.
    * **`feature_stores`:** A list of feature store configurations.
        * **`name`:** The name of the legacy feature store to migrate.
        * **`entity_type_mode`:** 
            * **`all`:** Process all entity types in the feature store.
            * **`list`:** Process only the entity types specified in the `entity_types` section.
        * **`entity_types`:** A list of entity type configurations.
            * **`name`:** The name of the entity type within the feature store.
            * **`entity_id_column`:** The name of the entity id column to rename.
            * **`mapping_file`:** The path to the CSV file containing the feature mapping for this entity type.

**Feature Store and Entity Type Mode Behaviour**
* **`feature_store_mode: all`:** When `feature_store_mode` is set to `all`, the migration process will automatically process **all** feature stores that exist in your Google Cloud project. This means the `feature_stores` section in your configuration file will be ignored. All entity types and their features will be migrated as-is from all feature stores.
* **`entity_type_mode: all`:**  Within a feature store, when `entity_type_mode` is set to `all`, the migration process will automatically process **all** entity types within that feature store. The `entity_types` section for that specific feature store will be skipped. All entity types within that feature store will be migrated.

### Feature Mapping CSV Files

The `mapping_file` for each entity type points to a CSV file with the following format:

```csv
original_feature_name,destination_feature_name
id,id
name,name_new
style,style_new
```

* **`original_feature_name`:**  The name of the feature in the legacy feature store.
* **`destination_feature_name`:** The desired name for the feature in the new Feature Store 2.0.

**Feature Mapping Behavior:**

* If `mapping_file` is not specified in the config, all features associated with the entity type will be migrated as-is (no renaming).
* If `mapping_file` is specified, **only the features mentioned in the CSV file will be migrated.**  Features not listed in the CSV file will be skipped.
* To skip renaming a feature, keep the `original_feature_name` and `renamed_feature_name` the same in the CSV file.

## Execution Steps
### Offline Store
This section outlines the steps involved in migrating Vertex AI Legacy Feature Store data to Feature Store 2.0 using the provided configuration file.
Refer to `main.py` script for detailed execution steps.

**Initialize logger**
```python
configure_logging()
```

**1. Export Legacy Feature Store:**

A `LegacyExporter` object is created, which loads the configuration file (`config.yaml`) during initialization.
```python 
legacy_exporter = LegacyExporter()
export_response = legacy_exporter.export_feature_store()
```
This `export_feature_store` method performs the actual data migration.
* Based on `feature_store_mode` and `entity_type_mode` in the configuration, it iterates through the specified feature stores and entity types.
* For a given feature store and entity type, it creates a BigQuery dataset and table with names same as feature store and entity type.  
* It then renames(optional) and exports feature values to the corresponding BigQuery table based on the selected features (specified in the config using the `mapping_file` setting).
* This method returns a dictionary (`export_response`) summarizing the exported data. 

   **Example `export_response`:**

  ```json
  {
     "fs1": [
        {
           "entity_type": "et1",
           "features": [
              "feature_1",
              "feature_2",
              "feature_3"],
          "bq_dest": "bq://project_id.fs1.et1"
        },
        {
           "entity_type": "et2",
           "features": [
              "feature_1",
              "feature_2",
              "feature_3"],
          "bq_dest": "bq://project_id.fs1.et2"
        }
     ]
  }
  ```

**Resource Creation Options**

By default, this migration tool only exports data from the legacy Feature Store. To create Feature Store 2.0 resources (including offline and online stores), you must explicitly specify the `--create-resources` flag:

```bash
# Export data only (default)
python main.py

# Full migration including resource creation
python main.py --create-resources
```

For production deployments, we recommend using Infrastructure as Code (IaC) to manage your Feature Store 2.0 resources. Please refer to the [Terraform Feature Store module](terraform/vertex_ai_feature_store/README.md) as an example to help get you started with deploying Feature Store 2.0 resources. This module contains detailed configurations and instructions that you can adapt for your specific needs.

**Relevant Terraform Resources:**
* [google_vertex_ai_feature_online_store](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/vertex_ai_feature_online_store) - Documentation for Feature Store resource
* [google_vertex_ai_feature_online_store_featureview](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/vertex_ai_feature_online_store_featureview) - Documentation for Feature View resource

The following sections describe the resource creation process when the `--create-resources` flag is enabled. If this flag is not set, the migration process will stop after exporting data from the legacy Feature Store.

**2. Import into Feature Store 2.0:**

```python
feature_store_importer = FeatureStoreImporter()
feature_store_importer.import_features(data=export_response)
```

This method takes the `export_response` from the previous step and imports the data into Feature Store 2.0:
* It iterates through the exported data for each feature store and entity type.
* For each entity type, it creates a Feature Group with the same name as the entity type.
* For each feature within the entity type, it creates an individual Feature under the corresponding Feature Group.

### Online Store
**3. Generate Intermediate Online FS serving config file**
```python
import json
from utils import transform_json

ONLINE_STORE_CONFIG_FILE = "config/online_store_config.json"


# Generate Intermediate Online FS serving config file
transformed_config = transform_json(export_response)
with open(ONLINE_STORE_CONFIG_FILE, "w", encoding="utf-8") as f:
    json.dump(transformed_config, f)
```
- We transform the exported configuration data (export_response) into a format compatible with Feature Store 2.0, saving it as online_store_config.json. 
- This file serves as an intermediate step, allowing users to review and customize the proposed configuration before creating the online store. 
- This is essential due to potential differences between the legacy and new Feature Store versions.

**Points to note while reviewing the online store config**

- The online_store_type can be set to bigtable or optimized depending on the use case and the size of features. 
- Currently, the script supports Manual or Cron as Sync modes for FeatureViews. The default value for the field cron_schedule will be set to null which will mark it as a Manual Sync Mode. 
- The fields bigtable_min_node_count,bigtable_max_node_count,cpu_utilization_target will be skipped if the online_store_type is set to optimized. 
- Review the mapping of Feature Groups to Feature views.

**Read back the Online FS serving config file**
```python
def read_json_config(config_file):
    """Reads a JSON file and returns its contents as a dictionary"""
    with open(config_file, 'r', encoding="utf-8") as f:
        data = json.load(f)
    return data


# Read Online Store config File
online_store_config = read_json_config(ONLINE_STORE_CONFIG_FILE)
```

**4. Online Store Creation and Feature View Population**
```python
from logging_config import logger
from online_store_creator import FeatureOnlineStore


for online_store_config_obj in online_store_config["online_stores"]:
    online_store_obj = FeatureOnlineStore(online_store_config_obj=online_store_config_obj,
                                          project_id=online_store_config["project_id"],
                                          region=online_store_config["region"])
    try:
        online_store_obj.create_feature_online_store()
    except ValueError as e:
        logger.error(f"Error creating online store: {e}")
        continue
    online_store_obj.create_feature_views_from_feature_groups()
```

- The script reads a JSON file containing configurations for online feature stores. 
- It iterates through each configuration, creating a corresponding online store in Vertex AI Feature Store 2.0 if one doesn't already exist. 
- For each new online store, the script sets up the appropriate configuration (Bigtable or Optimized). 
- If the store is Bigtable-based, it applies scaling and resource utilization settings as defined in the configuration file. 
- Finally, the script creates feature views within each online store, linking them to the relevant feature groups in the Feature Registry, allowing these features to be served online for model predictions. 


## Run Validation File 

Command to run the validation.py file:

```bash
python3 validation.py --project_id [PROJECT_ID] --region [REGION_ID] --spreadsheet_file_path [PATH_FOR_OUTPUT_SPREADSHEET]
```

The validation file lists the resources from Legacy Feature store and Feature Store 2.0 & categorizes into 3 separate tabs:
* `Legacy Feature Store` : This tab lists the Feature stores, Entities and Features from the Legacy Feature store.
* `Feature Groups`: This tab lists the Feature Groups present in the given project and region in the Feature Store 2.0
* `Online Store Comaprison` : This tab lists the Legacy Feature Stores for which the Online Store is enabled and it lists the Online Stores created in Feature Store 2.0  


## Cloud Run Job Deployment

This migration tool can be deployed as a Cloud Run job for managed, serverless execution. Cloud Run Jobs are ideal for this one-time migration as they provide:
* Purpose-built environment for one-off container workloads
* Simple deployment model
* Configurable memory, CPU, and timeout settings
* Built-in retry policies and error handling
* Serverless pricing model - pay only for execution time

**Implementation Steps:**

1. Containerize the migration script:
```dockerfile
FROM python:3.9
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
ENTRYPOINT ["python", "main.py"]
```

2. Deploy as Cloud Run job:

```bash
gcloud run jobs create featurestore-migration \
    --image IMAGE_URL \
    --region REGION \
    --service-account SA_EMAIL \
    --memory 4Gi \
    --timeout 3600s
```

The Cloud Run job will execute the migration **without** the --create-resources flag enabled. Ensure the service account has appropriate permissions. 
