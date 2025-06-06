# Oracle Database Assessment Scripts (PDB & CDB)
This repository contains Python scripts designed to perform comprehensive assessments of Oracle Databases, specifically tailored for both Pluggable Database (PDB) and Container Database (CDB) environments. These scripts generate detailed reports in a multi-sheet Excel format, making the data easy to review and analyze.

## 1. Purpose
These scripts automate the collection of critical Oracle Database metadata, providing a structured overview of database configuration, schema objects, and user/privilege information. This assessment is invaluable for:

- **Migration Planning:** Understanding the current state of a database before migrating to Oracle Cloud Infrastructure (OCI), Google Cloud (GCP), or other platforms.
- **Auditing & Compliance:** Documenting database structures and permissions.
- **Troubleshooting:** Gaining quick insights into database components.
- **Capacity Planning:** Analyzing tablespace usage and object counts.

## 2. Features
**PDB Assessment Script** [Oracle PDB Assessment](./src/python/pdb_oracle_assessment.py)
This script connects to a **Specific Pluggable Database (PDB)** and gathers detailed information relevant to that PDB.

- **Database Overview:** Basic database information (name, version, character sets).
- **Tablespace Analysis:** Usage, total size, used/free space, extent management, and allocation type for specific tablespaces.
- **Schema Details:** Account status, creation date, default/temporary tablespaces for a specified schema.
- **Object Listing:** Tables, columns, constraints, indexes, views (without full text due to limitations), sequences, and PL/SQL objects within the specified schema.
- **Privilege Analysis:** Roles defined in the PDB, and system/role/object privileges granted to specific users.
- **Database Links:** Information about database links within the PDB.

**CDB Assessment Script** [Oracle CDB Assessment](./src/python/cdb_oracle_assessment.py)
This script connects to the **Container Database (CDB)** Root and provides a comprehensive assessment across all accessible PDBs within that CDB.

- **CDB Overview:** Core CDB information (name, version, character sets).
- **PDBs Overview:** Lists all PDBs, their IDs, names, status, open mode, creation SCN, and time.
- **CDB-Wide Object Listing:** Gathers tables, columns, constraints, indexes, views (without full text), sequences, and PL/SQL objects from all non-Oracle-maintained schemas across all PDBs, identifying which PDB each object belongs to.
- **CDB-Wide Privilege Analysis:** System, role, and object privileges for specified users across PDBs.
- **CDB-Wide Database Links:** Lists database links present in all PDBs.

## 3. Prerequisites
To run these scripts, you will need:

- **Oracle Database:** Oracle Database 12c or newer (tested with 21c XE).
- **Operating System:** Linux (tested with RHEL 8).
- **Python:** Version 3.7 or newer.
- **Oracle Instant Client:** Matching or newer than your Oracle Database version (e.g., Instant Client 21c for Oracle DB 21c).
- **Python Libraries:**
  - oracledb (for Oracle database connectivity)
  - pandas (for data manipulation)
  - openpyxl (as a backend for writing Excel .xlsx files)
- **OS Build Tools & Libraries:** For pyenv and Python package compilation:
  - gcc, zlib-devel, bzip2-devel, readline-devel, sqlite-devel, openssl-devel, libffi-devel, xz-devel, git, libaio-devel, python3-devel (or equivalent yum packages on RHEL/CentOS).

## 4. Setup Instructions
It's highly recommended to set up the environment for the oracle OS user (or the OS user that will run the scripts and has access to Oracle binaries/groups) to avoid permission issues and ensure proper environment variable loading.

