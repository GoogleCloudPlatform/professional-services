import sys
import re
import datetime
import time
import subprocess
import csv
import logging
import os
import json
import random
import string
import tableprint as tp

from google.cloud import bigquery

import init_script
init_script.init_variables()
from init_script import *
from utilities import *
from validations import *
from metrics import write_metrics_to_bigquery
import get_hive_schema

DEBUG_MODE = True
def init():
    global time_format
    time_format=datetime.datetime.now().strftime("%Y_%m_%d_%H_%M_%S")
    global hive_description
    global stage_database
    global stage_table_name
    global columns

    # global time_hive_stage,time_avro_gcs,time_gcs_bq
    global hive_bq_comparison_csv,hive_bq_comparison_table
    global table_format

    # global size
    # global min_size
    # global max_load_jobs
    # global ideal_n_load_jobs

    global is_table_type_supported
    global is_bq_table_created
    global is_intermediate_table_created
    # global is_gcs_data_staged
    global is_table_partitioned
    global is_bq_stage_table_created
    global is_csv_file_created
    global is_csv_file_written
    global is_incremental_col_present
    global is_metatable_created
    global metadata_table_name
    global is_first_run

    metadata_table_name="metadata_"+hive_database+"_"+hive_table_name+"_inc_"
    # time_hive_stage=''
    # time_avro_gcs=''
    # time_gcs_bq=''


    # min_size = 1*1024*1024*1024
    # max_load_jobs = 1000
    # ideal_n_load_jobs = 100
    
    is_first_run=False
    is_bq_table_created=False
    is_intermediate_table_created = False
    # is_gcs_data_staged = False
    is_table_partitioned = False
    is_bq_stage_table_created = False
    is_csv_file_created=False
    is_csv_file_written =False
    is_table_type_supported=False
    is_incremental_col_present=False
    is_metatable_created = False
    hive_bq_comparison_csv = hive_table_name+"_metrics_hive_bq_"+time_format+'.csv'
    hive_bq_comparison_table = hive_table_name+"_metrics_hive_bq_"+time_format
    logging.basicConfig(filename=hive_table_name+"_metrics_hive_bq_"+time_format+'.log',level=logging.DEBUG)

# Decides the split size depending on the source table size
# def calculate_split_size(size):

#     if size < 1*1024*1024*1024:
#         split_size = size
#     elif size < 10*1024*1024*1024:
#         split_size = 1*1024*1024*1024
#     elif size < 50*1024*1024*1024:
#         split_size = 5*1024*1024*1024
#     elif size < 100*1024*1024*1024:
#         split_size = 10*1024*1024*1024
#     elif size < 1*1024*1024*1024*1024:
#         split_size = 50*1024*1024*1024
#     elif size < 10*1024*1024*1024:
#         split_size = 200*1024*1024*1024
#     elif size < 50*1024*1024*1024:
#         split_size = 500*1024*1024*1024
#     elif size < 100*1024*1024*1024:
#         split_size = 1*1024*1024*1024*1024
#     else:
#         split_size = 5*1024*1024*1024*1024
#     return split_size


def delete_on_overwrite():
    """Deletes CloudSQL metadata table and Bigquery table when bq_table_write_mode is set to overwrite"""

    printOutput("Reloading... Deleting metadata table and BQ table...")
    try:
        mysql_cursor.execute("DROP TABLE {}".format(metadata_table_name))
        print("Dropped table %s" % metadata_table_name)
    except Exception as e:
        print("Deleting metadata %s table failed" % metadata_table_name)
 
    try:
        table_ref = bq_client.dataset(dataset_id).table(bq_table)
        bq_client.delete_table(table_ref)  # API request
        print('Bigquery Table {}:{} deleted.'.format(dataset_id, bq_table))
    except Exception as e:
        print(e)
        print("Deleting BQ table {} failed".format(bq_table))

    if check_bq_table_exists() or check_metadata_table_exists():
        exit()



def command_helper():
    print("Use appropriate values for the argument --bq-table-write-mode")
    exit()

def check_bq_write_mode():
    """Validates the bq_table_write_mode provided by user"""
    
    global bq_table
    dataset_ref = bq_client.dataset(dataset_id)
    if bq_table_write_mode == "overwrite":
        delete_on_overwrite()

    elif bq_table_write_mode == "create":
        if is_first_run==False:
            printOutput("Metadata Table {} already exist".format(metadata_table_name))
            command_helper()
        if check_bq_table_exists():
            printOutput("BigQuery Table {} already exist in {} dataset".format(bq_table,dataset_id))
            command_helper()
    
    else:
        if is_first_run==False:
            check_bq_table_exists()
            pass
        else:
            command_helper()
            

