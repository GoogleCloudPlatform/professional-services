# BQTag

Utility class for tagging BQ Table Schemas with Data Catalog Taxonomy Policy Tags. Create BQ Authorized Views using Policy Tags. Helper utility to proviosion Data Catalog Taxononmy and Policy Tags.

# Data Catalog Policy Tags and Big Query Overview

Many organisations need a way to restrict access of particular columns in BigQuery Table to a few set of users. They need to have different views for different personas in their organisation and they also like some sort of automation to manage the scale.

This is possible in GCP to use Cloud Data Catalog to create a Taxonomy and policy tags. Policy tags can be assigned permissions for certain users and then these tags can be mapped to BigQuery Table Columns. Only users who have relevant  permission for a tag can work with a column mapped with that tag. Sometimes, organisations also need to create views based on tags assigned to columns and this is done by creating Authorised BQ views but needs considerable effort in creating the exact SQL Queries for these views. Issue is amplified if BigQuery Table has nested and repeated columns and there is a need to retain the original table structure. Most of these issues can be addressed by automation. The code present in this module is a sample automation for the same. To understand the concept in a details, let us look at a sample use case.

Let us consider an example of online book store which sells books. They have a requirement to have data categorised in 4 categories: **High, Medium, Low and Baseline**. This is accomplished by creating 4 policy tags in Data Catalog under bookstore-taxonomy.  They have a sales table which has 4 columns: Reviews which should be visible to everyone, Book Name which has Low Confidentiality, Customer Name has medium confidentiality while credit card number has high confidentiality. 

![bookstore](./imgs/figure1.png)

Policy-tags can be associated with the respective columns to have the desired functionality. This will restrict, for example anyone who does not have access to high confidentiality policy tag to read Credit Card numbers.

Business requirement is to create 3 views:

- **Standard** which has data tagged with baseline
- **Internal** which has data tagged with baseline as well as low and medium confidentiality
- **Restricted** which has all the data.

There is no direct way to create views based on policy tags. The way to accomplish is to manually select columns which have particular tags associated with them and then write SQL queries. SQL queries can get really complex if the table has nested and repeated columns. 

BQTag automates not only creation of queries but also helps in associating the right policy tag to the table columns in a standard way. BQtag removes the complexity by providing a simple and intuitive python functions.

# Using BQTag

## Initialize Object

Create an instance of bqtag.BQTableView. 

```python
bq = BQTableView(bq_dataset = BQ_DATASET,
                 catalog_taxonomy = TAXONOMY_DISPLAY_NAME,
                 location = LOCATION,
                 bq_project = BQ_PROJECT,
                 catalog_project = CATALOG_PROJECT,
                 json_credentials_path = JSON_CREDENTIALS_FILE)
```


`bq_dataset` (required) is the BigQuery Dataset where Table and Authorized Views have to be created. 

`catalog_taxonomy` (required) is the Data Catalog taxonomy name which holds the Policy Tags. Taxonomy may not be present and can be created using the create_taxonomy() function.

`location` (required) is the location where BigQuery and DataCatalog resources are present or would be created.

`bq_project` (optional - can be derived from authenticated service account) is the project where BigQuery resources are present or would be created.

`catalog_project` (optional - can be derived from authenticated service account) is the project where Data Catalog resources are present or would be created.

`json_credentials_path` (optional) path to service account credentials file. 


## Create Taxonomy and Policy Tags

Data Catalog Taxonomy and Policy Tags can be created if not already present. If Taxonomy and Policy Tags are already present then just specify the display name of Taxonomy in `catalog_taxonomy` variable and relevant policy tags would be downloaded from the Taxonomy. If, however, Taxonomy and Policy Tags are not present then `create_taxonomy()` function can be used to provision the same. Taxonomy name provisioned would be taken from the `catalog_taxonomy` variable. `create_taxonomy()` takes the following parameters:

`tags` list of dictionaries where each dictionary describes a Policy Tag to be created. Each tag can have following attributes:

- `name` (required) is the name of the Policy Tag to create
- `description` (optional) is the description of the Policy Tags
- `parent_policy_tag` (optional) is the link to the parent policy tag

```python
bq.create_taxonomy([
                    {"name": "low", "description": "Low tag"}, 
                    {"name": "medium", "description": "Medium tag"}, 
                    {"name": "high", "description": "High tag"}
                  ])
```