### Oracle Instant Client Setup (Linux)
1. Download Instant Client:
    - Go to [Oracle Instant Client Downloads](https://www.oracle.com/database/technologies/instant-client/downloads.html).
    - Select "Instant Client for Linux x86-64" for your Oracle DB version (e.g., 21c).
    - Download the "Basic Package" (e.g., instantclient-basic-linux.x64-21.x.0.0.0dbru.zip).

2. Unzip and Place:
    - Create a directory, e.g., /opt/oracle/: sudo mkdir -p /opt/oracle/
    - Unzip the downloaded package into this directory. It will create a folder like instantclient_21_x (e.g., instantclient_21_12).
      ```bash
      sudo unzip instantclient-basic-linux.x64-21.x.0.0.0dbru.zip -d /opt/oracle/
      ```
    - Note the exact unzipped path (e.g., /opt/oracle/instantclient_21_12).

3. Set LD_LIBRARY_PATH:
    - Edit the .bashrc file of the user that will run the script (e.g., /home/oracle/.bashrc).
    - Add the following line to the end:
      ```bash
      export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_12:$LD_LIBRARY_PATH
      ```
      (Replace /opt/oracle/instantclient_21_12 with your actual path).
    - Apply the changes: source ~/.bashrc

### Python Environment Setup
  1. Install System Dependencies:
    These are needed for pyenv to compile Python and for oracledb to build any necessary C extensions.
    ```bash
      sudo yum install -y gcc zlib-devel bzip2 bzip2-devel readline-devel sqlite sqlite-devel openssl-devel libffi-devel xz xz-devel git libaio-devel python3-devel
    ```
  2. Install pyenv:
    pyenv is a tool for managing multiple Python versions.
    ```bash
      curl https://pyenv.run | bash
    ```
  3. Configure pyenv in .bashrc:

    - Edit the .bashrc file of the user that will run the script (e.g., /home/oracle/.bashrc).
    - Add these lines to the end:
    ```bash
      # For pyenv
      export PATH="$HOME/.pyenv/bin:$PATH"
      eval "$(pyenv init --path)"
      eval "$(pyenv virtualenv-init -)"
    ```
    - Apply the changes: source ~/.bashrc
  4.  Install Python 3.11.9 (or newer) using pyenv:
    ```bash
      pyenv install 3.11.9
      pyenv global 3.11.9 # Set as default for this user
    ```
    (This step will take several minutes to compile Python. Be patient.)
    - Verify: python --version (should show Python 3.11.9)
  5.  Install Python Libraries:
   Finally, install the necessary Python packages.
    ```bash
      pip install oracledb pandas openpyxl
    ```
    - If you face ERROR: Could not find a version... or No matching distribution... after confirming python --version is 3.11.9+:
    ```bash
      pip cache purge
      pip install --upgrade --force-reinstall setuptools wheel
      pip install oracledb pandas openpyxl
    ```
## 5. How to Use
  1. **Download the Scripts:** Place pdb_oracle_assessment.py and cdb_oracle_assessment.py into a directory on your server (e.g., /opt/oracle/scripts/).

  2. **Ensure PDB is Open (for PDB assessment):**
  If running pdb_oracle_assessment.py for a specific PDB, ensure that PDB is in READ WRITE mode.
  (Connect to CDB Root as SYSDBA: ALTER PLUGGABLE DATABASE YOUR_PDB_NAME OPEN;).

### PDB Assessment (pdb_oracle_assessment.py)
  This script assesses a single PDB. You connect to the PDB with a specific schema user.
  ```bash
    python3 pdb_oracle_assessment.py \
      --user salesadm \
      --password your_salesadm_password \
      --host localhost \
      --port 1521 \
      --service-name salesdb
  ```
  - --user: The username of the schema you want to assess (e.g., salesadm). This user should have SELECT_CATALOG_ROLE or DBA privileges within the PDB for a comprehensive report.
  - --password: Password for the specified --user.
  - --host: Database host (e.g., localhost).
  - --port: Database listener port (e.g., 1521).
  - --service-name: The service name of the specific PDB you want to assess (e.g., salesdb).

### CDB Assessment (cdb_oracle_assessment.py)
  This script assesses the entire CDB, providing information across all PDBs. You connect as SYSDBA (recommended for full access to CDB_ views).
  ```bash
    python3 cdb_oracle_assessment.py \
      --user SYSDBA \
      --password your_sys_password \
      --host localhost \
      --port 1521 \
      --service-name XE
  ```
  - --user: (Important for filtering) This is used as a filter (:db_user_param) within the SQL queries for sheets like Tables, Views, Privileges etc.
    - If you want to see objects owned by a specific schema (e.g., SALESADM), provide that schema name.
    - If you want to see all user-created objects (from all schemas) across the CDB, you can provide any valid username (e.g., SYS) but the script is configured to list all non-Oracle-maintained objects regardless of the --user filter.
  - --password: Password for the SYS user (or other common user) you connect as. Note: When mode=oracledb.SYSDBA is used in the script, this password is technically not used for authentication if OS authentication is configured, but argparse expects it.
  - --host: Database host (e.g., localhost).
  - --port: Database listener port (e.g., 1521).
  - --service-name: The service name of your CDB Root (e.g., XE for Oracle XE installations, or XECDB if you configured a separate service name for the root).

## 6. Output
    Both scripts will generate an Excel .xlsx file named in the format oracle_assessment_report_<pdb_name_or_cdb_service_name>.xlsx (e.g., oracle_assessment_report_salesdb.xlsx or oracle_cdb_assessment_report_xe.xlsx).

    The Excel file will contain multiple sheets, each representing a different aspect of the database assessment (e.g., "Tablespaces", "Schema_Info", "Tables_and_Columns", etc.).

## 7. Important Notes & Troubleshooting
  - **SYSDBA Connection:** For CDB assessment, connecting as SYSDBA is recommended to get broad access to CDB_ views. Ensure the OS user running the script (oracle user) is part of the dba OS group.
  - **PDB State:** When running the CDB assessment, ensure the PDBs you want to query are OPEN (preferably READ WRITE). v$pdbs will show their state.
  - **Oracle Instant Client & LD_LIBRARY_PATH:** This is crucial. If python-oracledb cannot find the Instant Client libraries, it will fail to connect. Double-check LD_LIBRARY_PATH is set correctly for the user running the script.
  - **Pandas UserWarning:** The UserWarning: pandas only supports SQLAlchemy connectable... can be safely ignored. It's a recommendation, not an error.
  - **Network Proxies:** If your environment uses a proxy server for internet access, ensure it's configured in your shell environment variables (e.g., http_proxy, https_proxy) for pip and curl to work correctly.
  - **Database Privileges:** The database user specified with --user for filtering (or the SYSDBA user for the connection) must have sufficient SELECT privileges on the DBA_ and CDB_ data dictionary views for a complete assessment. Granting SELECT_CATALOG_ROLE to a common user is usually sufficient for most CDB_ views.


## 8. Contribution
Contributions are welcome! If you find bugs or want to add features (e.g., support for specific object types, more detailed reports, different output formats), please feel free to open issues or submit pull requests.