def get_hive_table_info(hive_description):
    """Gets information about the source hive table
    
    Arguments:
        hive_description {str} -- Description of the Hive table
    
    Returns:
        str -- schema for the intermediate stage table to be created
        float -- size of the source table
        list -- Names of the columns
        dict -- Names and data types of the columns
        dict -- Names and data types of the partition columns
        list -- Names of the partition columns
    """

    input_format =''
    global is_table_type_supported
    global is_table_partitioned
    global stage_database
    global stage_table_name
    global table_format

    partition_data={}
    partition_columns = []
    for j in range(len(hive_description)):
        if 'PARTITIONED BY' in hive_description[j][0]:
            is_table_partitioned = True
            j+=1
            while 'ROW FORMAT SERDE' not in hive_description[j][0]:
                partition_col = hive_description[j][0].split()[0].replace('`','')
                partition_type = hive_description[j][0].split()[1].lower()
                if partition_type[-1]==',':
                    partition_type = partition_type[:-1]
                if partition_type.count('(') == partition_type.count(')'):
                    pass
                else:
                    partition_type=partition_type[:-1]
                if '<' in partition_type:
                    printOutput("Complex data_type partitoning not supported")
                    exit()
                partition_columns.append(partition_col)
                partition_data[partition_col] = partition_type
                j+=1
            break
    if DEBUG_MODE: print("Partition columns information - "+str(partition_data))

    for j in range(len(hive_description)):
        if hive_description[j][0]=='LOCATION':
            location = hive_description[j+1][0]
            location.replace(' ','')
            location.replace("'",'')
    if DEBUG_MODE: print("Location of the source table - "+location)
    
    column_data = {}
    columns=[]
    for j in range(len(hive_description)):
        if 'CREATE TABLE' in hive_description[j][0]:
            j+=1
            while 'ROW FORMAT SERDE' not in hive_description[j][0]:
                h=hive_description[j][0]
                j+=1
                if 'PARTITIONED BY' in h:
                    pass
                else:
                    col = h.split()[0].replace('`','')
                    col_type = h.split()[1].lower()
                    if col_type[-1]==',':
                        col_type = col_type[:-1]
                    if col_type.count('(') == col_type.count(')'):
                        pass
                    else:
                        col_type=col_type[:-1]
                    columns.append(str(col))
                    column_data[col] = col_type
            break

    if DEBUG_MODE:
        print("List of columns - "+str(columns))
        print("Information about columns - "+str(column_data))

    for j in range(len(hive_description)):           
        if hive_description[j][0]=='STORED AS INPUTFORMAT ':
            input_format=input_format+hive_description[j+1][0]
    input_type=input_format.split("'")[1]
  
    
    if "avro" in input_type.lower():
        # AvroContainerInputFormat
        table_format="AVRO"
        is_table_type_supported = True
    elif "text" in input_type.lower():
        # TextInputFormat
        table_format="AVRO"
    elif "orc" in input_type.lower():
        # OrcInputFormat
        table_format="ORC"
        is_table_type_supported = True
    elif "parquet" in input_type.lower():
        # MapredParquetInputFormat
        table_format="PARQUET"
        is_table_type_supported = True
    else:
        pass

    if is_table_type_supported==False or (is_table_type_supported and is_table_partitioned): 
        stage_database='default'
    else:
        pass
        # stage_database = hive_database
    stage_table_name = hive_table_name.lower()

    if (DEBUG_MODE):
        print("stage table name - {}".format(stage_table_name))

    create_statement=''
    create_statement+="CREATE TABLE default.TABLE_NAME_HERE ("
    create_statement+="\n"
    

    for i in range(len(columns)):
        col=columns[i]
        if i!=len(columns)-1:
            create_statement=create_statement+"{} {},\n".format(col,column_data[col])
        else:
            create_statement=create_statement+"{} {})\n".format(col,column_data[col])
    create_statement=create_statement+"stored as "+table_format

    if DEBUG_MODE:
        print("DDL of stage table")
        printOutput(create_statement)

    if is_table_partitioned:
        os.system("hdfs dfs -du -s -h {} > size.txt".format(location))
        file = open('size.txt','r')
        content=file.readline()
        os.remove('size.txt')
        size=float(content.split(' ')[0])
        if content.split(' ')[1] =='':
            pass
        elif content.split(' ')[1] =='K':
            size= size*1024
        elif content.split(' ')[1] =='M':
            size= size*1024*1024
        elif content.split(' ')[1] =='G':
            size= size*1024*1024*1024
        elif content.split(' ')[1] =='T':
            size= size*1024*1024*1024*1024
        elif content.split(' ')[1] =='P':
            size= size*1024*1024*1024*1024*1024
    else:
        cursor=get_hive_connection()
        results=execute_hive_query("show tblproperties {}.{}('totalSize')".format(hive_database,hive_table_name))
        size = float(results[0][0])

    return create_statement,size,columns,column_data,partition_data,partition_columns

# Creates a Staging table with the provided schema
def create_stage_table(table_name,create_DDL_statement,clause=''):
    """Creates staging table in 'default' hive database
    
    Arguments:
        table_name {str} -- Table name to be created
        create_DDL_statement {str} -- CREATE TABLE statement
    
    Keyword Arguments:
        clause {str} -- where clause in case of partition tables or incremental loading (default: {''})
    """

    global is_intermediate_table_created
    global time_hive_stage
    # check for failed hive query results
    printOutput("Staging for table "+table_name)
    create_DDL_statement=create_DDL_statement.replace("TABLE_NAME_HERE",table_name)
    cursor = get_hive_connection()
    cursor.execute(create_DDL_statement)
    wait_for_cursor(cursor)
    is_intermediate_table_created=True
    printOutput("Table %s created in hive as Avro.Inserting data..." % (table_name))
    time_avro_start = time.time()
    try:
        query="insert overwrite table {} select * from {}.{} {}".format(table_name,hive_database,hive_table_name,clause)
        print(query)
        cursor.execute(query)
        wait_for_cursor(cursor)
    except:
        printOutput("Failed in writing data to %s" % (table_name))
        rollback()
    time_avro_end = time.time()
    time_hive_stage = calculate_time(time_avro_start,time_avro_end)
    printOutput("Loaded data from {} into {} - Time taken - {} ".format(hive_table_name,table_name,time_hive_stage))
    


# Copies Hive data stored at source_location to the target_gcs_location using Hadoop distcp
def copy_hive_data_to_gcs(source_location,target_gcs_location):
    """Copies HDFS file to GCS
    
    Arguments:
        source_location {str} -- HDFS file location
        target_gcs_location {str} -- Destination GCS location
    
    Returns:
        bool -- True if copied successfully, False if not
    """

    # global is_gcs_data_staged
    global time_avro_gcs
    printOutput("Copying data from avro location {} to GCS Staging location {} ....".format(source_location,target_gcs_location))
    time_hadoop_gcs_start = time.time()
    cmd_copy_gcs=['hadoop', 'distcp',source_location,target_gcs_location]

    output = subprocess.call(cmd_copy_gcs)
    time.sleep(2)
    bucket = gcs_client.get_bucket(gcs_bucket_name)
    blob_name = target_gcs_location.split('gs://'+gcs_bucket_name+'/')[1]
    blob = bucket.get_blob(blob_name)
    try:
        blob.name
    except:
        printOutput("Failed Copying data from avro location {} to GCS Staging location {} ....".format(source_location,target_gcs_location))
        return False
    #    rollback()
    time_hadoop_gcs_end = time.time()
    # is_gcs_data_staged=True
    time_avro_gcs = calculate_time(time_hadoop_gcs_start,time_hadoop_gcs_end)
    printOutput("Finished copying data to GCS staging location - Time taken - {} ".format(time_avro_gcs))
    return True

