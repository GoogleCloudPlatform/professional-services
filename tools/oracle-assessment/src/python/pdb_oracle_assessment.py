import oracledb
import pandas as pd
import sys
import os
import argparse

# --- 1. Configure Oracle Instant Client ---
try:
    # ADJUSTED PATH to your ACTUAL Instant Client installation directory
    instant_client_dir = "/opt/oracle/instantclient_21_12" # <--- CONFIRMED AND ADJUSTED PATH
    if os.path.exists(instant_client_dir):
        oracledb.init_oracle_client(lib_dir=instant_client_dir)
        print(f"Oracle Instant Client initialized from: {instant_client_dir}")
    else:
        print(f"Warning: Oracle Instant Client path '{instant_client_dir}' does not exist. "
              "Ensure it's correctly set or in your system PATH/LD_LIBRARY_PATH.", file=sys.stderr)
except oracledb.Error as e:
    print(f"Error initializing Oracle Instant Client: {e}. "
          "Ensure Instant Client is correctly installed and configured.", file=sys.stderr)


# --- 2. SQL Queries for Each Section ---
SQL_QUERIES = {
    "Database_Info": """
        SELECT
            (SELECT name FROM v$database) AS "Database Name",
            (SELECT banner FROM v$version WHERE banner LIKE 'Oracle Database%') AS "Database Version",
            (SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_CHARACTERSET') AS "DB Character Set",
            (SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_NCHAR_CHARACTERSET') AS "DB National Character Set",
            SYS_CONTEXT('userenv', 'con_name') AS "PDB Name",
            :db_user_param AS "Schema to Assess"
        FROM DUAL
    """,
    "Tablespaces": """
        SELECT
            df.tablespace_name AS "Tablespace Name",
            ROUND(SUM(df.bytes) / (1024 * 1024), 2) AS "Total MB",
            ROUND(SUM(CASE WHEN fs.bytes IS NULL THEN df.bytes ELSE (df.bytes - fs.bytes) END) / (1024 * 1024), 2) AS "Used MB",
            ROUND(SUM(fs.bytes) / (1024 * 1024), 2) AS "Free MB",
            ts.extent_management AS "Extent Management",
            ts.allocation_type AS "Allocation Type"
        FROM dba_data_files df
        JOIN dba_tablespaces ts ON df.tablespace_name = ts.tablespace_name
        LEFT JOIN (SELECT file_id, SUM(bytes) bytes FROM dba_free_space GROUP BY file_id) fs ON df.file_id = fs.file_id
        WHERE df.tablespace_name IN ('SALES_DATA')
        GROUP BY df.tablespace_name, ts.extent_management, ts.allocation_type
        ORDER BY df.tablespace_name
    """,
    "Schema_Info": """
        SELECT
            username AS "Username",
            account_status AS "Account Status",
            TO_CHAR(created, 'YYYY-MM-DD HH24:MI:SS') AS "Created",
            default_tablespace AS "Default Tablespace",
            temporary_tablespace AS "Temporary Tablespace"
        FROM dba_users
        WHERE username = :db_user_param
    """,
    "Tables_and_Columns": """
        SELECT
            t.table_name AS "Table Name",
            t.tablespace_name AS "Tablespace",
            t.num_rows AS "Estimated Rows",
            c.column_name AS "Column Name",
            c.data_type AS "Data Type",
            c.data_length AS "Data Length",
            c.data_precision AS "Data Precision",
            c.data_scale AS "Data Scale",
            c.nullable AS "Nullable"
        FROM all_tables t
        JOIN all_tab_columns c ON t.owner = c.owner AND t.table_name = c.table_name
        WHERE t.owner = :db_user_param
        ORDER BY t.table_name, c.column_id
    """,
    "Constraints": """
        SELECT
            c.table_name AS "Table Name",
            c.constraint_name AS "Constraint Name",
            c.constraint_type AS "Constraint Type",
            LISTAGG(cc.column_name, ', ') WITHIN GROUP (ORDER BY cc.position) AS "Columns"
        FROM all_constraints c
        JOIN all_cons_columns cc ON c.owner = cc.owner AND c.constraint_name = cc.constraint_name
                                  AND c.table_name = cc.table_name
        WHERE c.owner = :db_user_param
        GROUP BY c.table_name, c.constraint_name, c.constraint_type
        ORDER BY c.table_name, c.constraint_type, c.constraint_name
    """,
    "Indexes": """
        SELECT
            ai.table_name AS "Table Name",
            ai.index_name AS "Index Name",
            ai.uniqueness AS "Uniqueness",
            ai.tablespace_name AS "Tablespace",
            LISTAGG(aic.column_name, ', ') WITHIN GROUP (ORDER BY aic.column_position) AS "Indexed Columns"
        FROM all_indexes ai
        JOIN all_ind_columns aic ON ai.owner = aic.index_owner AND ai.index_name = aic.index_name
        WHERE ai.owner = :db_user_param
        GROUP BY ai.owner, ai.table_name, ai.index_name, ai.uniqueness, ai.tablespace_name
        ORDER BY ai.table_name, ai.index_name
    """,
    "Views": """
        SELECT
            view_name AS "View Name",
            text AS "View Text Snippet" -- Simplified: Let outputtypehandler handle LONG to LOB
        FROM all_views
        WHERE owner = :db_user_param
        ORDER BY view_name
    """,
    "Sequences": """
        SELECT
            sequence_name AS "Sequence Name",
            increment_by AS "Increment By",
            max_value AS "Max Value",
            cycle_flag AS "Cycle Flag",
            order_flag AS "Order Flag"
        FROM all_sequences
        WHERE sequence_owner = :db_user_param
        ORDER BY sequence_name
    """,
    "PL_SQL_Objects": """
        SELECT
            object_name AS "Object Name",
            object_type AS "Object Type",
            TO_CHAR(created, 'YYYY-MM-DD HH24:MI:SS') AS "Created",
            status AS "Status"
        FROM all_objects
        WHERE owner = :db_user_param
          AND object_type IN ('PROCEDURE', 'FUNCTION', 'PACKAGE', 'PACKAGE BODY', 'TYPE', 'TYPE BODY')
        ORDER BY object_type, object_name
    """,
    "Roles": """
        SELECT role AS "Role Name", common AS "Common Role"
        FROM dba_roles
        ORDER BY role
    """,
    "Role_System_Privs": """
        SELECT
            role AS "Role Name",
            privilege AS "System Privilege",
            admin_option AS "Admin Option"
        FROM role_sys_privs
        ORDER BY role, privilege
    """,
    "Role_Granted_Roles": """
        SELECT
            role AS "Role Name",
            granted_role AS "Granted Role",
            admin_option AS "Admin Option"
        FROM role_role_privs
        ORDER BY role, granted_role
    """,
    "User_System_Privs": """
        SELECT
            grantee AS "User",
            privilege AS "System Privilege",
            admin_option AS "Admin Option"
        FROM dba_sys_privs
        WHERE grantee = :db_user_param
        ORDER BY grantee, privilege
    """,
    "User_Role_Privs": """
        SELECT
            grantee AS "User",
            granted_role AS "Granted Role",
            admin_option AS "Admin Option",
            delegate_option AS "Delegate Option"
        FROM dba_role_privs
        WHERE grantee = :db_user_param
        ORDER BY grantee, granted_role
    """,
    "User_Table_Privs": """
        SELECT
            grantee AS "User",
            owner AS "Table Owner",
            table_name AS "Table Name",
            privilege AS "Privilege",
            grantable AS "Grantable"
        FROM dba_tab_privs
        WHERE grantee = :db_user_param
        ORDER BY grantee, table_name, privilege
    """,
    "Database_Links": """
        SELECT
            owner AS "Owner",
            db_link AS "DB Link Name",
            host AS "Host",
            username AS "Username"
        FROM all_db_links
        WHERE owner = :db_user_param OR owner IN (SELECT username FROM dba_users WHERE oracle_maintained = 'N')
        ORDER BY owner, db_link
    """
}


