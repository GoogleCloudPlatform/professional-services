from typing import Any
from datetime import datetime,timedelta
import google.auth
from google.auth.transport.requests import AuthorizedSession
#import requests
import sys, time
#from google.oauth2 import service_account
import argparse

AUTH_SCOPE = "https://www.googleapis.com/auth/cloud-platform"
CREDENTIALS, _ = google.auth.default(scopes=[AUTH_SCOPE])
# CREDENTIALS = service_account.Credentials.from_service_account_file("rite-aid-pocs-e68b8fc526ff.json", scopes=["https://www.googleapis.com/auth/cloud-platform"])

def web_server_request(url: str, method: str = "GET", **kwargs: Any) -> google.auth.transport.Response:
    authed_session = AuthorizedSession(CREDENTIALS)
    #print("====Authentication====")
    if "timeout" not in kwargs:
        kwargs["timeout"] = 90
    return authed_session.request(method, url, **kwargs)

def trigger_dag(web_server_url: str, dag_id: str, data: dict) -> str:
    endpoint = f"api/v1/dags/{dag_id}/dagRuns"
    request_url = f"{web_server_url}/{endpoint}"
    print("Request URL :", request_url)
    response = web_server_request(request_url, method="POST", json=data)
    print("Response: ===>", response.text)
    #print("Run Configs: ===>", response.json())
    
    if response.status_code == 403:
        print("You do not have a permission to perform this operation. ")
        print(response.text)
        sys.exit(response.status_code)
    elif response.status_code != 200:
        response.raise_for_status()
        sys.exit(response.status_code)
    else:
        run_id = response.json()["dag_run_id"]
        sleep_counter = 0
        sleep_interval = 20
        sleep_step = 10
        while(response.json()["state"] == "queued" or response.json()["state"] == "running"): 
            response = web_server_request(request_url +"/"+ run_id, method="GET")
            print("DAG :" + dag_id + " is " + response.json()["state"])
            if(response.json()["state"] == "success" or response.json()["state"] == "failed"):
                print("DAG :" + dag_id + " is " + response.json()["state"])
                break
            print(f"Sleeping for {sleep_interval}, attempt - {sleep_counter}")
            time.sleep(sleep_interval)
            sleep_counter = sleep_counter + 1
            print("Sleep counter =>", sleep_counter)

            if sleep_counter in range(30, 300, 30):
                sleep_interval = sleep_interval + sleep_step 

        print(response.text)
        if response.status_code == 200:
            print("Dag run is successful")
            print("\n")
            print("\n")
        else:
            sys.exit(response.status_code)


def dag_trigger_main():
    #Read Variables
    parser = argparse.ArgumentParser()
    parser.add_argument('--web_server_url', dest='web_server_url', required=True)
    parser.add_argument("--dag_lst", dest="dag_lst",required=True)
    parser.add_argument('--is_range', dest='is_range',required=True)
    parser.add_argument("--range_dates", dest="range_dates",required=True)
    # Parse the arguments
    known_args, pipeline_args = parser.parse_known_args()

    #Assign variable values
    web_server_url = known_args.web_server_url
    dag_lst = known_args.dag_lst.split(",")
    is_range = known_args.is_range
    range_dates = known_args.range_dates.split(",")

    print("\nArguments passed :")
    print("web_server_url - ", web_server_url)
    print("dag_lst - ", dag_lst)
    print("is_range - ", is_range)
    print("range_dates - ", range_dates)

    #Check the is_range value
    if is_range.lower() == 'true':
        is_range = True
    elif is_range.lower() == 'false':   
        is_range = False
    else:
        print("is_range value is not correct !!")
        sys.exit(1)
  
    #Check dag_lst is empty
    if len(dag_lst) < 1 and dag_lst is None:
        print("dag_lst is empty !!")
        sys.exit(1)
    
    #Check range_dates is empty
    if len(range_dates) < 1:
        print("range_dates is empty !!")
        sys.exit(1)    
    
    #Check all dates are valid
    for v_range_date in range_dates:
        try:
            datetime.strptime(v_range_date, "%Y-%m-%d")
            #2024-01-01 00:00:00
        except ValueError:
            raise ValueError
    
    if is_range == True:
        if len(range_dates) == 2:
            # Convert strings to datetime objects
            start_date = datetime.strptime(range_dates[0], "%Y-%m-%d")
            end_date = datetime.strptime(range_dates[1], "%Y-%m-%d")
            # Generate all dates between start and end date (inclusive)
            range_dates = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]
            # Convert datetime objects back to strings
            range_dates = [date.strftime("%Y-%m-%d") for date in range_dates]
            print("is_range is True, Generating all dates in range - ", range_dates)

        else:
            print("Please provide exactly two dates for variable range_dates as is_range = True !!")
            sys.exit(1)

    conf = {}
    print("\n")
    for dag_name in dag_lst:
        for v_range_date in range_dates:
            print("**** Running dag - ", dag_name, " date - ", v_range_date, "****")
            v_time = datetime.now().strftime("T%H:%M:%SZ")
            v_range_date = v_range_date + v_time # to handle conflicting run ids
            dag_run_id = "external_trigger__"+ dag_name + "_" + datetime.now().strftime("%d%m%Y%H%M%S") # to handle conflicting run ids
            print(dag_run_id)
            data = {"dag_run_id": dag_run_id, "logical_date": v_range_date , "conf": conf }
            trigger_dag(web_server_url=web_server_url, dag_id=dag_name, data=data)

   
if __name__ == '__main__':
   dag_trigger_main()