# Extracts information about the GCS data ready to be loaded into BQ from CloudSQL metadata table and starts LOAD JOBS asynchronously
def incrementally_load():
    """Fetches information about files ready to load to Bigquery,creates loading Job,updates job ID & status in metadata table.
    """

    printOutput("Fetching information about files to load to BQ from meta table...")
    query = "SELECT gcs_path FROM {} WHERE gcs_copy='DONE' AND bq_load='TODO'".format(metadata_table_name)
    # handle failed queries
    results = execute_mysql_query(query)
    if len(results)==0: print("No gcs files to load to BQ")
    for row in results:
        gcs_path=row[0]
        bq_job_id = get_random_string()
        load_data_avro_to_bq(bq_table,gcs_path,bq_job_id)
        query = '''UPDATE {} SET bqjobid='{}',bq_load='RUNNING' WHERE gcs_path='{}'
                    '''.format(metadata_table_name,bq_job_id,gcs_path)
        # handle failed transactions
        execute_transaction(query)
        print("Updated BQ load job ID {} status TODO --> RUNNING for filepath {}".format(bq_job_id,gcs_path))


# Extracts information about the HDFS files ready to be copied to GCS from CloudSQL metadata table and starts distcp operations sequentially
def stage_to_gcs():
    """Fetches information about files to be copied to GCS ,copies them sequentially and updates the GCS copy status in CloudSQL metadata table.
    """

    global is_bq_table_created

    printOutput("Fetching information about files to copy to GCS from meta table...")
    results = execute_mysql_query("select table_name,file_path from %s where gcs_copy='TODO'" % (metadata_table_name))
    if len(results)==0: print("No file paths to copy to GCS")
    for row in results:
        table_name = row[0]
        source_location = row[1]
        target_gcs_location = "gs://{}/{}/{}/{}/{}".format(gcs_bucket_name,hive_database,hive_table_name.lower(),table_name,source_location.split('/')[-1])
        if copy_hive_data_to_gcs(source_location,target_gcs_location):
            query = '''UPDATE {} SET gcs_copy='DONE',gcs_path='{}' WHERE file_path='{}'
                    '''.format(metadata_table_name,target_gcs_location,source_location)

            execute_transaction(query)
            print("Updated GCS copy status TODO --> DONE for filepath {}".format(source_location))
            if is_table_partitioned:
                if is_bq_table_created==False:
                    results = execute_mysql_query("select gcs_path from %s where gcs_copy='DONE' limit 1" % (metadata_table_name))
                    create_partition_table(results[0][0])
                    is_bq_table_created=True
            
            incrementally_load()


        else:
            query = '''UPDATE {} SET gcs_copy='TODO' WHERE file_path='{}'
                    '''.format(metadata_table_name,source_location)

            execute_transaction(query)
            print("Updated GCS copy status TODO --> FAILED --> TODO for filepath {}".format(source_location))

def gcs_to_bq():
    global is_bq_table_created
    if is_table_partitioned:
        if is_bq_table_created==False:
            results = execute_mysql_query("select gcs_path from %s where gcs_copy='DONE' limit 1" % (metadata_table_name))
            create_partition_table(results[0][0])
            is_bq_table_created=True
            
    incrementally_load()


def delete_gcs_file(uri):
    """Deletes a blob from the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(gcs_bucket_name)
    blob_name = uri.split('gs://'+gcs_bucket_name+'/')[1]
    blob = bucket.blob(blob_name)
    blob.delete()
    print('File {} deleted.'.format(uri))


def update_bq_job_status():
    """Fetches BQ Job ID's , polls the status and waits until all the jobs finishes."""

    printOutput("Fetching information about BQ load jobs from meta table...")
    results = execute_mysql_query("select gcs_path,bqjobid,retries from %s where bq_load='RUNNING'" % (metadata_table_name))
    if len(results)==0: print("No bq job is in RUNNING state. No values to update")
    while len(results)!=0:
        count=0
        for row in results:
            gcs_path = row[0]
            bq_job_id = row[1]
            retries = int(row[2])
            job = bq_client.get_job(bq_job_id, location=bq_dataset_location)  # API request

            if job.state=='DONE':
                if job.errors==None:
                    query = '''UPDATE {} SET bq_load='DONE' WHERE bqjobid='{}'
                        '''.format(metadata_table_name,bq_job_id)
                    execute_transaction(query)
                    print("Updated BQ load job {} status RUNNING --> DONE".format(bq_job_id))
                    delete_gcs_file(gcs_path)

                elif job.errors!=None:
                    if retries==3:
                        query = '''UPDATE {} SET bq_load='FAILED' WHERE bqjobid='{}'
                            '''.format(metadata_table_name,bq_job_id)   
                        execute_transaction(query)
                        print("BQ Job {} failed.Tried for a maximum of 3 times.Updated status RUNNING --> FAILED".format(bq_job_id))
                    else:
                        query = '''UPDATE {} SET bq_load='TODO',retries={} WHERE bqjobid='{}'
                            '''.format(metadata_table_name,retries+1,bq_job_id)   
                        execute_transaction(query)
                        print("BQ Job {} failed.Updated status RUNNING --> TODO & increased retries count by 1".format(bq_job_id))
                
            elif job.state=='RUNNING':
                count+=1
            else:
                print("job id {} job state {}".format(job.state))
        if count==0:
            print("No bq job is in RUNNING state. No values to update")
            break
        printOutput("Sleeping for 1 min..")
        time.sleep(60)
        printOutput("Fetching information about BQ load jobs from meta table...")
        results = execute_mysql_query("select gcs_path,bqjobid,retries from %s where bq_load='RUNNING'" % (metadata_table_name))


