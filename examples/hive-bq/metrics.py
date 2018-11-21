import csv,os
from google.cloud import bigquery

import get_hive_schema,get_bq_schema
# Imports required variables from Initialization script
from init_script import *
# Imports required functions from the Utilities script
from utilities import *

def get_metrics_table_schema():
    """Creates schema for the Bigquery comparison metrics table
    
    Returns:
        list -- list of google.cloud.bigquery.schema.SchemaField objects
    """
    schema = [
        bigquery.SchemaField('operation', 'STRING', mode='REQUIRED',description='operation'),
        bigquery.SchemaField('table_name', 'STRING', mode='REQUIRED',description='Table name'),
        bigquery.SchemaField('Column_count', 'STRING', mode='REQUIRED',description='Number of columns'),
    ]
    for col in columns_list:
        schema.append(bigquery.SchemaField(str(col), 'STRING', mode='REQUIRED'))
    return schema

def create_bq_metrics_table(hive_bq_comparison_table):
    """Creates Bigquery comparison metrics table
    
    Arguments:
        hive_bq_comparison_table {str} -- Bigquery table name to be created
    """

    dataset_ref = bq_client.dataset(dataset_id)
    table_ref = dataset_ref.table(hive_bq_comparison_table)
    table = bigquery.Table(table_ref, schema=get_metrics_table_schema())
    table = bq_client.create_table(table)

# Reads the validation rules to a variable
def read_validations():
    """Reads the validation rules
    
    Returns:
        list -- Validation rules list
    """

    global validations_list
    file=open('validations.csv','rb')
    reader=csv.reader(file)
    validations_list = [row for row in reader]
    return validations_list

def analyze_bq_table(dataset_id,bq_table_name,schema):
    """Gets metadata about the bigquery table
    
    Arguments:
        dataset_id {str} -- Bigquery dataset id
        bq_table_name {str} -- Bigquery table name
        schema {dict} -- Schema of the BQ table
    
    Returns:
        dict -- Bigquery Table metadata
    """

    table_analysis={}
    dataset_ref =bq_client.dataset(dataset_id)
    table_ref = dataset_ref.table(bq_table_name)
    table = bq_client.get_table(table_ref)
    table_analysis['operation']="BQ"
    table_analysis['table_name']=bq_table_name
    table_analysis['num_cols']=str(len(table.schema))
    table_analysis['schema']=schema
    # for col in columns_list:
    # for key,value in schema.iteritems():
        # table_analysis[str(col)]=str(schema[col])
    return table_analysis

# Analyzes HIVE table for metrics
def analyze_hive_table(database,table_name,schema):
    """Gets metadata about the Hive table
    
    Arguments:
        database {str} -- Hive database name
        table_name {str} -- Hive table name
        schema {dict} -- Schema of the Hive table
    
    Returns:
        dict -- Hive table metadata
    """

    num_cols=0
    table_description = get_description(database,table_name)
    for j in range(len(table_description)):
        if table_description[j][0]=='LOCATION':
            location=table_description[j+1][0]
    for i in table_description:
        if i[0]=='ROW FORMAT SERDE ':
            break
        if 'CREATE TABLE' in i[0] or 'PARTITIONED BY' in i[0]:
            pass
        else:
            num_cols+=1
    table_analysis={}
    table_analysis['operation']="HIVE"
    table_analysis['table_name']=table_name
    table_analysis['num_cols']=str(num_cols)
    table_analysis['schema']=schema
    return table_analysis

# Inserts comparison data to a CSV file
def append_row_to_metrics_table(row_data):
    """Writes comparison metrics data to csv file
    
    Arguments:
        row_data {dict} -- Metadata to write
    """

    global is_csv_file_created
    data=[row_data['operation'],row_data['table_name'],row_data['num_cols']]
    for item in columns_list:
        data.append(row_data['schema'][item])
    with open(hive_bq_comparison_csv, 'a+') as csvFile:
        writer = csv.writer(csvFile)
        print(data)
        writer.writerow(data)
    csvFile.close()
    is_csv_file_created = True



