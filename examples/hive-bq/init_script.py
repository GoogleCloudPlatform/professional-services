import argparse
from google.cloud import storage
from google.cloud import bigquery
import pymysql

# Argument Parser
def arg_pars():    
# python hive2bq.py \
# --hive-database default \
# --hive-table text_nonpartitioned \
# --project roderickyao-sandbox \
# --bq-dataset-id migration_demo \
# --gcs-bucket hive-migration  \
# --bq-table-write-mode create \
# --incremental-col int_column
    parser = argparse.ArgumentParser()
    parser.add_argument('--hive-database',required=True)
    parser.add_argument('--hive-table',required=True)
    parser.add_argument('--project-id',required=True)
    parser.add_argument('--bq-dataset-id' ,required=True)
    parser.add_argument('--bq-table',required=False,default="")
    parser.add_argument('--bq-table-write-mode',required=True,default="create",choices=['overwrite','create','append'])
    parser.add_argument('--gcs-bucket-name',required=True)
    parser.add_argument('--incremental-col',required=False)
    parser.add_argument('--use-clustering',required=False,default="False",choices=["False","True"])
    parser.add_argument('--mysql-ip',required=True)
    parser.add_argument('--mysql-password',required=True)
    # parser.add_argument('--cloudsql-ip',required=False)

    return parser.parse_args()

# Variable Initialization
def init_variables():

    global hive_table_name
    global hive_database
    global project_id
    global dataset_id 
    global bq_table
    global bq_table_write_mode
    global gcs_bucket_name

    global bq_client
    global gcs_client

    global mysql_connection
    global mysql_cursor
    global incremental_col
    global use_clustering

    args=arg_pars()

    hive_database = args.hive_database
    hive_table_name = args.hive_table
    project_id = args.project_id
    dataset_id = args.bq_dataset_id
    bq_table=args.bq_table
    bq_table_write_mode=args.bq_table_write_mode.lower()
    gcs_bucket_name = args.gcs_bucket_name
    incremental_col=args.incremental_col
    use_clustering = args.use_clustering
    mysql_ip = args.mysql_ip
    mysql_password = args.mysql_password

    bq_client = bigquery.Client(project=project_id)
    gcs_client = storage.Client(project=project_id)

    if bq_table == '':
        bq_table=hive_table_name

    try:
        mysql_connection = pymysql.connect(host=mysql_ip,user='root',password=mysql_password,db='metadata',port=3306)
    except Exception as e:
        print(e)
        print("Please check the provided IP and password for the MySQL connection")
        exit()
    mysql_cursor=mysql_connection.cursor()