def check_running_jobs():
    """Checks for running BQ load jobs
    
    Returns:
        bool -- True if there is no running job ,False if not
    """

    printOutput("Fetching information about BQ load jobs from meta table...")
    results = execute_mysql_query("select bqjobid from %s where bq_load='RUNNING'" % (metadata_table_name))
    if len(results)==0:
        return True
    return False

# Checks whether the BQ table exists in the BQ dataset
def check_bq_table_exists():
    """Checks whether Bigquery table exist or not
    
    Returns:
        bool -- True if table exist, False if doesn't
    """
    global is_bq_table_created
    dataset_ref = bq_client.dataset(dataset_id)
    table_ref = dataset_ref.table(bq_table)
    try:
        table = bq_client.get_table(table_ref)
        is_bq_table_created=True
        return True
    except Exception as e:
        return False

def delete_bq_table(table_name):
    """Deletes Bigquery Table
    
    Arguments:
        table_name {str} -- Bigquery table name to be deleted
    """

    dataset_ref = bq_client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_name)
    bq_client.delete_table(table_ref)



def get_bq_table_row_count(clause=''):
    """Gets the number of rows in the Bigquery table
    
    Keyword Arguments:
        clause {str} -- where clause in case of partition tables (default: {''})
    
    Returns:
        int -- Row count
    """

    query_job = bq_client.query("select count(*) as n_rows from {0}.{1} {2}".format(dataset_id,bq_table,clause))
    results = query_job.result()  # Waits for job to complete.
    for row in results:
        n_rows = row.n_rows
    return n_rows

def get_hive_table_row_count(clause=''):
    """Gets the number of rows in the Hive source table
    
    Keyword Arguments:
        clause {str} -- where clause in case of partition tables (default: {''})
    
    Returns:
        int -- Row count
    """

    cursor = get_hive_connection()
    cursor.execute("select count(*) from {0}.{1} {2}".format(hive_database,hive_table_name,clause))
    wait_for_cursor(cursor)
    n_rows = cursor.fetchall()[0][0]
    return n_rows

def compare_rows():
    """Compares the number of rows in Hive and Bigquery tables once all the load jobs are finished
    """
    if check_running_jobs():
        hive_table_rows = get_hive_table_row_count()
        bq_table_rows = get_bq_table_row_count()
        print("Bigquery row count %s Hive table row count %s" % (bq_table_rows,hive_table_rows))
        if hive_table_rows == bq_table_rows:
            print("No of rows matching in bigquery and hive tables")
            write_metrics_to_bigquery(hive_bq_comparison_csv,hive_bq_comparison_table)
            results= execute_hive_query("show tables from default")
            for row in results:
                if 'stage__'+stage_table_name+'__' in row[0]:
                    drop_hive_table(row[0])
        else:
            print("No of rows not matching in bigquery and hive tables")
            
            if is_table_partitioned:
                partition_data=show_partitions(hive_database,hive_table_name)
                for data in partition_data:
                    clause=data['clause']
                    bq_table_rows = get_bq_table_row_count(clause)
                    hive_table_rows = get_hive_table_row_count(clause)
                    if bq_table_rows==hive_table_rows:
                        print("No of rows matching in bigquery and hive tables %s " % clause)
                    else:
                        print("No of rows not matching in bigquery and hive tables %s " % clause)
                    print("Bigquery row count %s Hive table row count %s" % (bq_table_rows,hive_table_rows))
                    print("You may want to delete data %s and reload it" % clause)
            
            print("You may want to redo the migration since number of rows are not matching")
    else:
        print("BQ jobs still running...")

def compare_max_values(old_max,new_max):
    """Compares the maximum values of incremental column in previously loaded data and present data
    
    Arguments:
        old_max {str} -- Maximum value in previously loaded data 
        new_max {str} -- Maximum value in present data 
    
    Returns:
        bool -- True if new_max > old_max else False
    """
    
    if incremental_col_type=="timestamp":
        old_max=str(old_max)
        new_max=str(new_max)

        if '.' in old_max:
            old_max = datetime.datetime.strptime(old_max, "%Y-%m-%d %H:%M:%S.%f")
        else:
            old_max = datetime.datetime.strptime(old_max, "%Y-%m-%d %H:%M:%S")
        if '.' in new_max:
            new_max = datetime.datetime.strptime(new_max, "%Y-%m-%d %H:%M:%S.%f")
        else:
            new_max = datetime.datetime.strptime(new_max, "%Y-%m-%d %H:%M:%S")
        
        if new_max > old_max:
            return True
    else:
        if int(new_max) > int(old_max):
            return True

    return False


