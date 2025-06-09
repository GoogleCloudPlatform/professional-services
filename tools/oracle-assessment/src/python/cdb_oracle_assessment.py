import oracledb
import pandas as pd
import sys
import os
import argparse

# --- 1. Configure Oracle Instant Client ---
try:
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


# --- 2. SQL Queries for Each Section (Now targeting CDB views for all user objects) ---
# Removed :db_user_param from queries for comprehensive listing, added explicit owner exclusion
SQL_QUERIES = {
    "CDB_Info": """
        SELECT
            name AS "CDB Name",
            (SELECT banner FROM v$version WHERE banner LIKE 'Oracle Database%') AS "Database Version",
            (SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_CHARACTERSET') AS "DB Character Set",
            (SELECT value FROM nls_database_parameters WHERE parameter = 'NLS_NCHAR_CHARACTERSET') AS "DB National Character Set",
            SYS_CONTEXT('userenv', 'con_name') AS "Current Container"
        FROM v$database
    """,
    "PDBs_Overview": """
        SELECT
            con_id AS "PDB ID",
            name AS "PDB Name",
            open_mode AS "Open Mode",
            TO_CHAR(creation_time, 'YYYY-MM-DD HH24:MI:SS') AS "Creation Time",
            TO_CHAR(create_scn) AS "Creation SCN"
        FROM v$pdbs
        ORDER BY con_id
    """,
    "Tablespaces_CDB": """
        SELECT
            p.name AS "PDB Name",
            df.tablespace_name AS "Tablespace Name",
            ROUND(SUM(df.bytes) / (1024 * 1024), 2) AS "Total MB",
            ROUND(SUM(CASE WHEN fs.bytes IS NULL THEN df.bytes ELSE (df.bytes - fs.bytes) END) / (1024 * 1024), 2) AS "Used MB",
            ROUND(SUM(fs.bytes) / (1024 * 1024), 2) AS "Free MB",
            ts.extent_management AS "Extent Management",
            ts.allocation_type AS "Allocation Type",
            df.con_id AS "CON_ID"
        FROM cdb_data_files df
        JOIN cdb_tablespaces ts ON df.tablespace_name = ts.tablespace_name AND df.con_id = ts.con_id
        LEFT JOIN (SELECT file_id, SUM(bytes) bytes, con_id FROM cdb_free_space GROUP BY file_id, con_id) fs
            ON df.file_id = fs.file_id AND df.con_id = fs.con_id
        JOIN v$pdbs p ON df.con_id = p.con_id
        WHERE p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        GROUP BY p.name, df.tablespace_name, ts.extent_management, ts.allocation_type, df.con_id
        ORDER BY p.name, df.tablespace_name
    """,
    "Schema_Info_CDB": """
        SELECT
            p.name AS "PDB Name",
            u.username AS "Username",
            u.account_status AS "Account Status",
            TO_CHAR(u.created, 'YYYY-MM-DD HH24:MI:SS') AS "Created",
            u.default_tablespace AS "Default Tablespace",
            u.temporary_tablespace AS "Temporary Tablespace",
            u.con_id AS "CON_ID"
        FROM cdb_users u
        JOIN v$pdbs p ON u.con_id = p.con_id
        WHERE u.oracle_maintained = 'N'
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, u.username
    """,
    "Tables_and_Columns_CDB": """
        SELECT
            p.name AS "PDB Name",
            t.table_name AS "Table Name",
            t.owner AS "Owner",
            t.tablespace_name AS "Tablespace",
            t.num_rows AS "Estimated Rows",
            c.column_name AS "Column Name",
            c.data_type AS "Data Type",
            c.data_length AS "Data Length",
            c.data_precision AS "Data Precision",
            c.data_scale AS "Data Scale",
            c.nullable AS "Nullable",
            t.con_id AS "CON_ID"
        FROM cdb_tables t
        JOIN cdb_tab_columns c ON t.owner = c.owner AND t.table_name = c.table_name AND t.con_id = c.con_id
        JOIN v$pdbs p ON t.con_id = p.con_id
        WHERE t.owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, t.table_name, c.column_id
    """,
    "Constraints_CDB": """
        SELECT
            p.name AS "PDB Name",
            c.table_name AS "Table Name",
            c.owner AS "Owner",
            c.constraint_name AS "Constraint Name",
            c.constraint_type AS "Constraint Type",
            LISTAGG(cc.column_name, ', ') WITHIN GROUP (ORDER BY cc.position) AS "Columns",
            c.con_id AS "CON_ID"
        FROM cdb_constraints c
        JOIN cdb_cons_columns cc ON c.owner = cc.owner AND c.constraint_name = cc.constraint_name
                                  AND c.table_name = cc.table_name AND c.con_id = cc.con_id
        JOIN v$pdbs p ON c.con_id = p.con_id
        WHERE c.owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        GROUP BY p.name, c.table_name, c.owner, c.constraint_name, c.constraint_type, c.con_id
        ORDER BY p.name, c.table_name, c.constraint_type, c.constraint_name
    """,
    "Indexes_CDB": """
        SELECT
            p.name AS "PDB Name",
            ai.table_name AS "Table Name",
            ai.owner AS "Owner",
            ai.index_name AS "Index Name",
            ai.uniqueness AS "Uniqueness",
            ai.tablespace_name AS "Tablespace",
            LISTAGG(aic.column_name, ', ') WITHIN GROUP (ORDER BY aic.column_position) AS "Indexed Columns",
            ai.con_id AS "CON_ID"
        FROM cdb_indexes ai
        JOIN cdb_ind_columns aic ON ai.owner = aic.index_owner AND ai.index_name = aic.index_name AND ai.con_id = aic.con_id
        JOIN v$pdbs p ON ai.con_id = p.con_id
        WHERE ai.owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        GROUP BY p.name, ai.owner, ai.table_name, ai.index_name, ai.uniqueness, ai.tablespace_name, ai.con_id
        ORDER BY p.name, ai.table_name, ai.index_name
    """,
    "Views_CDB": """
        SELECT
            p.name AS "PDB Name",
            view_name AS "View Name",
            owner AS "Owner",
            -- TEXT column removed due to persistent ORA-00904 / LONG datatype issues in XE
            p.con_id AS "CON_ID"
        FROM cdb_views
        JOIN v$pdbs p ON cdb_views.con_id = p.con_id
        WHERE owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, view_name
    """,
    "Sequences_CDB": """
        SELECT
            p.name AS "PDB Name",
            sequence_name AS "Sequence Name",
            sequence_owner AS "Owner",
            increment_by AS "Increment By",
            max_value AS "Max Value",
            cycle_flag AS "Cycle Flag",
            order_flag AS "Order Flag",
            p.con_id AS "CON_ID"
        FROM cdb_sequences
        JOIN v$pdbs p ON cdb_sequences.con_id = p.con_id
        WHERE sequence_owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, sequence_name
    """,
    "PL_SQL_Objects_CDB": """
        SELECT
            p.name AS "PDB Name",
            object_name AS "Object Name",
            object_type AS "Object Type",
            owner AS "Owner",
            TO_CHAR(created, 'YYYY-MM-DD HH24:MI:SS') AS "Created",
            status AS "Status",
            p.con_id AS "CON_ID"
        FROM cdb_objects
        JOIN v$pdbs p ON cdb_objects.con_id = p.con_id
        WHERE owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND object_type IN ('PROCEDURE', 'FUNCTION', 'PACKAGE', 'PACKAGE BODY', 'TYPE', 'TYPE BODY')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, object_type, object_name
    """,
    "Roles_CDB": """
        SELECT
            p.name AS "PDB Name",
            role AS "Role Name",
            common AS "Common Role",
            p.con_id AS "CON_ID"
        FROM cdb_roles
        JOIN v$pdbs p ON cdb_roles.con_id = p.con_id
        WHERE p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, role
    """,
    # Role_System_Privs_CDB and Role_Granted_Roles_CDB are removed due to persistent ORA-00942
    "User_System_Privs_CDB": """
        SELECT
            p.name AS "PDB Name",
            grantee AS "User",
            privilege AS "System Privilege",
            admin_option AS "Admin Option",
            cs.con_id AS "CON_ID"
        FROM cdb_sys_privs cs
        JOIN v$pdbs p ON cs.con_id = p.con_id
        WHERE p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
          AND grantee NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
        ORDER BY p.name, grantee, privilege
    """,
    "User_Role_Privs_CDB": """
        SELECT
            p.name AS "PDB Name",
            grantee AS "User",
            granted_role AS "Granted Role",
            admin_option AS "Admin Option",
            delegate_option AS "Delegate Option",
            cr.con_id AS "CON_ID"
        FROM cdb_role_privs cr
        JOIN v$pdbs p ON cr.con_id = p.con_id
        WHERE p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
          AND grantee NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
        ORDER BY p.name, grantee, granted_role
    """,
    "User_Table_Privs_CDB": """
        SELECT
            p.name AS "PDB Name",
            grantee AS "User",
            owner AS "Table Owner",
            table_name AS "Table Name",
            privilege AS "Privilege",
            grantable AS "Grantable",
            ct.con_id AS "CON_ID"
        FROM cdb_tab_privs ct
        JOIN v$pdbs p ON ct.con_id = p.con_id
        WHERE p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
          AND grantee NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
        ORDER BY p.name, grantee, table_name, privilege
    """,
    "Database_Links_CDB": """
        SELECT
            p.name AS "PDB Name",
            owner AS "Owner",
            db_link AS "DB Link Name",
            host AS "Host",
            username AS "Username",
            cdl.con_id AS "CON_ID"
        FROM cdb_db_links cdl
        JOIN v$pdbs p ON cdl.con_id = p.con_id
        WHERE cdl.owner NOT IN ('SYS', 'SYSTEM', 'OUTLN', 'DBSNMP', 'XDB', 'APEX_PUBLIC_USER', 'APEX_040200', 'GSMADMIN_INTERNAL')
          AND p.name NOT IN ('PDB$SEED', 'CDB$ROOT')
        ORDER BY p.name, owner, db_link
    """
}


