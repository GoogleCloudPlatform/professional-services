# -------------------------------------------------------------------------------
# This module imports all the python packages required throughout the code and
# also initializes global variables which will be used throughout the code as
# arguments.
# ------------------------------------------------------------------------------

# Importing required libraries
import re
import datetime
import dateutil.parser
import os
import requests
import warnings
import subprocess
import sys
import math
import json
import os
import shutil
import xml.etree.ElementTree as ET
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import logging
import glob
from pprint import pprint
from fpdf import FPDF
from pandas.errors import EmptyDataError
from os import path
from requests.auth import HTTPBasicAuth
from datetime import datetime, timedelta
from getpass import getpass
from sqlalchemy import create_engine
from tqdm import tqdm
from xml.etree.ElementTree import XML, fromstring
from time import sleep

# Defining default setting and date range for assessment report
sns.set(rc={"figure.figsize": (15, 5)})
pd.set_option("display.max_colwidth", 0)
pd.options.display.float_format = "{:,.2f}".format
warnings.filterwarnings("ignore")
sns.set(rc={"figure.figsize": (15, 5)})


def check_ssl():
    """Check whether SSL is enabled or not

    Returns:
        ssl (bool): SSL flag
    """

    ssl = None
    if path.exists("/etc/hadoop/conf/core-site.xml"):
        hadoop_path = "/etc/hadoop/conf/core-site.xml"
    elif path.exists("/etc/hive/conf/core-site.xml"):
        hadoop_path = "/etc/hive/conf/core-site.xml"
    else:
        return ssl
    xml_data = os.popen("cat {}".format(hadoop_path)).read()
    root = ET.fromstring(xml_data)
    for val in root.findall("property"):
        name = val.find("name").text
        if "hadoop.ssl.enabled" not in name:
            root.remove(val)
    if len(root) == 0:
        ssl = None
    else:
        value = root[0][1].text
        if value == "true":
            ssl = True
        elif value == "false":
            ssl = False
        else:
            ssl = True
    return ssl


def check_config_path():
    """Check whether configuration files exists or not

    Returns:
        config_path (dict): config paths
    """

    config_path = {}
    if path.exists("/etc/hadoop/conf/core-site.xml"):
        config_path["core"] = "/etc/hadoop/conf/core-site.xml"
    else:
        if path.exists("/etc/hive/conf/core-site.xml"):
            config_path["core"] = "/etc/hive/conf/core-site.xml"
        else:
            config_path["core"] = None
    if path.exists("/etc/hadoop/conf/yarn-site.xml"):
        config_path["yarn"] = "/etc/hadoop/conf/yarn-site.xml"
    else:
        if path.exists("/etc/hive/conf/yarn-site.xml"):
            config_path["yarn"] = "/etc/hive/conf/yarn-site.xml"
        else:
            config_path["yarn"] = None
    if path.exists("/etc/hadoop/conf/mapred-site.xml"):
        config_path["mapred"] = "/etc/hadoop/conf/mapred-site.xml"
    else:
        if path.exists("/etc/hive/conf/mapred-site.xml"):
            config_path["mapred"] = "/etc/hive/conf/mapred-site.xml"
        else:
            config_path["mapred"] = None
    if path.exists("/etc/hadoop/conf/hdfs-site.xml"):
        config_path["hdfs"] = "/etc/hadoop/conf/hdfs-site.xml"
    else:
        if path.exists("/etc/hive/conf/hdfs-site.xml"):
            config_path["hdfs"] = "/etc/hive/conf/hdfs-site.xml"
        else:
            config_path["hdfs"] = None
    if path.exists("/etc/hive/conf/hive-site.xml"):
        config_path["hive"] = "/etc/hive/conf/hive-site.xml"
    else:
        config_path["hive"] = None
    if path.exists("/etc/spark/conf/spark-defaults.conf"):
        config_path["spark"] = "/etc/spark/conf/spark-defaults.conf"
    else:
        config_path["spark"] = None
    if path.exists("/etc/kafka/conf/kafka-client.conf"):
        config_path["kafka"] = "/etc/kafka/conf/kafka-client.conf"
    else:
        config_path["kafka"] = None
    return config_path