# Checks for any new data added in source hive table (whose information was not captured in the previous run)
def check_for_new_data():
    """Checks for any new data present in the source hive table
    
    Returns:
        bool -- True if new data found else False
    """

    global metatable_data
    metatable_data=[]
    print("Checking for any new data...")
    if is_table_partitioned==False:
        if is_incremental_col_present==True:
            results = execute_mysql_query("select max(id),max(split_max) from %s" % (metadata_table_name))
            id,old_data_max = results[0]
            results = execute_hive_query("select max({0}) from {1}.{2}".format(incremental_col,hive_database,hive_table_name))
            new_data_max = results[0][0]
            new_data_exists =  compare_max_values(old_data_max,new_data_max)
            if new_data_exists:
                print("New data found in source table")
                print("Previously incremental col {} max value {}.Current max value {}".format(incremental_col,str(old_data_max),str(new_data_max)))
                metatable_data.append({ 'table_name':'stage__'+stage_table_name+'__'+get_random_string(),
                                        'id':id+1,
                                        'split_min':old_data_max,
                                        'split_max':new_data_max,
                                        'clause':"",
                                        })
                return True
            else:
                print("No new data found")
        elif is_incremental_col_present==False and is_table_type_supported==False:
            printOutput("cannot check for new data in case of Non partitioned - No Incremental col - Text format table")
        elif is_incremental_col_present==False and is_table_type_supported == True:

            results = execute_mysql_query("select file_path from %s" % (metadata_table_name))
            old_filepaths = [row[0] for row in results]

            source_location = get_avro_location(hive_database,hive_table_name)
            content = list_hdfs_files(source_location)
            new_filepaths = [content[i].split()[-1] for i in range(1,len(content))]

            new_data_exists=False
            for filepath in new_filepaths:
                if filepath not in old_filepaths:
                    new_data_exists=True
                    printOutput("Found new data at filepath {}".format(filepath))
                    query='''INSERT INTO {0} (table_name,file_path,gcs_copy,bqjobid,retries,bq_load) 
                            VALUES('{1}','{2}','TODO','TODO',0,'TODO')'''.format(metadata_table_name,hive_table_name,filepath)
                    execute_transaction(query)
            if new_data_exists:
                stage_to_gcs()

        return False

    elif is_table_partitioned==True:
        if is_incremental_col_present==False:
            printOutput("Checking for new partitions...")

            results = execute_mysql_query("select distinct(clause) from %s" % (metadata_table_name))
            old_partitions = [row[0] for row in results]

            metatable_data = show_partitions(hive_database,hive_table_name)
            new_partitions = [item['clause'] for item in metatable_data]
            metatable_data = []
            for partition in new_partitions:
                if partition not in old_partitions:
                    printOutput("Found new partition {}".format(partition))
                    metatable_data.append({ 'table_name':'stage__'+stage_table_name+'__'+get_random_string(),
                                            'clause':partition
                                            })

            if len(metatable_data)>0:
                return True
        else:
            table_data = show_partitions(hive_database,hive_table_name)
            metatable_data=[]
            for data in table_data:
                clause=data['clause']
                results = execute_hive_query("select max({0}) from {1}.{2} {3}".format(incremental_col,hive_database,hive_table_name,clause))
                new_data_max = results[0][0]
                results = execute_mysql_query("select max(id),max(split_max) from {0} where clause='{1}'".format(metadata_table_name,clause))
                id,old_data_max=results[0][0]
                new_data_exists =  compare_max_values(old_data_max,new_data_max)
                if new_data_exists:
                    printOutput("New data found in partition {}".format(clause))
                    metatable_data.append({
                        "table_name":'stage__'+stage_table_name+'__'+get_random_string(),
                        "id":id+1,
                        "split_min":old_data_max,
                        "split_max":new_data_max+1,
                        "clause":clause
                        })
                else:
                    printOutput("No New data found in partition {}".format(clause))

            if len(metatable_data)>0:
                return True

        return False

# Continues the migration process from the previous run, if any
def subsequential_run():
    """Continues the migrating process in case of subsequent runs of migrating the same hive table
    """

    printOutput("Metadata table already exist. Continuing from the previous iteration...")
    stage_to_gcs()
    gcs_to_bq()
    update_bq_job_status()
    if check_for_new_data():
        populate_metadata(metatable_data)
        update_bq_job_status()

#
def incrementally_copy():
    create_metadata_table()
    populate_metadata(metatable_data)
    update_bq_job_status()


# Checks if the metadata table already exists on CloudSQL Instance
def check_metadata_table_exists():
    """Checks for metadata table in ClouSQL instance,gets information about incremental column if table exists
    
    Returns:
        bool -- True if table found else False
    """

    global is_incremental_col_present
    global incremental_col
    global metadata_table_name
    global incremental_col_type
    global is_first_run

    tables_tuple = execute_mysql_query("show tables")
    for table_name in tables_tuple:
        if metadata_table_name in table_name[0]:
            metadata_table_name = table_name[0]
            printOutput("metadata table %s exists.Not creating one" % (metadata_table_name))
            if '_inc_T_' in metadata_table_name:
                is_incremental_col_present=True
                if '_inc_T_timestamp_' in metadata_table_name:
                    incremental_col_type="timestamp"
                    incremental_col = metadata_table_name.split('_inc_T_timestamp_')[1]
                else:
                    incremental_col_type="int"
                    incremental_col = metadata_table_name.split('_inc_T_int_')[1]
            return True
    is_first_run=True
    return False

def list_hdfs_files(location):
    """Lists the underlying files at a location
    
    Arguments:
        location {str} -- HDFS location
    
    Returns:
        list -- list of hdfs files
    """

    os.system("hdfs dfs -ls %s > migration_temp_file.txt" % (location))
    with open("migration_temp_file.txt","r") as f:
        content=f.readlines()
    os.remove("migration_temp_file.txt")
    return content

# Creates empty CloudSQL metadata table
def create_metadata_table():
    """Creates metadata table in CloudSQL instance
    """

    global is_metatable_created
    global metadata_table_name
    if is_incremental_col_present:
        metadata_table_name += "T_"+incremental_col_type+"_"+incremental_col
        query='''create table if not exists %s (    id INT, 
                                                    table_name VARCHAR(255),
                                                    split_min VARCHAR(255),
                                                    split_max VARCHAR(255),
                                                    clause VARCHAR(255),
                                                    file_path VARCHAR(255),
                                                    gcs_copy VARCHAR(10),
                                                    gcs_path VARCHAR(255),
                                                    bqjobid VARCHAR(255),
                                                    retries TINYINT,
                                                    bq_load VARCHAR(10)
                                                    )''' % (metadata_table_name)
    else:
        metadata_table_name += "F"
        query='''create table if not exists %s (    table_name VARCHAR(255),
                                                    clause VARCHAR(255),
                                                    file_path VARCHAR(255),
                                                    gcs_copy VARCHAR(10),
                                                    gcs_path VARCHAR(255),
                                                    bqjobid VARCHAR(255),
                                                    retries TINYINT,
                                                    bq_load VARCHAR(10)
                                                    )''' % (metadata_table_name)

    mysql_cursor.execute(query)
    printOutput("Metadata table %s created" % (metadata_table_name))
    is_metatable_created=True

