import json

def getVariables():

    """
    This function read a json file and return all the values.
    """

    #Replace the path with your default location in gcs keeping the /home/airflow/gcs/ structure
    with open('/home/airflow/gcs/dags/dependencies/variables/variables.json') as f:
        variables = json.load(f)

    return variables