def do_health_checks(hive_table_analysis,bq_table_analysis,schema):
    """Populates the Health checks values from the comparison
    
    Arguments:
        hive_table_analysis {dict} -- Hive table metadata
        bq_table_analysis {dict} -- Bigquery table metadata
        schema {dict} -- Bigquery schema
    
    Returns:
        dict -- Health checks
    """

    healths={
    "operation":"Health Check",
    "table_name":"NA",
    "num_cols":"Fail",
    "schema":schema
    }
    if (hive_table_analysis['num_cols']==bq_table_analysis['num_cols']):
        healths["num_cols"]="Pass"

    for item in columns_list:
        if 'array_' in hive_table_analysis['schema'][item]:
            hive_table_analysis['schema'][item] = '_'.join(hive_table_analysis['schema'][item].split('_')[-2:])
        
        
        if ([hive_table_analysis['schema'][item],bq_table_analysis['schema'][item]] in validations_list):
            healths['schema'][str(item)]="Pass"
        else:
            healths['schema'][str(item)]="Fail"
    return healths

def write_csv_to_gcs(filename):
    """Writes comparison csv to GCS bucket
    
    Arguments:
        filename {str} -- Comparison metrics csv filename
    
    Returns:
        str -- GCS URI of filepath
    """

    bucket=gcs_client.get_bucket(gcs_bucket_name)
    blob = bucket.blob(filename)
    blob.upload_from_filename(filename)
    uri = 'gs://'+gcs_bucket_name+'/'+filename
    return uri

def delete_blob(blob_name):
    """Deletes file from GCS bucket
    
    Arguments:
        blob_name {str} -- GCS blob name to be deleted
    """

    storage_client = storage.Client()
    bucket = storage_client.get_bucket(gcs_bucket_name)
    blob = bucket.blob(blob_name)
    blob.delete()
    print('File {} deleted.'.format(blob_name))

# Loads CSV metrics data to BQ comparison table
def load_csv_to_bigquery(csv_uri,bq_table_name):
    """Loads metrics CSV data to BQ comparison table
    
    Arguments:
        csv_uri {str} -- GCS URI of the metrics file
        bq_table_name {str} -- BQ comparison metrics table name
    """

    dataset_ref = bq_client.dataset(dataset_id)
    job_config = bigquery.LoadJobConfig()
    job_config.schema = get_metrics_table_schema()
    job_config.source_format = bigquery.SourceFormat.CSV

    load_job = bq_client.load_table_from_uri(csv_uri,dataset_ref.table(bq_table_name),job_config=job_config)
    printOutput('Loading metrics data to BigQuery... Job {}'.format(load_job.job_id))

    load_job.result()

    destination_table = bq_client.get_table(dataset_ref.table(bq_table_name))
    printOutput('Loaded {} rows in metrics table'.format(destination_table.num_rows))
    printOutput('Migrated data successfully from hive to BigQuery')
    printOutput('Comparison metrics of tables available in BQ table '+bq_table_name)

# Main function for creating the comparison metrics table
def write_metrics_to_bigquery(csv_name,table_name):
    """Main function to be called to write comparison metrics to Bigquery"""

    global is_csv_file_written
    global is_csv_file_created
    global columns_list
    global hive_bq_comparison_csv,hive_bq_comparison_table
    hive_bq_comparison_csv=csv_name
    hive_bq_comparison_table = table_name

    printOutput("Analyzing the hive and BQ tables...")

    bq_schema = get_bq_schema.get_schema(dataset_id,bq_table)
    # print(bq_schema)

    hive_schema,columns_list = get_hive_schema.get_schema(hive_database,hive_table_name)
    # print(hive_schema)
    # print(columns_list)

    hive_table_analysis = analyze_hive_table(hive_database,hive_table_name,hive_schema)
    # print(hive_table_analysis)
    append_row_to_metrics_table(hive_table_analysis)
    is_csv_file_created = True
    bq_table_analysis=analyze_bq_table(dataset_id,bq_table,bq_schema)
    # print(bq_table_analysis)
    append_row_to_metrics_table(bq_table_analysis)

    validations_list = read_validations()
    healths=do_health_checks(hive_table_analysis,bq_table_analysis,bq_schema)
    # print(healths)
    append_row_to_metrics_table(healths)

    create_bq_metrics_table(hive_bq_comparison_table)
    # print(bq_table_analysis)

    csv_uri = write_csv_to_gcs(hive_bq_comparison_csv)
    is_csv_file_written = True

    load_csv_to_bigquery(csv_uri,hive_bq_comparison_table)
    os.remove(hive_bq_comparison_csv)
    delete_blob(hive_bq_comparison_csv)
