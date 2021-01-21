# BigQuery ACL Mapper

A tool retrieves user permission data from Teradata, maps them to BigQuery ACLs, and outputs them in a terraform format.

## Purpose

Every data warehouse (DWH) migration to BigQuery includes migrating the DWH users and their permissions. Mapping permissions between two systems requires considerable effort from the customer DWH admin and security teams. They need to analyze, compare, and match on-prem permissions with IAM in BigQuery. This process requires time and is error prone. The BigQuery ACL Mapper can automatically map permissions between the customer DWH and BigQuery. The current version only supports Teradata.