# Populates the metadata table with filepaths and copies to GCS sequentially
def populate_metadata(table_data):
    global is_bq_table_created
    global is_first_insert
    print("Populating metatable..")

    if is_table_partitioned==False:
        if is_first_run==True:
            is_first_insert=True
        table_name=table_data[0]['table_name']
        clause = table_data[0]['clause']
        if is_incremental_col_present:
            id = int(table_data[0]['id'])
            split_min = table_data[0]['split_min']
            split_max = table_data[0]['split_max']
            if id==1:
                io_clause = "where {0}>='{1}' and {0}<='{2}'".format(incremental_col,split_min,split_max)
            else:
                io_clause = "where {0}>'{1}' and {0}<='{2}'".format(incremental_col,split_min,split_max)
      
        if is_table_type_supported==False:
            if is_incremental_col_present:
                create_stage_table(table_name,create_DDL_statement,io_clause)
            else:
                create_stage_table(table_name,create_DDL_statement,clause)
            source_location = get_avro_location("default",table_name)
        else:
            if is_incremental_col_present and is_first_run==False :
                create_stage_table(table_name,create_DDL_statement,io_clause)
                source_location = get_avro_location("default",table_name)
            else:
                source_location = get_avro_location(hive_database,hive_table_name)


        content = list_hdfs_files(source_location)

        printOutput("Updating filepaths in the metadata table..")
        for i in range(1,len(content)):
            if is_incremental_col_present:
                query='''INSERT INTO {0} (id,table_name,split_min,split_max,clause,file_path,gcs_copy,bqjobid,retries,bq_load) 
                            VALUES({1},'{2}','{3}','{4}','{5}','{6}','TODO','TODO',0,'TODO')'''.format(metadata_table_name,id,table_name,split_min,split_max,clause,content[i].split()[-1])
            elif is_incremental_col_present==False:
                query='''INSERT INTO {0} (table_name,clause,file_path,gcs_copy,bqjobid,retries,bq_load) 
                            VALUES('{1}','{2}','{3}','TODO','TODO',0,'TODO')'''.format(metadata_table_name,table_name,clause,content[i].split()[-1])
            execute_transaction(query)

        stage_to_gcs()


    elif is_table_partitioned==True and is_incremental_col_present==False:
        for row in table_data:
            query='''INSERT INTO {0} (table_name,clause,file_path)
                        VALUES('{1}','{2}','TODO')'''.format(metadata_table_name,row['table_name'],row['clause'])
            execute_transaction(query)

            query = "select table_name,clause from %s where file_path='TODO'" % (metadata_table_name)
            results = execute_mysql_query(query)

            for row in results:
                table_name,clause = row
                if is_first_run==True and row==results[0]:
                    is_first_insert=True
                else:
                    is_first_insert=False
                create_stage_table(table_name,create_DDL_statement,clause)
                source_location = get_avro_location("default",table_name)

                content = list_hdfs_files(source_location)

                printOutput("Updating filepaths in the metadata table..")
                for i in range(1,len(content)):
                    query='''INSERT INTO {0} (table_name,clause,file_path,gcs_copy,bqjobid,retries,bq_load) 
                                VALUES('{1}','{2}','{3}','TODO','TODO',0,'TODO')'''.format(metadata_table_name,table_name,clause,content[i].split()[-1])

                    execute_transaction(query)

                query = '''DELETE from {0} where table_name='{1}' and clause ='{2}' and file_path='TODO'
                            '''.format(metadata_table_name,table_name,clause)
                execute_transaction(query)

                    
                stage_to_gcs()
                    
                drop_hive_table(table_name)

    elif is_table_partitioned==True and is_incremental_col_present==True:
        for row in table_data:
            query='''INSERT INTO {0} (id,table_name,split_min,split_max,clause,file_path)
                        VALUES('{1}','{2}','{3}','{4}','{5}','TODO')'''.format(metadata_table_name,row['id'],row['table_name'],row['split_min'],row['split_max'],row['clause'])
            print(query)
            execute_transaction(query)

            query = "select id,table_name,split_min,split_max,clause from %s where file_path='TODO'" % (metadata_table_name)
            results = execute_mysql_query(query)
            for row in results:
                if is_first_run==True and row==results[0]:
                    is_first_insert=True
                else:
                    is_first_insert=False
                id,table_name,split_min,split_max,clause=row
                if id==1:
                    io_clause=clause+" and {0}>='{1}' and {0}<='{2}'".format(incremental_col,split_min,split_max)
                else:
                    io_clause=clause+" and {0}>'{1}' and {0}<='{2}'".format(incremental_col,split_min,split_max)
                create_stage_table(table_name,create_DDL_statement,io_clause)
                source_location = get_avro_location("default",table_name)

                content = list_hdfs_files(source_location)

                printOutput("Updating filepaths in the metadata table..")
                for i in range(1,len(content)):
                    query='''INSERT INTO {0} (id,table_name,split_min,split_max,clause,file_path,gcs_copy,bqjobid,retries,bq_load) 
                                VALUES('{1}','{2}','{3}','{4}','{5}','{6}','TODO','TODO',0,'TODO')'''.format(metadata_table_name,id,table_name,split_min,split_max,clause,content[i].split()[-1])
                    execute_transaction(query)

                query = "DELETE from {0} where table_name='{1}' and clause ='{2}' and file_path='TODO'".format(metadata_table_name,table_name,clause)
                execute_transaction(query)

                    
                stage_to_gcs()

                drop_hive_table(table_name)

def get_random_string():
    """Generates random string of 15 characters
    
    Returns:
        str -- generated random string
    """

    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(15))

def show_partitions(database,table):
    """Gets the information about partitions and forms where clauses in case of a partition table
    
    Arguments:
        database {str} -- hive database name
        table {str} -- hive table name
    
    Returns:
        list -- list of dict elements
    """

    query = "show partitions %s.%s" % (database,table)
    results = execute_hive_query(query)
    partition_list = [str(row[0]) for row in results]
    metatable_data=[]
    for partition in partition_list:
        partition_values = partition.split('/')
        clause="where "
        for i in range(len(partition_columns)):
            value = partition_values[-(len(partition_columns))+i].split(partition_columns[i]+'=')[1]
            clause += partition_columns[i]+'="'+value+'"'
            if i!= len(partition_columns)-1:
                clause+=" and "
        metatable_data.append({ 'table_name':'stage__'+stage_table_name+'__' + get_random_string(),
                                'clause':clause
                                })
    return metatable_data