def run_assessment(db_user, db_password, db_host, db_port, db_service_name):
    # Excel output file name - NOW DYNAMICALLY INCLUDES CDB service name
    EXCEL_OUTPUT_FILE = f"oracle_cdb_assessment_report_{db_service_name.lower()}.xlsx"

    connection = None
    try:
        # Establish connection to CDB Root
        dsn = f"{db_host}:{db_port}/{db_service_name}"
        print(f"Attempting to connect to CDB: {dsn} as SYSDBA")
        
        # Define outputtypehandler for LONG and CLOB columns
        def output_type_handler(cursor, metadata):
            if metadata.type_code == oracledb.DB_TYPE_LONG:
                return cursor.var(oracledb.DB_TYPE_VARCHAR, 32767, arraysize=cursor.arraysize)
            if metadata.type_code == oracledb.DB_TYPE_CLOB:
                return cursor.var(oracledb.DB_TYPE_CLOB, arraysize=cursor.arraysize)
            return None

        connection = oracledb.connect(dsn=dsn, mode=oracledb.SYSDBA)
        connection.outputtypehandler = output_type_handler
        
        print("Successfully connected to Oracle CDB.")

        # Create a Pandas Excel writer object
        with pd.ExcelWriter(EXCEL_OUTPUT_FILE, engine='openpyxl') as writer:
            for sheet_name, query in SQL_QUERIES.items():
                print(f"Fetching data for sheet: {sheet_name}...")
                try:
                    query_params = {}
                    # Only pass db_user_param if the query actually uses it
                    # Ensure db_user is not None before calling .upper() for the bind variable
                    if ':db_user_param' in query:
                        if db_user is not None:
                            query_params = {'db_user_param': db_user.upper()}
                        else:
                            # If --user is not provided for a query that needs it, warn and skip
                            print(f"Warning: Sheet '{sheet_name}' requires --user argument (for filtering), but none was provided. Skipping query.", file=sys.stderr)
                            # Assign an empty DataFrame to avoid errors later for this sheet
                            df = pd.DataFrame([{"Warning": "User argument not provided for this filtered sheet."}])
                            df.to_excel(writer, sheet_name=sheet_name, index=False)
                            continue 

                    df = pd.read_sql(query, connection, params=query_params)
                    
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    print(f"Data for '{sheet_name}' written successfully.")
                except pd.io.sql.DatabaseError as db_err:
                    print(f"Error fetching data for sheet '{sheet_name}': {db_err}", file=sys.stderr)
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
             print(f"Database not open: {error_obj.message}. Ensure your CDB service '{db_service_name}' is available and PDBs are open (READ WRITE) if needed.", file=sys.stderr)
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
    parser.add_argument("--user", required=False, help="Database username (e.g., SALESADM, or common user like C##ADMIN if connecting as SYSDBA for filtering).")
    parser.add_argument("--password", required=False, help="Database password (not used when connecting as SYSDBA, but required by some tools).")
    parser.add_argument("--host", default="localhost", help="Database host (default: localhost).")
    parser.add_argument("--port", default="1521", help="Database port (default: 1521).")
    parser.add_argument("--service-name", required=True, help="CDB Root service name (e.g., XE or XECDB for XE instances).")

    args = parser.parse_args()

    run_assessment(args.user, args.password, args.host, args.port, args.service_name)