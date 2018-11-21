# Imports required variables from Initialization script
# from init_script import hive_database,hive_table_name,gcs_bucket_name,dataset_id,bq_client,gcs_client
from init_script import *
# Imports required functions from the Utilities script
from utilities import *

# Checks if the hive database exists
def check_hive_database_exists(database_name):
    """Checks if hive database exists or not
    
    Arguments:
        database_name {str} -- Hive database name
    
    Returns:
        bool -- True if exists else False
    """

    # cursor=hive_conn()
    # try:
    #     cursor.execute("describe database  {}".format(database_name))
    #     wait_for_cursor(cursor)
    #     if cursor.fetchall():
    #         return True
    # except Exception as e:
    #     print(str(e))

    # return False

    results=execute_hive_query("show databases")
    for name in results:
        if database_name in name:
            return True
    return False

# Checks if the hive table exists
def check_hive_table_exists(database_name,table_name):
    """Checks if hive table exists or not
    
    Arguments:
        database_name {str} -- Hive database name
        table_name {str} -- Hive table name
    
    Returns:
        bool -- True if exists else False
    """

    cursor=get_hive_connection()
    try:   
        cursor.execute("desc {}.{}".format(database_name,table_name))
        wait_for_cursor(cursor)
        if cursor.fetchall():
            return True
    except Exception as e:
        print(str(e))

    return False

def check_gcs_bucket_exists(bucket_name):
    """Checks if the GCS bucket exists or not
    
    Arguments:
        bucket_name {str} -- GCS Bucket name
    
    Returns:
        bool -- True if exists else False
    """

    try:
        bucket=gcs_client.get_bucket(bucket_name)
        if bucket: 
            pass  
        return True
    except Exception as e:
        print(str(e))
        return False

def check_bq_dataset_exists(dataset_id):
    """Checks if the BQ dataset exists or not
    
    Arguments:
        dataset_id {str} -- Bigquery dataset id
    
    Returns:
        bool -- True if exists else False
    """

    dataset_ref = bq_client.dataset(dataset_id)
    try:
        dataset = bq_client.get_dataset(dataset_ref)
        return True
    except Exception as e:
        print(str(e))
        return False

def get_dataset_location(bq_dataset_id):
    """Returns the location of BQ dataset
    
    Arguments:
        bq_dataset_id {str} -- Bigquery dataset id
    
    Returns:
        str -- location of the BQ dataset
    """

    dataset_ref = bq_client.dataset(bq_dataset_id)
    dataset = bq_client.get_dataset(dataset_ref)
    return dataset.location

def get_gcs_bucket_location(gcs_bucket_name):
    """Returns the location of GCS bucket
    
    Arguments:
        gcs_bucket_name {str} -- GCS bucket name
    
    Returns:
        str -- GCS Bucket location
    """

    bucket=gcs_client.get_bucket(gcs_bucket_name)
    return bucket.location

def compare_locations(bq_dataset_location,gcs_bucket_location):
    """Compares the locations of BQ dataset and GCS bucket
    
    Arguments:
        bq_dataset_location {str} -- BQ dataset location
        gcs_bucket_location {str} -- GCS Bucket location
    
    Returns:
        bool -- True if matches else False
    """

    if bq_dataset_location==gcs_bucket_location:
        return True
    else:
        return False

def validate_resources():
    """Validates the user provided resources exists
    
    Returns:
        bool -- True if all the resources exists else False
    """

    global gcs_bucket_location
    global bq_dataset_location

    if check_hive_database_exists(hive_database):
        printOutput("Hive database {} found".format(hive_database))
    else:
        printOutput("Hive database {} doesn't exist".format(hive_database))
        return False

    if check_hive_table_exists(hive_database,hive_table_name):
        printOutput("Hive table {} found".format(hive_table_name))
    else:
        printOutput("Hive table {} doesn't exist".format(hive_table_name))
        return False

    if check_gcs_bucket_exists(gcs_bucket_name):
        printOutput("GCS Bucket {} found".format(gcs_bucket_name))
    else:
        printOutput("GCS Bucket {} doesn't exist".format(gcs_bucket_name))
        return False

    if check_bq_dataset_exists(dataset_id):
        printOutput("BigQuery dataset {} found".format(dataset_id))
    else:
        printOutput("BigQuery dataset {} doesn't exist".format(dataset_id))
        return False

    bq_dataset_location = get_dataset_location(dataset_id)
    gcs_bucket_location = get_gcs_bucket_location(gcs_bucket_name)

    if compare_locations(bq_dataset_location,gcs_bucket_location):
        printOutput("Dataset location {} and GCS Bucket location {} matches".format(bq_dataset_location,gcs_bucket_location))
    else:
        printOutput("Dataset location {} and GCS Bucket location {} do not match\nVisit https://cloud.google.com/bigquery/docs/dataset-locations#data-locations for more info".format(bq_dataset_location,gcs_bucket_location))
        return False

    return True
