# ABAP Utility for Bulk Creation of CDS Views

## Summary

This ABAP utility program automates the creation of CDS views for SAP tables that can be used for replicating SAP tables to BigQuery and for Cortex Data Foundation. It eliminates the manual effort and potential errors associated with individual view creation, ensuring a seamless and efficient process.

## Problem Statement

Replicate SAP tables to BigQuery via Datasphere using CDS views provided that enterprise SLT license is not available.
Manually creating CDS views for each SAP source table intended for replication to BigQuery or Cortex integration is time-consuming and prone to errors. This necessitates a more efficient and automated solution.

## Key Features

* **Automated CDS View Creation:** Generates CDS views for designated SAP tables, eliminating manual development effort.
* **Bulk Processing:** Efficiently handles large datasets of tables through file upload.
* **Cortex Compatibility:** Guarantees one-to-one correspondence between CDS views and source tables, adhering to Cortex expectations.
* **Transport and Package Management:** Integrates with the SAP transport system for controlled deployment and versioning of CDS views.
* **Comprehensive Error Handling:** Catches and reports potential errors during data processing and view creation.

## Technical Design

### User Interface

* An intuitive selection screen allows users to:
    * Upload an input file containing a list of SAP tables for CDS view creation.
    * Provide the target transport request for saving the generated views.
    * Input the package where the CDS views will be assigned.

### Application Logic

* The program extracts table names from the input file.
* It reads the corresponding schema/structure of the input tables from the SAP DD03L table.
* For each table, it dynamically creates the CDS view definition with necessary annotations.
* It generates the underlying SQL view for the defined CDS view.
* Utilizes ABAP's built-in capabilities to activate and transport the generated views.
* Implements robust error handling mechanisms.

### Output Screen

* Provides a summary of processed tables and generated CDS views.
* Highlights successful creations and reports any failures with detailed reasons.
* Displays the assigned transport and package information.

## ABAP Utility Import Process

### Mass CDS Generator Utility Program Import and Execution

1. **Import Transport Request:** Import the provided transport request using the attached files:

    * `K900071.S4S`
    * `R900071.S4S`

    * Refer to this guide for importing transport requests: [How to Import an SAP Transport Request](https://kb.theobald-software.com/sap/how-to-import-an-sap-transport-request-with-the-transportmanagement-system-stms)   

2. **Prepare Input File:** Create an input file (CSV or TXT) with two columns: `TABLENAME` and `CDSVIEWNAME`.
3. **Execute the Program:** Run the imported program, providing the input file from step 2.
4. **(Optional) Replicate to GCP BQ:** If needed, follow the remaining steps (not provided in this document) to replicate the generated views to Google Cloud BigQuery.