# Checks for if any incremental integer type columns present in the source table
# Responsible for the whole incremental staging process
def do_staging():

    global metatable_data
    global incremental_col
    global is_incremental_col_present
    global incremental_col_type

    metatable_data=[]

    if is_first_run:
        if is_table_partitioned==False:
            if incremental_col is not None and is_incremental_col_present==False:
                if incremental_col in timestamp_type_col:
                    print("Fetching minimum and maximum values of the timestamp incremental_col...")
                    results = execute_hive_query("select min({}),max({}) from {}.{}".format(incremental_col,incremental_col,hive_database,hive_table_name))
                    col_min,col_max = results[0]
                    is_incremental_col_present=True
                    incremental_col_type = "timestamp"
                    print("Incremental column {} found. Range - {} - {}".format(incremental_col,col_min,col_max))
                elif incremental_col in int_type_col:
                    print("Validating given Incremental column {}...".format(incremental_col))
                    print("Counting the total number of rows...")
                    results = execute_hive_query("select count(*) from {}.{}".format(hive_database,hive_table_name))
                    n_rows = results[0][0]
                    if DEBUG_MODE: print("Number of rows in the table: %d" % (n_rows))

                    print("Fetching maximum value of the incremental_col...")
                    results = execute_hive_query("select count(distinct({})),min({}),max({}) from {}.{}".format(incremental_col,incremental_col,incremental_col,hive_database,hive_table_name))
                    distinct_col_values,col_min,col_max = results[0]
                    if n_rows == distinct_col_values and (1+ col_max - col_min ==n_rows):
                        is_incremental_col_present = True
                        incremental_col_type = "int"
                        print("Incremental column {} found. Range - {} - {}".format(incremental_col,col_min,col_max))

                else:
                    print("Given Incremental column is not present.")
                    exit()
            
            if is_incremental_col_present:
                metatable_data.append({ 'table_name':'stage__'+stage_table_name+'__'+get_random_string(),
                                        'id':1,
                                        'split_min':col_min,
                                        'split_max':col_max,
                                        'clause':""
                                        })
            else:
                metatable_data.append({ 'table_name':'stage__'+stage_table_name+'__'+get_random_string(),
                                        'clause':""
                                        })

        elif is_table_partitioned:
            metatable_data = show_partitions(hive_database,hive_table_name)
            for i in range(len(metatable_data)):
                metatable_data[i]['id']=1
            if incremental_col is not None and is_incremental_col_present==False:
                if incremental_col in timestamp_type_col:
                    print("Fetching minimum and maximum values of the timestamp incremental_col...")
                    for i in range(len(metatable_data)):
                        clause = metatable_data[i]['clause']
                        results = execute_hive_query("select min({0}),max({0}) from {1}.{2} {3}".format(incremental_col,hive_database,hive_table_name,clause))
                        col_min,col_max = results[0]
                        metatable_data[i]['split_min']=col_min
                        metatable_data[i]['split_max']=col_max
                        print("Incremental column {} found in table {}. Range - {} - {}".format(incremental_col,clause,col_min,col_max))


                elif incremental_col in int_type_col:
                    incremental_col_type = "int"
                    n_rows = {}
                    for data in metatable_data:
                        clause = data['clause']
                        print("Counting the number of rows {} ...".format(clause))
                        results = execute_hive_query("select count(*) from {0}.{1} {2}".format(hive_database,hive_table_name,clause))
                        n_rows[clause] = results[0][0]
                        if DEBUG_MODE: print("Number of rows in the table {} : {}".format(clause,str(n_rows[clause])))
                    print(n_rows)
                    for i in range(len(metatable_data)):
                        data =metatable_data[i]
                        clause = data['clause']
                        print("Fetching maximum value of the incremental_col {} ...".format(clause))
                        results = execute_hive_query("select count(distinct({0})),min({0}),max({0}) from {1}.{2} {3}".format(incremental_col,hive_database,hive_table_name,clause))
                        distinct_col_values,col_min,col_max = results[0]
                        if n_rows[clause] == distinct_col_values and (1+ col_max - col_min ==n_rows[clause]):
                            is_incremental_col_present = True
                            metatable_data[i]['split_min']=col_min
                            metatable_data[i]['split_max']=col_max+1
                            print("Incremental column {} found in table {}. Range - {} - {}".format(incremental_col,clause,col_min,col_max))
                        else:
                            is_incremental_col_present = False
                            print("Given incremental col is not a valid incremental column.Try again")
                            break
                        if data == metatable_data[-1] and is_incremental_col_present:
                            print("Incremental column {} found".format(incremental_col))
                else:
                    print("Given Incremental column is not present.")
                    exit()  

            if is_incremental_col_present==False:
                printOutput("paritioned table - no incremental column")
            else:
                printOutput("paritioned table - Incremental column")            
        
        incrementally_copy()
    
    else:
        subsequential_run()
    
    compare_rows()


def load_data_avro_to_bq(bq_table_name,gcs_source_location,job_id):
    """Loads data from GCS to Bigquery table
    
    Arguments:
        bq_table_name {str}         -- Bigquery table name
        gcs_source_location {str}   -- Location of GCS file
        job_id {str}                -- ID of the load Job to be started
    """

    global time_gcs_bq
    dataset_ref = bq_client.dataset(dataset_id)
    job_config = bigquery.LoadJobConfig()
    if table_format =="ORC":
        job_config.source_format = bigquery.SourceFormat.ORC
    elif table_format =="PARQUET":
        job_config.source_format = bigquery.SourceFormat.PARQUET
    else:
        job_config.source_format = bigquery.SourceFormat.AVRO
    

    load_job = bq_client.load_table_from_uri(gcs_source_location,dataset_ref.table(bq_table_name),job_config=job_config,job_id=job_id)
    printOutput('Starting job - Loading data from gcs {} to bigquery - Job ID {}'.format(gcs_source_location,job_id))

    time_gcs_bq_start = time.time()

