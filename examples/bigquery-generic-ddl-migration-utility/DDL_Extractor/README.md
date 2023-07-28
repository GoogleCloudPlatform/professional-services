# DDL Extractor Utility

A utility to extract metadata of the tables in the Database(Oracle, Snowflake, Vertica, Netezza, MSSQL).

The Generic DDL Migration Utility does the following functionalities:

1. The script connects to Generic Database (MSSQL, Neteeza, Vertica).
2. The script uses the metadata table (all_tab_columns) to retrieve the table schema information.
3. The script produces the "create table" statement using the schema information and store the extracted ddl in the specified gcs path.
4. The script calls the BigQuery Migration API and converts the ddl to the BigQuery DDL and placed it in the specified gcs path.
5. The script create the Bigquery Tables in the specified target dataset. 
6. The table structure will include source columns, metadata columns and paritioning and clustering info.
7. The script archives the DDL files created by the scripts (generic_ddl_extraction.py, generic_bq_converter.py and archive_ddl.py).
8. The status of each table conversion is logged in the audit table in the target datset.


The order of execution of the script is as follows

1. generic_ddl_extraction.py
2. generic_bq_converter.py
3. bq_table_creator.py
4. archive_ddl.py

## Business Requirements

To create a common repository for metadata extraction for each of the source databases, so that there is a standard way to retrieve this information and also avoid any duplication efforts from different engagements.

## Asset Feature

The utility that will connect to each of the legacy databases and extract the Table Metadata by reading from different internal system tables, formatting the information and producing the final Table Metadata to be migrated to GCP.

## Step to setup MSSql driver for running the code:
To install the SQL Server 2017 ODBC driver on Debian 11, you can use the following steps:

1. Download the ODBC driver package for Debian 10 (Buster) from the Microsoft repository:
    `wget https://packages.microsoft.com/debian/10/prod/pool/main/m/msodbcsql17/msodbcsql17_17.8.1.1-1_amd64.deb`

2. Install the downloaded package:
    `sudo dpkg -i msodbcsql17_17.8.1.1-1_amd64.deb`

    If any dependencies are missing, the dpkg command will notify you. You can use apt-get to install the required dependencies before re-running the dpkg command.

    `sudo apt-get install -f`
    
    `sudo dpkg -i msodbcsql17_17.8.1.1-1_amd64.deb`

3. Verify the installation:
    Once the installation is complete, you can proceed with installing pyodbc using the steps mentioned earlier. Verify the installation by importing pyodbc in a Python shell or script:
    
    import pyodbc
    print(pyodbc.version)
    
    If the import and version printout are successful, it means pyodbc is installed correctly, and the SQL Server 2017 ODBC driver is ready to use.

4. In order to locate the ODBC driver package :
    In case the ODBC driver library is installed in a different location, you can perform a system-wide search using the find command. This may take some time as it searches the entire filesystem.
    `sudo find / -name "libmsodbcsql*"`
    
    The command will search for any file starting with libmsodbcsql in the filesystem. Note down the path of the library file if it is found.

By following these steps, you should be able to locate the ODBC driver library file (libmsodbcsql.so) on your system. Once you find the library file, you can use its path to set the driver variable in your code for connecting to the SQL Server database using pyodbc.

## Instructions to Run

Below packages are need to run the script:pandas, sqlparse, XlsxWriter

1. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
2. Add your credentials for gcloud authentication as creds.json file in the utility folder.
3. Select the type of database. Currently supported types include (mysql, vertica, netezza).
4. Run the utility
    `python3 main.py --dbtype vertica --username user --password pass --host 0.0.0.0 --port 75 --dbname mydb --bucket ddl_utility`
5. Check the result in given bucket name Folder.