def run_assessment(db_user, db_password, db_host, db_port, db_service_name):
    connection = None
    try:
        # Establish connection
        dsn = f"{db_host}:{db_port}/{db_service_name}"
        print(f"Attempting to connect to: {dsn} as {db_user}")
        # --- 1. Excel output file name ---
        EXCEL_OUTPUT_FILE = f"oracle_{db_service_name.lower()}_assessment_report.xlsx"
        
        # Define outputtypehandler for LONG and CLOB columns
        def output_type_handler(cursor, metadata):
            if metadata.type_code == oracledb.DB_TYPE_LONG:
                # Fetch LONG as a VARCHAR with a large size to avoid DPY-4007
                return cursor.var(oracledb.DB_TYPE_VARCHAR, 32767, arraysize=cursor.arraysize)
            if metadata.type_code == oracledb.DB_TYPE_CLOB:
                # Fetch CLOBs as CLOB objects, pandas will handle conversion to string
                return cursor.var(oracledb.DB_TYPE_CLOB, arraysize=cursor.arraysize)
            return None # Use default handling for other types

        connection = oracledb.connect(user=db_user, password=db_password, dsn=dsn)
        connection.outputtypehandler = output_type_handler # Assign the handler to the connection
        
        print("Successfully connected to Oracle Database.")

        # Create a Pandas Excel writer object
        with pd.ExcelWriter(EXCEL_OUTPUT_FILE, engine='openpyxl') as writer:
            for sheet_name, query in SQL_QUERIES.items():
                print(f"Fetching data for sheet: {sheet_name}...")
                try:
                    query_params = {}
                    # Only pass db_user_param if the query actually uses it
                    # Note: db_user is converted to uppercase in Python for Oracle's case-insensitivity
                    if ':db_user_param' in query:
                        query_params = {'db_user_param': db_user.upper()}

                    df = pd.read_sql(query, connection, params=query_params)
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    print(f"Data for '{sheet_name}' written successfully.")
                except pd.io.sql.DatabaseError as db_err:
                    print(f"Error fetching data for sheet '{sheet_name}': {db_err}", file=sys.stderr)
                    # Create an empty DataFrame with an error message as a fallback
                    error_df = pd.DataFrame([{"Error": str(db_err), "Query": query}])
                    error_df.to_excel(writer, sheet_name=sheet_name + "_ERROR", index=False)
                except Exception as e:
                    print(f"An unexpected error occurred for sheet '{sheet_name}': {e}", file=sys.stderr)
                    error_df = pd.DataFrame([{"Error": str(e), "Query": query}])
                    error_df.to_excel(writer, sheet_name=sheet_name + "_ERROR", index=False)

        print(f"\nAssessment report successfully generated at: {EXCEL_OUTPUT_FILE}")

    except oracledb.Error as e:
        error_obj = e.args[0]
        if error_obj.code == 1017:
            print(f"Authentication failed: {error_obj.message}. Check DB_USER and DB_PASSWORD.", file=sys.stderr)
        elif error_obj.code == 12154:
            print(f"TNS:could not resolve the connect identifier specified: {error_obj.message}. Check DB_HOST, DB_PORT, DB_SERVICE_NAME.", file=sys.stderr)
        elif error_obj.code == 1109:
             print(f"Database not open: {error_obj.message}. Ensure your PDB '{db_service_name}' is open (READ WRITE).", file=sys.stderr)
        else:
            print(f"Oracle database error: {error_obj.code} - {error_obj.message}", file=sys.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
    finally:
        if connection:
            connection.close()
            print("Database connection closed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate an Oracle Database assessment report to an Excel file.")
    parser.add_argument("--user", required=True, help="Database username.")
    parser.add_argument("--password", required=True, help="Database password.")
    parser.add_argument("--host", default="localhost", help="Database host (default: localhost).")
    parser.add_argument("--port", default="1521", help="Database port (default: 1521).")
    parser.add_argument("--service-name", required=True, help="Database service name (PDB name).")

    args = parser.parse_args()

    run_assessment(args.user, args.password, args.host, args.port, args.service_name)