# Copyright 2020 Google LLC.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Authors: yunusd@google.com, sametkaradag@google.com
"""Generates BigQuery JSON schema files for terraform from Oracle tables."""

import argparse
import json
import logging
import pathlib
import sys
import cx_Oracle
import jinja2

Path = pathlib.Path
Environment = jinja2.Environment
FileSystemLoader = jinja2.FileSystemLoader

logging.basicConfig(format="%(asctime)s %(levelname)s:%(message)s",
                    datefmt="%d/%m/%Y %H:%M:%S",
                    level=logging.INFO)

nullable_map = {"Y": "NULLABLE", "N": "REQUIRED"}
data_type_map = {
    "VARCHAR2": "STRING",
    "CHAR": "STRING",
    "CLOB": "STRING",
    "NVARCHAR2": "STRING",
    "NCHAR": "STRING",
    "NCLOB": "STRING",
    "BFILE": "STRING",
    "ROWID": "STRING",
    "INTEGER": "INTEGER",
    "SHORTINTEGER": "INTEGER",
    "LONGINTEGER": "INTEGER",
    "FLOAT": "NUMERIC",
    "BINARY_DOUBLE": "NUMERIC",
    "BINARY_FLOAT": "NUMERIC",
    "NUMBER(x)":
        "INTEGER",  # checkout the logic below, you may want to change it
    "NUMBER(x,y)": "NUMERIC",
    "NUMBER(x,-y)": "INTEGER",
    "DATE": "DATE",
    "TIMESTAMP(0)": "TIMESTAMP",
    "TIMESTAMP(1) WITH TIME ZONE": "TIMESTAMP",
    "TIMESTAMP(3)": "TIMESTAMP",
    "TIMESTAMP(3) WITH TIME ZONE": "TIMESTAMP",
    "TIMESTAMP(6)": "TIMESTAMP",
    "TIMESTAMP(6) WITH TIME ZONE": "TIMESTAMP",
    "TIMESTAMP(9)": "TIMESTAMP",
    "TIMESTAMP(9) WITH TIME ZONE": "TIMESTAMP",
    "INTERVAL DAY(0) TO SECOND(0)": "STRING",
    "INTERVAL DAY(3) TO SECOND(0)": "STRING",
    "INTERVAL DAY(3) TO SECOND(2)": "STRING",
    "INTERVAL DAY(5) TO SECOND(1)": "STRING",
    "INTERVAL DAY(9) TO SECOND(0)": "STRING",
    "INTERVAL DAY(9) TO SECOND(6)": "STRING",
    "INTERVAL DAY(9) TO SECOND(9)": "STRING",
    "RAW": "BYTES",
    "LONG RAW": "BYTES",
    "BLOB": "BYTES",
    "LONG": "BYTES"
}


def generate_terraform_table_variable(table_names):
    if table_names is None:
        table_names = {}
    file_loader = FileSystemLoader(".")
    env = Environment(loader=file_loader)
    template = env.get_template("terraform_table_variable.jinja2")
    return template.render(table_names=table_names)


def parse_args(args):
    """Parses arguments."""
    parser = argparse.ArgumentParser(
        description=
        "convert oracle schema to bigquery schema to be consumed by terraform",
        prog="schema converter")
    parser.add_argument(
        "-c",
        "--oracle_connection_string",
        required=False,
        help=
        "Oracle connection string example: db_username/db_password@hostname_or_IP/service_name"
    )
    parser.add_argument(
        "--dsn_file",
        required=False,
        help=
        """DSN file to provide instead of the conenction string. especially if you have to provide SID.
        Fill the example dsn.txt""")
    parser.add_argument(
        "-s",
        "--table_schema",
        required=True,
        help=
        "Schema name which contains the tables or use %% as like pattern for multiple schemas ex:HR"
    )
    parser.add_argument(
        "-t",
        "--table_name",
        required=True,
        help=
        "Exact table name or use %% as like pattern for multiple tables. Use %% for all tables. Can be exact or like ex: D%%"
    )
    parser.add_argument(
        "-o",
        "--schema_output_dir",
        required=False,
        default="./",
        help="Output directory to place JSON formatted BigQuery schema files")
    parser.add_argument(
        "-u",
        "--username",
        required=False,
        help=
        "username to connect. required if you use DSN format. In connection string version it is embedded inside the connection string"
    )
    parser.add_argument(
        "-p",
        "--password",
        required=False,
        help=
        "password. required if you use DSN format. In connection string version it is embedded inside the connection string"
    )
    parser.add_argument(
        "-tf",
        "--terraform_tfvar",
        required=False,
        default="terraform.tfvars",
        help=
        "terraform variable file to write the generated table variables. Cleans the file before assing parameters."
    )
    return parser.parse_args(args)