# Deletes GCS path
def delete_gcs_storage(path):
    os.system("hdfs dfs -rm -r {} >/dev/null".format(path))

# Cleans up the intemrediate tables,csv files,BQ staging table
def cleanup():
    # if is_csv_file_created:
    #     os.remove(hive_bq_comparison_csv)
    #     if DEBUG_MODE: printOutput("csv file cleaned")
    # if is_csv_file_written:
    #     bucket = gcs_client.get_bucket(gcs_bucket_name)
    #     blob = bucket.blob(hive_bq_comparison_csv)
    #     blob.delete()
    #     if DEBUG_MODE: printOutput("GCS csv file {} cleaned".format(hive_bq_comparison_csv))
        
    # if is_intermediate_table_created:
        # drop_hive_table(stage_table_name)
        # if DEBUG_MODE: printOutput("staging table {}.{} cleaned".format("default",stage_table_name))
    # if is_gcs_data_staged:
        # delete_gcs_storage('gs://'+gcs_bucket_name+'/'+stage_table_name)
        # if DEBUG_MODE: printOutput("GCS staging data {} cleaned".format('gs://'+gcs_bucket_name+'/'+stage_table_name))
    if is_bq_stage_table_created:
        delete_bq_table(stage_bq_table)
        if DEBUG_MODE: printOutput("BQ staging table {}.{} cleaned".format(dataset_id,stage_bq_table))


def rollback():
    printOutput("Rolling back...")
    cleanup()
    if is_first_insert:
        mysql_cursor.execute("DROP TABLE {}".format(metadata_table_name))
        print("Dropped the empty metadata table {}".format(metadata_table_name))
    printOutput("Rollback success")
    exit()

def create_partition(partition_col):
    global is_bq_stage_table_created
    global time_gcs_bq
    global stage_bq_table
    stage_bq_table = "stage_"+bq_table+'_'+get_random_string()
    
    if os.system("bq mk --external_table_definition={} {}.{}".format('schema.json',dataset_id,stage_bq_table))==0:
        is_bq_stage_table_created = True
        pass
    else:
        printOutput("BQ stage table {}.{} creation failed".format(dataset_id,stage_bq_table))
        # rollback()
    os.remove('schema.json')

    os.system("bq show --format=prettyjson {}.{} > nonpartition_schema.json".format(dataset_id,stage_bq_table))
    with open('nonpartition_schema.json','rb') as file:
        nonpartition_schema=json.load(file)
    os.remove('nonpartition_schema.json')

    nonpartition_schema = nonpartition_schema['schema']['fields']
    partition_schema = nonpartition_schema
    with open('partition_schema.json','wb') as file:
        file.write(json.dumps(partition_schema))


    
    if use_clustering=="True" and clustering_columns!='':
        cmd = "bq mk --table --schema partition_schema.json --time_partitioning_field {} --clustering_fields {} {}.{}".format(partition_col,clustering_columns,dataset_id,bq_table)
    else:
        cmd = "bq mk --table --schema partition_schema.json --time_partitioning_field {} {}.{}".format(partition_col,dataset_id,bq_table)
    print(cmd)
    if os.system(cmd)==0:
        pass
    else:
        printOutput("BQ table {}.{} not created".format(dataset_id,bq_table))
        exit()
    os.remove('partition_schema.json')
    delete_bq_table(stage_bq_table)

def create_partition_table(gcs_file):

    global clustering_columns
    clustering_col = []
    hive_allowed_cluster_data_types = ['tinyint','smallint','int','bigint','decimal','char','varchar','string','timestamp','date','boolean']
    hive_schema,col_list = get_hive_schema.get_schema(hive_database,hive_table_name)
    print(hive_schema)
    partition_col = ''
    for col in partition_columns:
        if hive_schema[col]=="timestamp" or hive_schema[col]=="date":
            partition_col = col
            break
    for col in partition_columns:
        if col != partition_col and hive_schema[col] in hive_allowed_cluster_data_types:
            clustering_col.append(col)

    clustering_columns = ','.join(clustering_col[i] for i in range(len(clustering_col)) if i<4)

    schema_definition ={"sourceFormat": "AVRO","sourceUris": [gcs_file]} 

    file = open('schema.json','w')
    file.write(str(schema_definition))
    file.close()

    if partition_col=='':
        dataset_ref = bq_client.dataset(dataset_id)
        table_ref = dataset_ref.table(bq_table)
        table = bigquery.Table(table_ref)
        bq_client.create_table(table)
        load_data_avro_to_bq(bq_table,gcs_file,get_random_string())

    else:
        create_partition(partition_col)


try:

    init()
    if validate_resources():
        if DEBUG_MODE: print("All the resources provided are valid")
        pass
    else:
        if DEBUG_MODE: print("Please check the resources provided")
        exit()
    # from validations import *
    from validations import gcs_bucket_location,bq_dataset_location
    
    check_metadata_table_exists()
    check_bq_write_mode()
    
    hive_description = get_description(hive_database,hive_table_name)          
    create_DDL_statement,size,columns,column_data,partition_data,partition_columns = get_hive_table_info(hive_description)



    global int_type_col,timestamp_type_col
    int_type_col = []
    timestamp_type_col = []
    
    for item in columns:
        if item in partition_columns:
            pass
        else:
            if column_data[item] == "tinyint" or column_data[item] == "smallint" or column_data[item] == "int" or column_data[item] == "bigint":
                int_type_col.append(item)
            elif column_data[item] == "timestamp":
                timestamp_type_col.append(item)
            else:
                pass

    if DEBUG_MODE:
        print("Integer type columns - "+str(int_type_col))
        print("timestamp type columns - "+str(timestamp_type_col))
    print(is_first_run)
    do_staging()

    cleanup()
    exit()
except Exception as e:
    logging.exception(e)
    print(str(e))
    print("Complete logs can be found in the file {}".format(hive_table_name+"_metrics_hive_bq_"+time_format+'.log'))
    # rollback()
