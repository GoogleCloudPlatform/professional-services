# ABAP Utility for Bulk Creation of CDS Views

## Summary

This ABAP utility program streamlines the creation of CDS views designed for capturing delta changes in SAP tables.  These delta-enabled views are crucial for replicating data to BigQuery, enabling powerful data analytics on SAP data.  By automating this process, the utility eliminates the manual effort and potential errors associated with creating individual views.  This allows for a more seamless and efficient integration with BigQuery, whether you are building custom data pipelines or utilizing the Google Cloud Cortex Framework to accelerate the establishment of your data foundations.


## Problem Statement

Many SAP to BigQuery replication scenarios, particularly those using tools like Datasphere, rely on delta-enabled CDS views when an SLT license is unavailable, creating replication flows becomes challenging. Manually creating and maintaining these CDS views is a tedious and error-prone process, especially when dealing with a large number of tables. This necessitates a solution for creating the necessary CDS views, enabling data replication even without SLT. It eliminates the manual effort and potential errors associated with creating and maintaining these views.




## Key Features

* **Automated CDS View Creation:** Generates CDS views for designated SAP tables, eliminating manual development effort.
* **Bulk Processing:** Efficiently handles large datasets of tables through file upload.
* **Cortex Compatibility:** Guarantees one-to-one correspondence between CDS views and source tables, adhering to Cortex Framework expectations.
* **Transport and Package Management:** Integrates with the SAP transport system for controlled deployment and versioning of CDS views.
* **Comprehensive Error Handling:** Catches and reports potential errors during data processing and view creation.
* **Log Maintenance:** Maintains log of all activities such as cds views created, errors reported etc for future reference after the 
details are displayed in the program's output

## Technical Design

### User Interface

* An intuitive selection screen allows users to:
    * Upload an input file containing a list of SAP tables, CDS and SQL view names for CDS view creation.
    * Provide the target transport request for saving the generated views.
    * Input the package where the CDS views will be assigned.

### Application Logic

* The program extracts table names from the input file.
* It reads the corresponding schema/structure of the input tables from the SAP DD03L table.
* For each table, it dynamically creates the CDS view definition with necessary annotations.
* It generates the underlying SQL view for the defined CDS view.
* If SQL or CDS view name is not defined, it is defaulted as Z_Tablename_CDS and Z_Tablename_SQL
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

2. **Prepare Input File:** Create an input file (TSV) with three columns: `TABLENAME` , `CDSVIEWNAME` and `SQLVIEWNAME`. Checkout the sample_input_file.txt for reference
3. **Execute the Program:** Run the imported program ZGOOG_CDS_CR, providing the input file from step 2, TR number and package details.
4. **Logs:** Once program executes and displays the output, the same logs are saved in the table ZCDS_CR_LOG