def main(oracle_connection_string, dsn_file, username, password, table_schema,
         table_name, schema_output_dir, terraform_tfvar):
    """Generates BigQuery JSON schema files for terraform from Oracle tables.

    Args:
      oracle_connection_string: Connection string for Oracle. Example -
        'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME'
      dsn_file: DSN file to provide instead of the conenction string. especially
        if you have to provide SID. Fill the example dsn.txt
      username: Username to connect to Oracle Database. required if you use DSN
        format. In connection string version it is embedded inside the connection
        string
      password: Password. required if you use DSN format. In connection string
        version it is embedded inside the connection string
      table_schema: Schema name which contains the tables or
        use %% as like pattern for multiple schemas ex:HR
      table_name: Exact table name, comma separated list of tables or use %% as
        like pattern for multiple tables.
        Use %% for all tables. Can be exact or like ex: D%%
      schema_output_dir: Output directory to place JSON formatted BigQuery schema
        files
      terraform_tfvar: terraform variable file to write the generated table
        variables. Cleans the file before assing parameters.
    """

    json_out_path = Path(schema_output_dir)
    table_names = {}

    if not oracle_connection_string:
        con = cx_Oracle.connect(username, password, dsn_file.read())
    else:
        con = cx_Oracle.connect(oracle_connection_string)
    # You need to use username that has access to all_tab_columns
    # ex for grant; "grant select on ALL_TAB_COLUMNS to hr"
    cur = con.cursor()

    if "," in table_name:
        table_list = [i.strip() for i in table_name.split(",")]
        bind_names = [":" + str(i + 1) for i in range(len(table_list))]
        full_bind_list = [table_schema] + table_list
        sql = """select
                    OWNER,TABLE_NAME  
                    from all_tables 
                    where owner like :table_schema""" + \
                " and (table_name in (%s) ) order by owner, table_name" % (",".join(bind_names))
        cur.execute(sql, full_bind_list)
    else:
        sql = """select
                    OWNER,TABLE_NAME  
                    from all_tables 
                    where owner like :table_schema
                        and (table_name like :table_name ) 
                    order by owner, table_name
            """
        cur.execute(sql, [table_schema, table_name])
        # You can modify the below query to add schema or table name patterns

    for table in cur:
        print(f"{table[0]}.{table[1]}")
        table_name = table[1]
        owner = table[0]
        cur_col = con.cursor()
        sql = """select
                        TABLE_NAME, COLUMN_NAME, DATA_TYPE, DATA_LENGTH, NULLABLE, DATA_DEFAULT, DATA_SCALE 
                        from all_tab_columns 
                        where owner =:owner_name
                        and table_name = :table_name  
                        order by owner, table_name,COLUMN_ID asc
            """
        cur_col.execute(sql, [owner, table_name])
        schema = []
        for row in cur_col:
            data_type = row[2]
            if data_type == "NUMBER":
                if row[6] is None or int(row[6]) > 0:
                    # this is a decimal number so type is NUMERIC.
                    # if no scale is provided (row[6] == None),
                    # then oracle assigns the default largest scale.
                    data_type = f"{data_type}(x,y)"
                else:  # this is an integer,
                    # since the scale does not exist or it is below 0
                    data_type = f"{data_type}(x)"

            print(f"\t{row}\t--\tguessed type: {data_type_map[data_type]}")

            schema.append({
                "description": row[1],
                "mode": nullable_map[row[4]],
                "name": row[1],
                "type": data_type_map[data_type]
            })
        cur_col.close()
        file_path = json_out_path / table_name
        with open(f"{file_path.absolute()}.json", "w") as outfile:
            json.dump(schema, outfile, indent=4)
        table_names[table_name] = f"CHANGE_ME/{file_path.name}.json"

    cur.close()
    con.close()
    rendered_variable = generate_terraform_table_variable(table_names)
    # click.echo(rendered_variable, terraform_tfvar)
    if terraform_tfvar == "tf_table.tfvars":
        tfvar_path = json_out_path / "tf_table.tfvars"
    else:
        tfvar_path = terraform_tfvar
    with open(tfvar_path, "w") as outfile:
        outfile.write(rendered_variable)


if __name__ == "__main__":
    namespace = parse_args(sys.argv[1:])
    main(namespace.oracle_connection_string, namespace.dsn_file,
         namespace.username, namespace.password, namespace.table_schema,
         namespace.table_name, namespace.schema_output_dir,
         namespace.terraform_tfvar)
