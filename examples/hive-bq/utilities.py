from pyhive import hive
from TCLIService.ttypes import TOperationState
import tableprint as tp
import logging

from init_script import *

def calculate_time(start,end):
    time_taken = int(round((end - start),0))
    day = time_taken//86400
    hour = (time_taken - (day*86400))//3600
    minutes = (time_taken - ((day*86400) + (hour*3600)))//60
    seconds = time_taken - ((day*86400) + (hour*3600) + (minutes*60))
    if day != 0:
        return ('{} days {} hours {} min {} sec'.format(str(day),str(hour),str(minutes),str(seconds)))
    elif hour != 0:
        return ('{} hours {} min {} sec'.format(str(hour),str(minutes),str(seconds)))
    elif minutes != 0:
        return ('{} min {} sec'.format(str(minutes),str(seconds)))
    else:
        return ('{} sec'.format(str(seconds)))

def printOutput(output):
    tp.banner(output)
    logging.debug(output)

def calulate_size(size_bytes):
    size_bytes=int(size_bytes)
    if (size_bytes>(1024*1024*1024*1024)):
        size= str(round(float(size_bytes)/(1024*1024*1024*1024),3))+" TB"
    elif (size_bytes>(1024*1024*1024)):
        size= str(round(float(size_bytes)/(1024*1024*1024),3))+" GB"
    elif (size_bytes>(1024*1024)):
        size= str(round(float(size_bytes)/(1024*1024),3))+" MB"
    elif (size_bytes>1024):
        size= str(round(float(size_bytes)/(1024),3))+" KB"
    else :
        size = str(size_bytes)+" B"

    return size

def get_hive_connection():
    """Connects to Hive
    
    Returns:
        pyhive.hive.Cursor -- cursor object
    """

    conn = hive.connect('localhost')
    cursor=conn.cursor()
    return cursor

def wait_for_cursor(cursor):
    """Waits for the Hive operation to be completed
    
    Arguments:
        cursor {pyhive.hive.Cursor} -- cursor object
    """
    
    status = cursor.poll().operationState
    while status in (TOperationState.INITIALIZED_STATE, TOperationState.RUNNING_STATE):
        logs = cursor.fetch_logs()
        for message in logs:
            print message

# Returns the hive table description
def get_description(database,table_name):
    """Description of hive table
    
    Arguments:
        database {str} -- Hive database name
        table_name {str} -- Hive table name
    
    Returns:
        str -- output of show create table statement
    """

    cursor=get_hive_connection()
    cursor.execute("show create table {}.{}".format(database,table_name),async=True)
    wait_for_cursor(cursor)
    table_description=cursor.fetchall()
    return table_description



def execute_hive_query(query):
    """Executes Hive query
    
    Arguments:
        query {str} -- Query to be executed
    
    Returns:
        tuple -- Output results tuple
    """

    try:
        cursor = get_hive_connection()
        # implement exponential backoff strategy
        cursor.execute(query)
        wait_for_cursor(cursor)
    except Exception as e:
        print(query)
        print(e)
    return cursor.fetchall()

def execute_mysql_query(query):
    """Executes MySQL query
    
    Arguments:
        query {str} -- Query to be executed
    
    Returns:
        tuple -- Output results tuple
    """

    # implement exponential backoff strategy
    mysql_cursor.execute(query)
    return mysql_cursor.fetchall()

# Returns HDFS location for a hive table
def get_avro_location(database,table_name):
    """Get location of a hive table
    
    Arguments:
        database {str} -- Hive database name
        table_name {str} -- Hive table name
    
    Returns:
        str -- HDFS location of the table
    """

    global avro_location
    avro_desc = get_description(database,table_name)
    for j in range(len(avro_desc)):
        if avro_desc[j][0]=='LOCATION':
             avro_location=avro_desc[j+1][0]
    avro_location=avro_location.replace("'","").strip()
    return avro_location

# Drops a stage hive table
def drop_hive_table(table_name):
    """Drops hive table in "default" database
    
    Arguments:
        table_name {str} -- Hive table name
    """

    cursor=get_hive_connection()
    # implement exponential backoff strategy
    cursor.execute("drop table {}.{}".format("default",table_name))
    wait_for_cursor(cursor)
    print("Dropped Hive table %s in default database" % table_name)

# Executes a MySQL transaction operation(INSERT,UPDATE,DELETE) and commits if executed successfully
def execute_transaction(query):
    """Executes DML statements in CloudSQL metadata table.
    
    Arguments:
        query {str} -- Query to be executed
    """

    # if DEBUG_MODE: print(query)
    try:
        mysql_cursor.execute(query)
        mysql_connection.commit()
    except Exception as e:
        # implement exponential backoff strategy
        print(e)
        mysql_connection.rollback()

