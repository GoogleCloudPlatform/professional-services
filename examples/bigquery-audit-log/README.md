# BigQuery Audit Log Dashboard
This example shows you how to build a dashboard using Data Studio for visualization and a SQL script to query the back-end data source. The dashboard displays different metrics pertaining to BigQuery consumption. The purpose of the dashboard is to be used as a BigQuery auditing tool that - helps identify the different kinds of BigQuery jobs running in the project, the creator of those jobs as well as the billing incurred due to the same.

The dashboard is organised into the following sections:
1. [Overall Usage](./docs/overall_usage.md)
2. [Load Jobs](./docs/load_jobs.md)
3. [Extract Jobs](./docs/extract_jobs.md)
4. [Copy Jobs](./docs/copy_jobs.md)
5. [Queries](./docs/query_jobs.md)

Clicking on the links above will direct you to the individual READMEs which describe the particular section of the Dashboard and the data it displays.

#### The following steps describe how to set up a working dashboard in Data Studio that builds reports on the BigQuery audit logs for your project.

### Prerequisites
Create a dataset in BigQuery in the project you will be exporting logs to. You can give it a custom name. For the sake of simplicity we will be referring to the dataset as "BigQuery Audit".

### 1. Getting the BigQuery log Data
A detailed description of steps to collect BigQuery logs for your GCP Projects can be found [here](https://cloud.google.com/bigquery/audit-logs).

A short description relevant to our use case is presented below -

1. In the GCP Cloud Console select the project you want to export the logs to. Go to Stackdriver --> Logging --> Exports.
2. Click on Create Export. Select the following in the drop down menu: "BigQuery", "All logs", "Any log level", "No limit" and "Jump to now" respectively.
3. In the configuration windows on the right side of the screen, enter a Sink Name of your choice. Select BigQuery as Sink Service. Select the "BigQuery Audit" (refer to Prerequisites) dataset as the Sink Destination.
4. Click on Create Sink. 
5. A message box pops up to notify you of successful creation. Click on Close.
6. Click on the Play button located on the top bar to start the export.

### 2. Scheduling a BigQuery job
Use the SQL script in the file bigquery_audit_log.sql (located in this GitHub folder) to create a scheduled query in BigQuery. Click [here](https://cloud.google.com/bigquery/docs/scheduling-queries) for instructions on how to create scheduled queries. 

Create a materialized table that stores data from the scheduled query. 
You can give it a custom name, we will be referring to it as **bigquery_audit_log**.

### 3. Copying the data source in Data Studio
Log in to Data Studio and create a copy of [this](https://datastudio.google.com/u/2/datasources/10MfID78E_Dyw_n9Cc6gDGUuGyRHrN6dh) data source. Click [here](https://support.google.com/datastudio/answer/7421646?hl=en&ref_topic=6370331) for more information on copying data sources.

There are three derived fields need to be defined in the datasource.
* totalCached: SUM(numCached);
* pctCached: totalCached / COUNT(isCached);
* table: CONCAT(referencedTables.projectId, '.',referencedTables.datasetId,'.',referencedTables.tableId);

Rename the data source to a name of your choice. Click on "Edit Connection" to navigate to the project, dataset and table of your choice. It should correspond to the materialized table created as a result of step 2 above.

Click on "Reconnect" located on the top right of the page.

### 4. Creating a dashboard in Data Studio
Create a copy of [this](https://datastudio.google.com/u/2/reporting/1kwNFt05J8_GCju5TBH1v4IlBmmAU74Nu/page/nSaN) Dashboard.

After clicking on the Copy button, you will find a message asking you to choose a new data source. Select the data source created in the step 3 above.

Click on create report. Rename the report (dashboard) to a name of your choice.