def get_cloudera_creds(version, ssl):
    """Get input from user related to cloudera manager.

    Returns:
        inputs (dict): Contains user input attributes

    """

    try:
        c = 3
        while c > 0:
            print(
                "\nA major number of metrics generation would require Cloudera manager credentials."
            )
            print(
                "Therefore, would you be able to provide your Cloudera Manager credentials? [y/n]"
            )
            t = input()
            if t in ["y", "Y"]:
                c1 = 3
                while c1 > 0:
                    print("\nEnter Cloudera Manager Host IP or Hostname:")
                    host = input()
                    if not host.isnumeric():
                        break
                    c1 = c1 - 1
                    if c1 == 0:
                        print("Received incorrect input 3 times, exiting the tool")
                        exit()
                    else:
                        print("Incorrect input, try again!")
                c1 = 3
                while c1 > 0:
                    print("\nIs your Cloudera Manager Port number 7180? [y/n]")
                    t1 = input()
                    if t1 in ["y", "Y"]:
                        port = "7180"
                        break
                    elif t1 in ["n", "N"]:
                        c2 = 3
                        while c2 > 0:
                            print("\nEnter Cloudera Manager Port:")
                            port = input()
                            if port.isnumeric():
                                break
                            c2 = c2 - 1
                            if c2 == 0:
                                print(
                                    "Received incorrect input 3 times, exiting the tool"
                                )
                                exit()
                            else:
                                print("Incorrect input, try again!")
                        break
                    c1 = c1 - 1
                    if c1 == 0:
                        print("Received incorrect input 3 times, exiting the tool")
                        exit()
                    else:
                        print("Incorrect input, try again!")
                print("\nEnter Cloudera Manager Username:")
                uname = input()
                password = getpass(prompt="\nEnter Cloudera Manager Password:")
                return host, port, uname, password
            elif t in ["n", "N"]:
                return None, None, None, None
            c = c - 1
            if c == 0:
                print("Received incorrect input 3 times, exiting the tool")
                exit()
            else:
                print("Incorrect input, try again!")
    except Exception as e:
        return None, None, None, None


def cloudera_cluster_name(
    version,
    ssl,
    cloudera_manager_host_ip,
    cloudera_manager_port,
    cloudera_manager_username,
    cloudera_manager_password,
):
    """Get Cluster Name from User.

    Args:
        version (int): Cloudera distributed Hadoop version
        cloudera_manager_host_ip (str): Cloudera Manager Host IP.
        cloudera_manager_port (str): Cloudera Manager Port Number.
        cloudera_manager_username (str): Cloudera Manager Username.
        cloudera_manager_password (str): Cloudera Manager Password.

    Returns:
        cluster_name (str): Cluster name present in cloudera manager.

    """

    try:
        initial_run = None
        http = None
        if ssl:
            http = "https"
        else:
            http = "http"
        if version == 7:
            initial_run = requests.get(
                "{}://{}:{}/api/v40/clusters".format(
                    http, cloudera_manager_host_ip, cloudera_manager_port
                ),
                auth=HTTPBasicAuth(
                    cloudera_manager_username, cloudera_manager_password
                ),
                timeout=5,
            )
        elif version == 6:
            initial_run = requests.get(
                "{}://{}:{}/api/v19/clusters".format(
                    http, cloudera_manager_host_ip, cloudera_manager_port
                ),
                auth=HTTPBasicAuth(
                    cloudera_manager_username, cloudera_manager_password
                ),
                timeout=5,
            )
        elif version == 5:
            initial_run = requests.get(
                "{}://{}:{}/api/v19/clusters".format(
                    http, cloudera_manager_host_ip, cloudera_manager_port
                ),
                auth=HTTPBasicAuth(
                    cloudera_manager_username, cloudera_manager_password
                ),
                timeout=5,
            )
        else:
            print("Unable to fetch cloudera clusters as cloudera does not exist")
            return None
        if initial_run.status_code == 200:
            cluster = initial_run.json()
            cluster_list = []
            for i in cluster["items"]:
                cluster_list.append(i["name"])
            c = 3
            while c > 0:
                print("\nSelect cluster name from list below: ")
                for i in range(len(cluster_list)):
                    print(str(i + 1) + "] " + cluster_list[i])
                print(
                    "Enter the serial number (1/2/../n) for the selected cluster name:"
                )
                var = input()
                if var.isnumeric():
                    var = int(var)
                    if (var > 0) and (var <= len(cluster_list)):
                        break
                c = c - 1
                if c == 0:
                    print("Received incorrect input 3 times, exiting the tool")
                    exit()
                else:
                    print("Incorrect input, try again!")
            cluster_name = cluster_list[var - 1]
            print("Selected cluster for assessment: " + cluster_name)
            return cluster_name
        else:
            print(
                "Cloudera credentials are incorrect or unable to connect to Cloudera Manager!"
            )
            return None
    except Exception as e:
        print(
            "Cloudera credentials are incorrect or unable to connect to Cloudera Manager!"
        )
        return None


