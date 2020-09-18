#!/usr/bin/env python
# coding: utf-8

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



# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

# You need to install cx_Oracle:
# pip3 install cx_oracle
# ############################################################
# Mac Users: If you get "xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun" error run:
# sudo xcode-select --install
# or
# sudo xcode-select --reset
# ###########################################################
# In macOS, You might see the following error :
# sqlalchemy.exc.DatabaseError: (cx_Oracle.DatabaseError) ORA-21561: OID generation failed
# This is caused by the macOS hostname under “sharing” not matching the name in /etc/hosts
# Run hostname to get the name of the mac :
# Synerty-256:build-web jchesney$ hostname
# syn256.local
# Confirm that it matches the hostnames for 127.0.0.1 and ::1 in /etc/hosts :
# Synerty-256:build-web jchesney$ cat /etc/hosts
# ##
# # Host Database
# #
# # localhost is used to configure the loopback interface
# # when the system is booting.  Do not change this entry.
# ##
# 127.0.0.1       localhost syn256.local
# 255.255.255.255 broadcasthost
# ::1             localhost syn256.local
####################################################################

import cx_Oracle
import json
import argparse
import sys
import logging
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
import click

logging.basicConfig(format='%(asctime)s %(levelname)s:%(message)s',
                    datefmt='%d/%m/%Y %H:%M:%S',
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


def generate_terraform_table_variable(table_names={}):
    file_loader = FileSystemLoader('.')
    env = Environment(loader=file_loader)
    template = env.get_template('terraform_table_variable.jinja2')
    return template.render(table_names=table_names)


@click.command(name="Schema Generator")
@click.option(
    '--oracle_connection_string',
    "-c",
    required=False,
    default="",
    type=str,
    help=
    "Oracle connection string example: 'db_username/db_password@hostname_or_IP/service_name'"
)
@click.option(
    "--dsn-file",
    required=False,
    type=click.File("r"),
    help=
    "DSN file to provide instead of the conenction string. especially if you have to provide SID. Fill the example dsn.txt"
)
@click.option(
    "--username",
    "-u",
    type=str,
    help=
    "username to connect. required if you use DSN format. In connection string version it is embedded inside the connection string"
)
@click.option(
    "--password",
    "-p",
    type=str,
    help=
    "password. required if you use DSN format. In connection string version it is embedded inside the connection string"
)
@click.option(
    "--table-schema",
    "-s",
    type=str,
    help=
    "Schema name which contains the tables or use %% as like pattern for multiple schemas ex:HR"
)
@click.option(
    "--table-name",
    "-t",
    type=str,
    help=
    "Exact table name, comma separated list of tables or use %% as like pattern for multiple tables. Use %% for all tables. Can be exact or like ex: D%%"
)
@click.option(
    "--schema-output-dir",
    "-o",
    type=click.Path(exists=True),
    help="Output directory to place JSON formatted BigQuery schema files")
@click.option(
    "--terraform-tfvar",
    "-tf",
    type=click.File("w"),
    default="terraform.tfvars",
    show_default=True,
    help=
    "terraform variable file to write the generated table variables. Cleans the file before assing parameters."
)
def main(oracle_connection_string, dsn_file, username, password, table_schema,
         table_name, schema_output_dir, terraform_tfvar):
    """Generates BigQuery JSON schema files for terraform from Oracle tables

    Usage:\n
    First install the dependencies with pipenv:
    $ pipenv install\n
    $ pipenv shell\n


    Then to see parameter options:\n
    $ python ora2bq_convert.py --help

    Example commands if you use connection string: \n
    $ python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s HR -t D% -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars \n
    $ python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s H% -t % -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars  \n
    $ python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s % -t % -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars \n
    $ python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s HR -t "DEPARTMENTS,TEST,REGIONS,JOBS" -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tf

    Example commands if you use dsn file: \n
    $ python ora2bq_convert.py --dsn-file dsn.txt -u db_username -p db_password -s HR -t D% -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars \n
    """

    json_out_path = Path(schema_output_dir)
    table_names = {}

    if oracle_connection_string == "":
        con = cx_Oracle.connect(username, password, dsn_file.read())
    else:
        con = cx_Oracle.connect(oracle_connection_string)
    # You need to use username that has access to all_tab_columns ex for grant; "grant select on ALL_TAB_COLUMNS to hr"
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
                if row[6] == None or int(row[6]) > 0:  # this is a decimal number so type is NUMERIC. if no scale is provided (row[6] == None), then oracle assigns the default largest scale. 
                    data_type = f"{data_type}(x,y)"
                else:  # this is an integer, since the scale does not exist or it is below 0
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
        with open(f'{file_path.absolute()}.json', 'w') as outfile:
            json.dump(schema, outfile, indent=4)
        table_names[table_name] = f'CHANGE_ME/{file_path.name}.json'

    cur.close()
    con.close()
    rendered_variable = generate_terraform_table_variable(table_names)
    click.echo(rendered_variable, terraform_tfvar)


if __name__ == '__main__':
    main()
