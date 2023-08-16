Below packages are need to run the script:
google-cloud-secret-manager
google-cloud-bigquery
google-cloud-storage
google-api-core
sudo apt install unixodbc


Steps to run this script:

1.  Create the generic-ddl-extraction-config.json file and place it in the gcs bucket. 

2. Create the object_name_mapping.json file and place it in the gcs bucket.

3. Add the needed additional metadata columns to the metadata_columns.json file and place it in the gcs bucket

4. After completing the above steps, the script can be run as

        a) pip install -r requirements.txt  
        b) python3 generic_ddl_extraction.py <gcs_json_config_file_path> <project_name> <client-path>

5. Once done, verify that the extracted ddl is placed in the specified gcs path.

# DDL Extractor Utility

A utility to extract metadata of the tables in the Database(Oracle, Snowflake, MSSQL, Vertica, Neteeza).

## Step to setup MSSql driver for running the code:
Install pip install -r requirement.txt
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

Below packages are need to run the script:pandas, cx_Oracle

1. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
2. Add your credentials in the secret manager for the respective database
3. Select the type of database. Currently supported types include (mysql, vertica, netezza).
4. Run the utility
    python3  generic_ddl_extractions.py --dbtype <dbtype_name> --secret_name <secret_name> --gcs_config_path <gcs_config_path> --project_id <project_id>
5. Check the result in given bucket name Folder.