def get_yarn_creds(inputs):
    """Get input from user related to Hive.

    Returns:
        inputs (dict): Contains user input attributes

    """

    try:
        if inputs["config_path"]["yarn"] != None:
            xml_data = subprocess.Popen(
                "cat {}".format(inputs["config_path"]["yarn"]),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            xml_data.wait(10)
            xml_data, err = xml_data.communicate()
            root = ET.fromstring(xml_data)
            for val in root.findall("property"):
                name = val.find("name").text
                value = val.find("value").text
                if inputs["ssl"]:
                    if "yarn.resourcemanager.webapp.https.address" in name:
                        yarn_rm, yarn_port = value.split(":")
                        return yarn_rm, yarn_port
                else:
                    if "yarn.resourcemanager.webapp.address" in name:
                        yarn_rm, yarn_port = value.split(":")
                        return yarn_rm, yarn_port
        else:
            c = 3
            while c > 0:
                print(
                    "\nTo view yarn-related metrics, would you be able to enter Yarn credentials? [y/n]"
                )
                t = input()
                if t in ["y", "Y"]:
                    c1 = 3
                    while c1 > 0:
                        print("\nEnter Yarn Resource Manager Host IP or Hostname:")
                        yarn_rm = input()
                        if not yarn_rm.isnumeric():
                            break
                        c1 = c1 - 1
                        if c1 == 0:
                            print("Received incorrect input 3 times, exiting the tool")
                            exit()
                        else:
                            print("Incorrect input, try again!")
                    c1 = 3
                    while c1 > 0:
                        print("\nEnter Yarn Resource Manager Port:")
                        yarn_port = input()
                        if yarn_port.isnumeric():
                            break
                        c1 = c1 - 1
                        if c1 == 0:
                            print("Received incorrect input 3 times, exiting the tool")
                            exit()
                        else:
                            print("Incorrect input, try again!")
                    if inputs["ssl"]:
                        http = "https"
                    else:
                        http = "http"
                    try:
                        r = requests.get(
                            "{}://{}:{}/ws/v1/cluster".format(http, yarn_rm, yarn_port),
                            verify=False,
                            timeout=5,
                        )
                        if r.status_code == 200:
                            return yarn_rm, yarn_port
                        else:
                            print("Unable to connect to Yarn Resource Manager")
                    except Exception as e:
                        print("Unable to connect to Yarn Resource Manager")
                elif t in ["n", "N"]:
                    return None, None
                c = c - 1
                if c == 0:
                    print("Received incorrect input 3 times, exiting the tool")
                    return None, None
                else:
                    print("Incorrect input, try again!")
    except Exception as e:
        return None, None


def get_hive_creds(inputs):
    """Get input from user related to Hive.

    Returns:
        inputs (dict): Contains user input attributes

    """

    try:
        c = 3
        while c > 0:
            print(
                "\nTo view hive-related metrics, would you be able to enter Hive credentials? [y/n]"
            )
            t = input()
            if t in ["y", "Y"]:
                print("\nEnter Hive Metastore username: ")
                hive_username = input()
                hive_password = getpass(prompt="\nEnter Hive Metastore password:")
                r = None
                http = None
                if inputs["ssl"]:
                    http = "https"
                else:
                    http = "http"
                if inputs["version"] == 7:
                    r = requests.get(
                        "{}://{}:{}/api/v40/clusters/{}/services/hive/config".format(
                            http,
                            inputs["cloudera_manager_host_ip"],
                            inputs["cloudera_manager_port"],
                            inputs["cluster_name"],
                        ),
                        auth=HTTPBasicAuth(
                            inputs["cloudera_manager_username"],
                            inputs["cloudera_manager_password"],
                        ),
                        verify=False,
                    )
                elif inputs["version"] == 6:
                    r = requests.get(
                        "{}://{}:{}/api/v19/clusters/{}/services/hive/config".format(
                            http,
                            inputs["cloudera_manager_host_ip"],
                            inputs["cloudera_manager_port"],
                            inputs["cluster_name"],
                        ),
                        auth=HTTPBasicAuth(
                            inputs["cloudera_manager_username"],
                            inputs["cloudera_manager_password"],
                        ),
                        verify=False,
                    )
                elif inputs["version"] == 5:
                    r = requests.get(
                        "{}://{}:{}/api/v19/clusters/{}/services/hive/config".format(
                            http,
                            inputs["cloudera_manager_host_ip"],
                            inputs["cloudera_manager_port"],
                            inputs["cluster_name"],
                        ),
                        auth=HTTPBasicAuth(
                            inputs["cloudera_manager_username"],
                            inputs["cloudera_manager_password"],
                        ),
                        verify=False,
                    )
                else:
                    return None, None
                if r.status_code == 200:
                    hive_config = r.json()
                    hive_config_items = hive_config["items"]
                    mt_db_host = ""
                    mt_db_name = ""
                    mt_db_type = ""
                    mt_db_port = ""
                    for i in hive_config_items:
                        if i["name"] == "hive_metastore_database_host":
                            mt_db_host = i["value"]
                        elif i["name"] == "hive_metastore_database_name":
                            mt_db_name = i["value"]
                        elif i["name"] == "hive_metastore_database_port":
                            mt_db_port = i["value"]
                        elif i["name"] == "hive_metastore_database_type":
                            mt_db_type = i["value"]
                    if mt_db_type == "postgresql":
                        database_uri = "postgres+psycopg2://{}:{}@{}:{}/{}".format(
                            hive_username,
                            hive_password,
                            mt_db_host,
                            mt_db_port,
                            mt_db_name,
                        )
                        engine = create_engine(database_uri)
                    if mt_db_type == "mysql":
                        database_uri = "mysql+pymysql://{}:{}@{}:{}/{}".format(
                            hive_username,
                            hive_password,
                            mt_db_host,
                            mt_db_port,
                            mt_db_name,
                        )
                        engine = create_engine(database_uri)
                    if mt_db_type == "mssql":
                        sql_server_driver = ""
                        driver_names = [
                            x for x in pyodbc.drivers() if x.endswith(" for SQL Server")
                        ]
                        if driver_names:
                            sql_server_driver = driver_names[0]
                            sql_server_driver = sql_server_driver.replace(" ", "+")
                            database_uri = "mssql+pyodbc://{}:{}@{}:{}/{}?driver={}".format(
                                hive_username,
                                hive_password,
                                mt_db_host,
                                mt_db_port,
                                mt_db_name,
                                sql_server_driver,
                            )
                        else:
                            database_uri = "mssql+pyodbc://{}:{}@{}:{}/{}".format(
                                hive_username,
                                hive_password,
                                mt_db_host,
                                mt_db_port,
                                mt_db_name,
                            )
                        engine = create_engine(database_uri)
                    try:
                        engine.connect()
                        return hive_username, hive_password
                    except Exception as ee:
                        print("Unable to connect to Hive Metastore!")
                else:
                    print("Unable to connect to Cloudera Manager!")
            elif t in ["n", "N"]:
                return None, None
            c = c - 1
            if c == 0:
                print("Received incorrect input 3 times, exiting the tool")
                return None, None
            else:
                print("Incorrect input, try again!")
    except Exception as e:
        return None, None


def broker_list_input():
    try:
        broker_list = []
        c = 3
        while c > 0:
            print(
                "\nTo view kafka-related metrics, would you be able to provide Kafka credentials? [y/n]"
            )
            t = input()
            if t in ["y", "Y"]:
                broker_list = []
                c1 = 3
                while c1 > 0:
                    print("\nEnter the number of Kafka brokers:")
                    n = input()
                    if n.isnumeric():
                        n = int(n)
                        for i in range(0, n):
                            broker = {"host": "", "port": "", "log_dir": ""}
                            print(
                                "\nEnter the hostname or IP of broker {}:".format(i + 1)
                            )
                            broker["host"] = input()
                            c2 = 3
                            while c2 > 0:
                                print(
                                    "\nIs your broker hosted on {} have port number 9092? [y/n]".format(
                                        broker["host"]
                                    )
                                )
                                t1 = input()
                                if t1 in ["y", "Y"]:
                                    broker["port"] = "9092"
                                    break
                                elif t1 in ["n", "N"]:
                                    print(
                                        "\nPlease enter the port number of broker hosted on {}:".format(
                                            broker["host"]
                                        )
                                    )
                                    broker["port"] = input()
                                    break
                                c2 = c2 - 1
                                if c2 == 0:
                                    print(
                                        "Received incorrect input 3 times, exiting the tool"
                                    )
                                    exit()
                                else:
                                    print("Incorrect input, try again!")
                            c2 = 3
                            while c2 > 0:
                                print(
                                    "\nDoes the broker hosted on {} have the following path to the log directory /var/local/kafka/data/? [y/n]".format(
                                        broker["host"]
                                    )
                                )
                                t1 = input()
                                if t1 in ["y", "Y"]:
                                    broker["log_dir"] = "/var/local/kafka/data/"
                                    break
                                elif t1 in ["n", "N"]:
                                    print(
                                        "\nEnter the log directory path of broker hosted on {}:".format(
                                            broker["host"]
                                        )
                                    )
                                    broker["log_dir"] = input()
                                    break
                                c2 = c2 - 1
                                if c2 == 0:
                                    print(
                                        "Received incorrect input 3 times, exiting the tool"
                                    )
                                    exit()
                                else:
                                    print("Incorrect input, try again!")
                        return broker_list
                    c1 = c1 - 1
                    if c1 == 0:
                        print("Received incorrect input 3 times, exiting the tool")
                        exit()
                    else:
                        print("Incorrect input, try again!")
            elif t in ["n", "N"]:
                return []
            c = c - 1
            if c == 0:
                print("Received incorrect input 3 times, exiting the tool")
                exit()
            else:
                print("Incorrect input, try again!")
        return broker_list
    except Exception as e:
        return []


def get_input(version):
    """Get input from user related to cloudera manager like Host Ip, Username, 
    Password and Cluster Name.

    Args:
        version (int): Cloudera distributed Hadoop version
    Returns:
        inputs (dict): Contains user input attributes

    """

    try:
        inputs = {}
        inputs["version"] = version
        inputs["ssl"] = check_ssl()
        if inputs["ssl"] == None:
            c = 3
            while c > 0:
                print("Do you have SSL enabled for your cluster? [y/n]")
                t = input()
                if t in ["y", "Y"]:
                    inputs["ssl"] = True
                    break
                elif t in ["n", "N"]:
                    inputs["ssl"] = False
                    break
                c = c - 1
                if c == 0:
                    print("Received incorrect input 3 times, exiting the tool")
                    exit()
                else:
                    print("Incorrect input, try again!")
        if inputs["ssl"]:
            print("As SSL is enabled, enter the inputs accordingly")
        else:
            print("As SSL is disabled, enter the inputs accordingly")
        inputs["config_path"] = check_config_path()
        if inputs["version"] != 0:
            c = 3
            while c > 0:
                (
                    inputs["cloudera_manager_host_ip"],
                    inputs["cloudera_manager_port"],
                    inputs["cloudera_manager_username"],
                    inputs["cloudera_manager_password"],
                ) = get_cloudera_creds(version, inputs["ssl"])
                if inputs["cloudera_manager_host_ip"] == None:
                    inputs["cluster_name"] = None
                    break
                inputs["cluster_name"] = cloudera_cluster_name(
                    inputs["version"],
                    inputs["ssl"],
                    inputs["cloudera_manager_host_ip"],
                    inputs["cloudera_manager_port"],
                    inputs["cloudera_manager_username"],
                    inputs["cloudera_manager_password"],
                )
                if inputs["cluster_name"] == None:
                    c = c - 1
                    if c == 0:
                        print("Received incorrect input 3 times, exiting the tool")
                        exit()
                    else:
                        print("Incorrect input, try again!")
                else:
                    break
        else:
            (
                inputs["cloudera_manager_host_ip"],
                inputs["cloudera_manager_port"],
                inputs["cloudera_manager_username"],
                inputs["cloudera_manager_password"],
                inputs["cluster_name"],
            ) = (None, None, None, None, None)
        if inputs["cloudera_manager_host_ip"] == None:
            inputs["hive_username"], inputs["hive_password"] = None, None
        else:
            inputs["hive_username"], inputs["hive_password"] = get_hive_creds(inputs)
        inputs["yarn_rm"], inputs["yarn_port"] = get_yarn_creds(inputs)
        inputs["broker_list"] = broker_list_input()
        c = 3
        while c > 0:
            print(
                "\nSelect the time range of the PDF Assessment report from the options below:"
            )
            print(
                "[1] Week: generates the report from today to 7 days prior\n[2] Month: generates the report from today to 30 days prior\n[3] Custom: generates the report for a custom time period"
            )
            print("Enter the serial number [1/2/3] as required:")
            t = input()
            if t.isnumeric():
                t = int(t)
                if t == 1:
                    inputs["start_date"] = (
                        datetime.now() - timedelta(days=7)
                    ).strftime("%Y-%m-%dT%H:%M:%S")
                    inputs["end_date"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
                    break
                elif t == 2:
                    inputs["start_date"] = (
                        datetime.now() - timedelta(days=30)
                    ).strftime("%Y-%m-%dT%H:%M:%S")
                    inputs["end_date"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
                    break
                elif t == 3:
                    c1 = 3
                    while c1 > 0:
                        print("Enter start date: [YYYY-MM-DD HH:MM]")
                        t = input()
                        try:
                            start_date = datetime.strptime(t, "%Y-%m-%d %H:%M")
                            break
                        except Exception as e:
                            c1 = c1 - 1
                            if c1 == 0:
                                print(
                                    "Received incorrect input 3 times, exiting the tool"
                                )
                                exit()
                            else:
                                print("Incorrect input, try again!")
                    inputs["start_date"] = start_date.strftime("%Y-%m-%dT%H:%M:%S")
                    c1 = 3
                    while c1 > 0:
                        print("Enter end date: [YYYY-MM-DD HH:MM]")
                        t = input()
                        try:
                            end_date = datetime.strptime(t, "%Y-%m-%d %H:%M")
                            break
                        except Exception as e:
                            c1 = c1 - 1
                            if c1 == 0:
                                print(
                                    "Received incorrect input 3 times, exiting the tool"
                                )
                                exit()
                            else:
                                print("Incorrect input, try again!")
                    inputs["end_date"] = end_date.strftime("%Y-%m-%dT%H:%M:%S")
                    cur_date = datetime.now()
                    if (
                        (start_date < end_date)
                        and (start_date < cur_date)
                        and (end_date < cur_date)
                    ):
                        break
            c = c - 1
            if c == 0:
                print("Received incorrect input 3 times, exiting the tool")
                exit()
            else:
                print("Incorrect input, try again!")
        return inputs
    except Exception as e:
        return {}


def get_logger(cur_date):
    """Defining custom logger object with custom formatter and file handler.

    Returns:
        logger (obj): Custom logger object
    """

    logger = logging.getLogger("hadoop_assessment_tool")
    handler = logging.FileHandler(
        "../../hadoop_assessment_tool_{}.log".format(cur_date)
    )
    handler.setLevel(logging.DEBUG)
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
    return logger
