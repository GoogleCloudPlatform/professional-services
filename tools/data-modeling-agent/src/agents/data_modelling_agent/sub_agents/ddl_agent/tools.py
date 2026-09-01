import os

from google.adk.tools.tool_context import ToolContext

from .utils.bq import cleanup_ddl, create_bigquery_dataset, execute_bq_ddl, validate_ddl


def ddl_execution(tool_context: ToolContext):
    project_id = tool_context.state["project_id"]
    dataset_id = tool_context.state.get("dataset_id", None)
    if not dataset_id:
        return {
            'status': 'error',
            'detail': 'Please provide dataset_id where the table needs to be created.',
        } 
    dataset_to_be_deleted = tool_context.state["dataset_to_be_deleted"]
    error = create_bigquery_dataset(project_id, dataset_id, dataset_to_be_deleted)
    if error:
        return error
    ddl = tool_context.state["ddl"]
    cleaned_ddl = cleanup_ddl(ddl, project_id, dataset_id)
    tool_context.state["ddl"] = ddl
    is_valid_ddl = validate_ddl(cleaned_ddl)
    if is_valid_ddl:
        return execute_bq_ddl(cleaned_ddl)
    return is_valid_ddl


def execute_raw_ddl(sql_statement: str) -> dict:
    """Executes valid BigQuery DDL or ALTER statements.
    Automatically checks if table or column descriptions already exist in BigQuery and skips redundant ALTER commands to preserve BigQuery quota.

    Args:
        sql_statement (str): The SQL DDL or ALTER statement(s) to execute in BigQuery.

    Returns:
        dict: Execution status and details.
    """
    import re

    from google.cloud import bigquery

    cleaned_sql = sql_statement.replace("```sql", "").replace("```", "").strip()
    raw_statements = [s.strip() for s in cleaned_sql.split(";") if s.strip()]
    
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    client = bigquery.Client(project=project_id) if project_id else bigquery.Client()
    
    statements_to_run = []
    skipped_count = 0
    
    for stmt in raw_statements:
        # Check if statement is setting a table description: ALTER TABLE `proj.ds.tbl` SET OPTIONS (description=...)
        tbl_desc_match = re.search(r"ALTER\s+TABLE\s+[`\"']?([^`\"'\s;]+)[`\"']?\s+SET\s+OPTIONS\s*\(\s*description\s*=", stmt, re.IGNORECASE)
        # Check if statement is setting a column description: ALTER TABLE `proj.ds.tbl` ALTER COLUMN `col` SET OPTIONS (description=...)
        col_desc_match = re.search(r"ALTER\s+TABLE\s+[`\"']?([^`\"'\s;]+)[`\"']?\s+ALTER\s+COLUMN\s+[`\"']?([^`\"'\s;]+)[`\"']?\s+SET\s+OPTIONS\s*\(\s*description\s*=", stmt, re.IGNORECASE)
        
        if col_desc_match:
            full_table = col_desc_match.group(1).replace("`", "").replace("'", "").replace('"', "")
            col_name = col_desc_match.group(2).replace("`", "").replace("'", "").replace('"', "")
            parts = full_table.split(".")
            ds_name = parts[-2] if len(parts) >= 2 else os.getenv("BQ_DATASET_ID", "default_dataset")
            tbl_name = parts[-1]
            try:
                check_q = f"""
                SELECT description FROM `{project_id}.{ds_name}.INFORMATION_SCHEMA.COLUMN_FIELD_PATHS`
                WHERE table_name = '{tbl_name}' AND column_name = '{col_name}'
                LIMIT 1
                """
                res = list(client.query(check_q).result())
                if res and res[0]["description"] and str(res[0]["description"]).strip():
                    skipped_count += 1
                    continue
            except Exception:
                pass
        elif tbl_desc_match:
            full_table = tbl_desc_match.group(1).replace("`", "").replace("'", "").replace('"', "")
            parts = full_table.split(".")
            ds_name = parts[-2] if len(parts) >= 2 else os.getenv("BQ_DATASET_ID", "default_dataset")
            tbl_name = parts[-1]
            try:
                check_q = f"""
                SELECT option_value FROM `{project_id}.{ds_name}.INFORMATION_SCHEMA.TABLE_OPTIONS`
                WHERE table_name = '{tbl_name}' AND option_name = 'description'
                LIMIT 1
                """
                res = list(client.query(check_q).result())
                if res and res[0]["option_value"] and str(res[0]["option_value"]).strip():
                    skipped_count += 1
                    continue
            except Exception:
                pass
        
        statements_to_run.append(stmt)

    if not statements_to_run:
        return {
            "status": "success",
            "message": f"All requested descriptions already exist in BigQuery ({skipped_count} ALTER commands skipped to prevent quota errors)."
        }

    final_sql = ";\n".join(statements_to_run) + ";"
    if len(statements_to_run) > 1 and not final_sql.upper().startswith("BEGIN"):
        final_sql = f"BEGIN\n{final_sql}\nEND;"

    is_valid = validate_ddl(final_sql)
    if not is_valid:
        return {
            "status": "error",
            "message": "DDL/ALTER statement failed validation. Please check syntax.",
        }
    success = execute_bq_ddl(final_sql)
    if success:
        msg = f"Executed {len(statements_to_run)} DDL/ALTER statement(s) successfully in BigQuery."
        if skipped_count > 0:
            msg += f" ({skipped_count} existing description ALTER commands skipped to preserve quota.)"
        return {"status": "success", "message": msg}
    else:
        return {
            "status": "error",
            "message": "Failed to execute DDL/ALTER statements in BigQuery.",
        }


def inspect_live_bigquery_tables(dataset_ids: list[str] = [], project_id: str = "", tool_context: ToolContext = None) -> dict:
    """Inspects live BigQuery tables and columns directly from BigQuery INFORMATION_SCHEMA across specified datasets.
    Use this to immediately inspect source tables, column names, and data types in BigQuery for any provided datasets.
    
    Args:
        dataset_ids (list): List of BigQuery dataset IDs to inspect. If empty, inspects default demo datasets.
        project_id (str): Google Cloud Project ID. If empty, uses GOOGLE_CLOUD_PROJECT env.
    
    Returns:
        dict: Table names and column definitions for each dataset.
    """
    import json

    from google.cloud import bigquery
    if not project_id:
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    if not dataset_ids:
        default_ds = os.getenv("BQ_DATASET_ID")
        if default_ds:
            dataset_ids = [default_ds]
        else:
            return {"status": "error", "message": "No dataset_ids provided. Please specify dataset_ids to inspect or set BQ_DATASET_ID in your environment."}

    client = bigquery.Client(project=project_id) if project_id else bigquery.Client()
    result = {}
    for ds in dataset_ids:
        query = f"""
        SELECT table_name, column_name, data_type
        FROM `{project_id}.{ds}.INFORMATION_SCHEMA.COLUMNS`
        ORDER BY table_name, ordinal_position
        """
        try:
            query_job = client.query(query)
            rows = list(query_job.result())
            tables = {}
            for row in rows:
                t_name = row["table_name"]
                if t_name not in tables:
                    tables[t_name] = []
                tables[t_name].append({
                    "column_name": row["column_name"],
                    "data_type": row["data_type"]
                })
            result[ds] = tables
        except Exception as e:
            result[ds] = f"Error inspecting {ds}: {e!s}"
    
    if tool_context and hasattr(tool_context, "state"):
        tool_context.state["source_search_result"] = json.dumps(result, indent=2)
    return result
