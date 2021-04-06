# ------------------------------------------------------------------------------
# This module contains all the features of the category Hardware and Operating
# System footprint.This module contains the actual logic built with the help of
# Cloudera Manager API, Generic API and commands.
# -------------------------------------------------------------------------------

# Importing required libraries
import os
from imports import *


class HardwareOSAPI:
    """This Class has functions related to Hardware and OS Footprint category.

    Has functions which fetch different hardware and os metrics from Hadoop 
    cluster like list of host and their details, list of services, core and 
    memory usage pattern over time, etc.

    Args:
        inputs (dict): Contains user input attributes
    """

    def __init__(self, inputs):
        """Initialize inputs"""

        self.inputs = inputs
        self.version = inputs["version"]
        self.cloudera_manager_host_ip = inputs["cloudera_manager_host_ip"]
        self.cloudera_manager_port = inputs["cloudera_manager_port"]
        self.cloudera_manager_username = inputs["cloudera_manager_username"]
        self.cloudera_manager_password = inputs["cloudera_manager_password"]
        self.cluster_name = inputs["cluster_name"]
        self.logger = inputs["logger"]
        self.config_path = inputs["config_path"]
        self.ssl = inputs["ssl"]
        if self.ssl:
            self.http = "https"
        else:
            self.http = "http"
        self.start_date = inputs["start_date"]
        self.end_date = inputs["end_date"]

    def os_version(self):
        """Get OS version using system CLI command.
        
        Returns:
            os_version (str): OS version and distribution of host
        """

        try:
            os_version = subprocess.Popen(
                "grep PRETTY_NAME /etc/os-release",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            os_version, err = os_version.communicate()
            os_version = os_version.split("=")
            os_version = os_version[1]
            self.logger.info("os_version successful")
            return os_version
        except Exception as e:
            self.logger.error("os_version failed", exc_info=True)
            return None

    def cluster_items(self):
        """Get list of all clusters present in Cloudera Manager.

        Returns:
            cluster_items (dict): Metrics of all clusters
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error("cluster_items failed as cloudera does not exist",)
                return None
            if r.status_code == 200:
                cluster = r.json()
                cluster_items = cluster["items"]
                self.logger.info("cluster_items successful")
                return cluster_items
            else:
                self.logger.error(
                    "cluster_items failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_items failed", exc_info=True)
            return None

    def cluster_host_items(self, cluster_name):
        """Get List of all hosts present in a cluster.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_host_items (dict): Summary of all hosts in cluster
            cluster_host_len (int): Number of hosts in cluster
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/hosts".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/hosts".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/hosts".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_host_items failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_host = r.json()
                cluster_host_len = len(cluster_host["items"])
                cluster_host_items = cluster_host["items"]
                self.logger.info("cluster_host_items successful")
                return cluster_host_items, cluster_host_len
            else:
                self.logger.error(
                    "cluster_host_items failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_host_items failed", exc_info=True)
            return None

    def cluster_service_item(self, cluster_name):
        """Get a list of services present in a cluster with its details.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_service_item (dict): All services installed in cluster
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        cluster_name,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_service_item failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_services = r.json()
                cluster_service_item = cluster_services["items"]
                self.logger.info("cluster_service_item successful")
                return cluster_service_item
            else:
                self.logger.error(
                    "cluster_service_item failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_service_item failed", exc_info=True)
            return None

    def host_data(self, hostId):
        """Get detailed specs of a host.

        Args:
            hostId (str): Host ID present in cloudera manager.
        Returns:
            host_data (dict): Detailed specs of host
        """

        try:
            hostid = hostId
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/hosts/{}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        hostid,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/hosts/{}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        hostid,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/hosts/{}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        hostid,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error("host_data failed as cloudera does not exist",)
                return None
            if r.status_code == 200:
                host_data = r.json()
                self.logger.info("host_data successful")
                return host_data
            else:
                self.logger.error(
                    "host_data failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("host_data failed", exc_info=True)
            return None

    def cluster_total_cores(self, cluster_name):
        """Get cores availability data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_total_cores_df (DataFrame): Total cores available over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_cores_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_cores_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_cores_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_total_cores failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_total_cores = r.json()
                cluster_total_cores_list = cluster_total_cores["items"][0][
                    "timeSeries"
                ][0]["data"]
                cluster_total_cores_df = pd.DataFrame(cluster_total_cores_list)
                cluster_total_cores_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            cluster_total_cores_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": cluster_total_cores_df["value"],
                    }
                )
                cluster_total_cores_df["DateTime"] = pd.to_datetime(
                    cluster_total_cores_df["DateTime"]
                )
                cluster_total_cores_df = (
                    pd.DataFrame(
                        pd.date_range(
                            cluster_total_cores_df["DateTime"].min(),
                            cluster_total_cores_df["DateTime"].max(),
                            freq="1H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(cluster_total_cores_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                cluster_total_cores_df[
                    "Time"
                ] = cluster_total_cores_df.DateTime.dt.strftime("%d-%b %H:%M")
                cluster_total_cores_df = cluster_total_cores_df.set_index("Time")
                self.logger.info("cluster_total_cores successful")
                return cluster_total_cores_df
            else:
                self.logger.error(
                    "cluster_total_cores failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_total_cores failed", exc_info=True)
            return None

    def cluster_cpu_usage(self, cluster_name):
        """Get cores usage data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_cpu_usage_df (DataFrame): CPU usage over time
            cluster_cpu_usage_avg (float): Average CPU usage in cluster
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20cpu_percent_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20cpu_percent_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20cpu_percent_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_cpu_usage failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_cpu_usage = r.json()
                cluster_cpu_usage_list = cluster_cpu_usage["items"][0]["timeSeries"][0][
                    "data"
                ]
                cluster_cpu_usage_df = pd.DataFrame(cluster_cpu_usage_list)
                cluster_cpu_usage_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            cluster_cpu_usage_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": cluster_cpu_usage_df["value"],
                        "Min": cluster_cpu_usage_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": cluster_cpu_usage_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                cluster_cpu_usage_df["DateTime"] = pd.to_datetime(
                    cluster_cpu_usage_df["DateTime"]
                )
                cluster_cpu_usage_avg = (
                    cluster_cpu_usage_df["Mean"].sum()
                    / cluster_cpu_usage_df["DateTime"].count()
                )
                cluster_cpu_usage_df = (
                    pd.DataFrame(
                        pd.date_range(
                            cluster_cpu_usage_df["DateTime"].min(),
                            cluster_cpu_usage_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(cluster_cpu_usage_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                cluster_cpu_usage_df[
                    "Time"
                ] = cluster_cpu_usage_df.DateTime.dt.strftime("%d-%b %H:%M")
                cluster_cpu_usage_df = cluster_cpu_usage_df.set_index("Time")
                self.logger.info("cluster_cpu_usage successful")
                return cluster_cpu_usage_df, cluster_cpu_usage_avg
            else:
                self.logger.error(
                    "cluster_cpu_usage failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_cpu_usage failed", exc_info=True)
            return None

    def cluster_total_memory(self, cluster_name):
        """Get memory availability data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_total_memory_df (DataFrame): Total memory available over time
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_total_memory failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_total_memory = r.json()
                cluster_total_memory_list = cluster_total_memory["items"][0][
                    "timeSeries"
                ][0]["data"]
                cluster_total_memory_df = pd.DataFrame(cluster_total_memory_list)
                cluster_total_memory_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            cluster_total_memory_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": cluster_total_memory_df["value"] / 1024 / 1024 / 1024,
                    }
                )
                cluster_total_memory_df["DateTime"] = pd.to_datetime(
                    cluster_total_memory_df["DateTime"]
                )
                cluster_total_memory_df = (
                    pd.DataFrame(
                        pd.date_range(
                            cluster_total_memory_df["DateTime"].min(),
                            cluster_total_memory_df["DateTime"].max(),
                            freq="1H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(cluster_total_memory_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                cluster_total_memory_df[
                    "Time"
                ] = cluster_total_memory_df.DateTime.dt.strftime("%d-%b %H:%M")
                cluster_total_memory_df = cluster_total_memory_df.set_index("Time")
                self.logger.info("cluster_total_memory successful")
                return cluster_total_memory_df
            else:
                self.logger.error(
                    "cluster_total_memory failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_total_memory failed", exc_info=True)
            return None

    def cluster_memory_usage(self, cluster_name):
        """Get memory usage data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_memory_usage_df (DataFrame): Memory usage over time
            cluster_memory_usage_avg (float): Average memory usage in cluster
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20100*total_physical_memory_used_across_hosts/total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20100*total_physical_memory_used_across_hosts/total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=SELECT%20%20%20%20100*total_physical_memory_used_across_hosts/total_physical_memory_total_across_hosts%20WHERE%20%20%20%20category%3DCLUSTER%20%20%20%20AND%20clusterName%3D{}&to={}".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.start_date,
                        cluster_name,
                        self.end_date,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "cluster_memory_usage failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_memory_usage = r.json()
                cluster_memory_usage_list = cluster_memory_usage["items"][0][
                    "timeSeries"
                ][0]["data"]
                cluster_memory_usage_df = pd.DataFrame(cluster_memory_usage_list)
                cluster_memory_usage_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            cluster_memory_usage_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": cluster_memory_usage_df["value"],
                    }
                )
                cluster_memory_usage_df["DateTime"] = pd.to_datetime(
                    cluster_memory_usage_df["DateTime"]
                )
                cluster_memory_usage_avg = (
                    cluster_memory_usage_df["Mean"].sum()
                    / cluster_memory_usage_df["DateTime"].count()
                )
                cluster_memory_usage_df = (
                    pd.DataFrame(
                        pd.date_range(
                            cluster_memory_usage_df["DateTime"].min(),
                            cluster_memory_usage_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(cluster_memory_usage_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                cluster_memory_usage_df[
                    "Time"
                ] = cluster_memory_usage_df.DateTime.dt.strftime("%d-%b %H:%M")
                cluster_memory_usage_df = cluster_memory_usage_df.set_index("Time")
                self.logger.info("cluster_memory_usage successful")
                return cluster_memory_usage_df, cluster_memory_usage_avg
            else:
                self.logger.error(
                    "cluster_memory_usage failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_memory_usage failed", exc_info=True)
            return None

    def memory_usage_edgenode(self, edgenode_hostid_list):
        """Get database server like mysql for metadata.

        Returns:
            database_server (str): Database server present in cluster.
        """

        try:
            if len(edgenode_hostid_list) > 0:
                edgenode_usage_df = pd.DataFrame()
                edgenode_usage_df_temp = pd.DataFrame()
                for i in range(len(edgenode_hostid_list)):
                    r = None
                    if self.version == 7:
                        r = requests.get(
                            "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20capacity_used%20where%20hostId%20%3D%20{}&to={}".format(
                                self.http,
                                self.cloudera_manager_host_ip,
                                self.cloudera_manager_port,
                                self.start_date,
                                edgenode_hostid_list[i],
                                self.end_date,
                            ),
                            auth=HTTPBasicAuth(
                                self.cloudera_manager_username,
                                self.cloudera_manager_password,
                            ),
                            verify=False,
                        )
                    elif self.version == 6:
                        r = requests.get(
                            "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20capacity_used%20where%20hostId%20%3D%20{}&to={}".format(
                                self.http,
                                self.cloudera_manager_host_ip,
                                self.cloudera_manager_port,
                                self.start_date,
                                edgenode_hostid_list[i],
                                self.end_date,
                            ),
                            auth=HTTPBasicAuth(
                                self.cloudera_manager_username,
                                self.cloudera_manager_password,
                            ),
                            verify=False,
                        )
                    elif self.version == 5:
                        r = requests.get(
                            "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20capacity_used%20where%20hostId%20%3D%20{}&to={}".format(
                                self.http,
                                self.cloudera_manager_host_ip,
                                self.cloudera_manager_port,
                                self.start_date,
                                edgenode_hostid_list[i],
                                self.end_date,
                            ),
                            auth=HTTPBasicAuth(
                                self.cloudera_manager_username,
                                self.cloudera_manager_password,
                            ),
                            verify=False,
                        )
                    else:
                        self.logger.error(
                            "cluster_memory_usage failed as cloudera does not exist",
                        )
                        return None
                    if r.status_code == 200:
                        edgenode_usage = r.json()
                        hdfs_capacity_list_nw_json = edgenode_usage["items"][0][
                            "timeSeries"
                        ][0]["data"]
                        edgenode_usage_df_temp = pd.DataFrame(
                            hdfs_capacity_list_nw_json
                        )
                        edgenode_usage_df_temp = pd.DataFrame(
                            {
                                "DateTime": pd.to_datetime(
                                    edgenode_usage_df_temp["timestamp"]
                                ).dt.strftime("%Y-%m-%d %H:%M"),
                                "Mean": edgenode_usage_df_temp["value"] / 1000,
                            }
                        )
                        edgenode_usage_df_temp["Legend"] = pd.DataFrame(
                            pd.date_range(
                                edgenode_usage_df_temp["DateTime"].min(),
                                edgenode_usage_df_temp["DateTime"].max(),
                                freq="H",
                            )
                        )
                        edgenode_usage_df_temp[
                            "Time"
                        ] = edgenode_usage_df_temp.Legend.dt.strftime("%d-%b %H:%M")
                        edgenode_usage_df = edgenode_usage_df.append(
                            edgenode_usage_df_temp
                        )
                    else:
                        self.logger.error(
                            "memory_usage_edgenode failed due to invalid API call. HTTP Response: ",
                            r.status_code,
                        )
                grouped_df = edgenode_usage_df.groupby("Time")
                mean_df = grouped_df.mean()
                mean_df = mean_df.reset_index()
                mean_df.set_index("Time", inplace=True)
                self.logger.info("cluster_memory_usage successful")
                return mean_df
            else:
                return None
        except Exception as e:
            self.logger.error("memory_usage_edgenode failed", exc_info=True)
            return None

    def database_server(self):
        """Get database server like mysql for metadata.

        Returns:
            database_server (str): Database server present in cluster.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/cm/scmDbInfo".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/cm/scmDbInfo".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/cm/scmDbInfo".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error("database_server failed as cloudera does not exist",)
                return None
            if r.status_code == 200:
                database_server = r.json()
                database_server = database_server["scmDbType"]
                self.logger.info("database_server successful")
                return database_server
            else:
                self.logger.error(
                    "database_server failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("database_server failed", exc_info=True)
            return None

    def dns_server(self):
        """Get DNS server details.

        Returns:
            dns_server (str): DNS server present in cluster.
        """

        try:
            dns_server = subprocess.Popen(
                "systemctl status named 2>/dev/null | grep Active",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            dns_server.wait(10)
            dns_server, err = dns_server.communicate()
            if not dns_server:
                dns_server = "DNS server does not enabled within machine"
            else:
                dns_server = "DNS server not enabled within machine"
            self.logger.info("dns_server successful")
            return dns_server
        except Exception as e:
            self.logger.error("dns_server failed", exc_info=True)
            return None

    def web_server(self):
        """Get web server details.

        Returns:
            web_server (str): Web server present in cluster.
        """

        try:
            os_name = os.popen("grep PRETTY_NAME /etc/os-release").read()
            os_name = os_name.lower()
            web_server = ""
            if "centos" in os_name:
                web_server = subprocess.Popen(
                    "systemctl status httpd 2>/dev/null | grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                web_server.wait(10)
                web_server, err = web_server.communicate()
                web_server = web_server.split(":")
                if "inactive" in web_server[1]:
                    web_server = "Web server is not enabled"
                else:
                    web_server = "Web server is enabled"
            elif "ubuntu" in os_name:
                web_server = subprocess.Popen(
                    "systemctl status apache2  2>/dev/null | grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                web_server.wait(10)
                web_server, err = web_server.communicate()
                web_server = web_server.split(":")
                if "inactive" in web_server[1]:
                    web_server = "Web server is not enabled"
                else:
                    web_server = "Web server is enabled"
            elif "red hat" in os_name:
                web_server = subprocess.Popen(
                    "systemctl status httpd 2>/dev/null | grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                web_server.wait(10)
                web_server, err = web_server.communicate()
                web_server = web_server.split(":")
                if "inactive" in web_server[1]:
                    web_server = "Web server is not enabled"
                else:
                    web_server = "Web server is enabled"
            elif "suse" in os_name:
                web_server = subprocess.Popen(
                    "systemctl status apache2  2>/dev/null | grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                web_server.wait(10)
                web_server, err = web_server.communicate()
                web_server = web_server.split(":")
                if "inactive" in web_server[1]:
                    web_server = "Web server is not enabled"
                else:
                    web_server = "Web server is enabled"
            self.logger.info("web_server successful")
            return web_server
        except Exception as e:
            self.logger.error("web_server failed", exc_info=True)
            return None

    def ntp_server(self):
        """Get NTP server details.

        Returns:
            ntp_server (str): NTP server present in cluster.
        """

        try:
            os_name = os.popen("grep PRETTY_NAME /etc/os-release").read()
            os_name = os_name.lower()
            ntp_server = ""
            if "centos" in os_name:
                ntp_server = subprocess.Popen(
                    "timedatectl status 2>/dev/null | grep NTP | grep enabled",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                ntp_server.wait(10)
                ntp_server, err = ntp_server.communicate()
                ntp_server = ntp_server.split(":")
                ntp_server = ntp_server[1]
            elif "ubuntu" in os_name:
                ntp_server = subprocess.Popen(
                    "systemctl status ntp 2>/dev/null| grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                ntp_server.wait(10)
                ntp_server, err = ntp_server.communicate()
                if not ntp_server:
                    ntp_server = "not enabled"
                else:
                    ntp_server = ntp_server.split(":")
                    if "inactive" in ntp_server[1]:
                        ntp_server = "not enabled"
                    else:
                        ntp_server = "enabled"
            elif "red hat" in os_name:
                ntp_server = subprocess.Popen(
                    "timedatectl status 2>/dev/null | grep NTP | grep enabled",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                ntp_server.wait(10)
                ntp_server, err = ntp_server.communicate()
                ntp_server = ntp_server.split(":")
                ntp_server = ntp_server[1]
            elif "suse" in os_name:
                ntp_server = subprocess.Popen(
                    "systemctl status chronyd 2>/dev/null| grep Active",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                ntp_server.wait(10)
                ntp_server, err = ntp_server.communicate()
                if not ntp_server:
                    ntp_server = "not enabled"
                else:
                    ntp_server = ntp_server.split(":")
                    if "inactive" in ntp_server[1]:
                        ntp_server = "not enabled"
                    else:
                        ntp_server = "enabled"
            self.logger.info("ntp_server successful")
            return ntp_server
        except Exception as e:
            self.logger.error("ntp_server failed", exc_info=True)
            return None

    def manufacturer_name(self):
        """Get manufacturer name of processor.

        Returns:
            manufacturer_name (str): Manufacturer name of processor present in cluster.
        """

        try:
            manufacturer_name = subprocess.Popen(
                "dmidecode --type processor 2>/dev/null | grep Manufacturer | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            manufacturer_name.wait(10)
            manufacturer_name, err = manufacturer_name.communicate()
            manufacturer_name = manufacturer_name.split(":")
            manufacturer_name = manufacturer_name[1]
            self.logger.info("manufacturer_name successful")
            return manufacturer_name
        except Exception as e:
            self.logger.error("manufacturer_name failed", exc_info=True)
            return None

    def serial_no(self):
        """Get serial number of processor.

        Returns:
            serial_no (str): Serial number of processor present in cluster.
        """

        try:
            serial_no = subprocess.Popen(
                "dmidecode --type processor | grep ID | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            serial_no.wait(10)
            serial_no, err = serial_no.communicate()
            serial_no = serial_no.split(":")
            serial_no = serial_no[1]
            self.logger.info("serial_no successful")
            return serial_no
        except Exception as e:
            self.logger.error("serial_no failed", exc_info=True)
            return None

    def family(self):
        """Get family of processor.

        Returns:
            family (str): Family of processor present in cluster.
        """

        try:
            family = subprocess.Popen(
                "cat /proc/cpuinfo | grep cpu | grep family | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            family.wait(10)
            family, err = family.communicate()
            family = family.split(":")
            family = family[1]
            self.logger.info("family successful")
            return family
        except Exception as e:
            self.logger.error("family failed", exc_info=True)
            return None

    def model_name(self):
        """Get model name of processor.

        Returns:
            model_name (str): Model name of processor present in cluster.
        """

        try:
            model_name = subprocess.Popen(
                "cat /proc/cpuinfo | grep model | grep name | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            model_name.wait(10)
            model_name, err = model_name.communicate()
            model_name = model_name.split(":")
            model_name = model_name[1]
            self.logger.info("model_name successful")
            return model_name
        except Exception as e:
            self.logger.error("model_name failed", exc_info=True)
            return None

    def microcode(self):
        """Get microcode of processor.

        Returns:
            microcode (str): Microcode of processor present in cluster.
        """

        try:
            microcode = subprocess.Popen(
                "cat /proc/cpuinfo | grep microcode | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            microcode.wait(10)
            microcode, err = microcode.communicate()
            microcode = microcode.split(":")
            microcode = microcode[1]
            self.logger.info("microcode successful")
            return microcode
        except Exception as e:
            self.logger.error("microcode failed", exc_info=True)
            return None

    def cpu_mhz(self):
        """Get CPU MHz of processor.

        Returns:
            cpu_mhz (str): CPU MHz of processor present in cluster.
        """

        try:
            cpu_mhz = subprocess.Popen(
                "cat /proc/cpuinfo | grep cpu |grep MHz| awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            cpu_mhz.wait(10)
            cpu_mhz, err = cpu_mhz.communicate()
            cpu_mhz = cpu_mhz.split(":")
            cpu_mhz = cpu_mhz[1]
            self.logger.info("cpu_mhz successful")
            return cpu_mhz
        except Exception as e:
            self.logger.error("cpu_mhz failed", exc_info=True)
            return None

    def cpu_family(self):
        """Get CPU family of processor.

        Returns:
            cpu_family (str): CPU family of processor present in cluster.
        """

        try:
            cpu_family = subprocess.Popen(
                "cat /proc/cpuinfo | grep cpu | grep family | awk 'FNR <= 1'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            cpu_family.wait(10)
            cpu_family, err = cpu_family.communicate()
            cpu_family = cpu_family.split(":")
            cpu_family = cpu_family[1]
            self.logger.info("cpu_family successful")
            return cpu_family
        except Exception as e:
            self.logger.error("cpu_family failed", exc_info=True)
            return None

    def network_interface_details(self):
        """Get NIC details for cluster hardware.

        Returns:
            nic_details (str): NIC details
        """

        try:
            subprocess.getoutput('ip -o -4 a show | cut -d " " -f 2,7 > nic_ip.txt')
            fin = open("nic_ip.txt", "r")
            fout = open("nic_ip.csv", "w")
            for iterator in fin:
                fout.write(re.sub("[^\S\r\n]{1,}", ",", iterator))
            fin.close()
            fout.close()
            column_names = ["nic", "ipv4"]
            nic_details = pd.read_csv("./nic_ip.csv", names=column_names, header=None)
            subprocess.Popen(
                "rm -rf ./nic_ip.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            subprocess.Popen(
                "rm -rf ./nic_ip.txt",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            delete_row = nic_details[nic_details["nic"] == "lo"].index
            nic_details = nic_details.drop(delete_row)
            self.logger.info("network_interface_details successful")
            return nic_details
        except Exception as e:
            self.logger.error("network_interface_details failed", exc_info=True)
            return None

    def applied_patches(self):
        """Get List of security patches present in cluster.

        Returns:
            patch_dataframe (DataFrame): List of security patches.
            os_name (str): OS distribution
        """

        try:
            os_name = subprocess.Popen(
                "grep PRETTY_NAME /etc/os-release",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            os_name.wait(10)
            os_name, err = os_name.communicate()
            os_name = os_name.lower()
            if "centos" in os_name or "red hat" in os_name:
                subprocess.getoutput(
                    "sudo yum updateinfo list security installed | grep /Sec > security_level.csv"
                )
                fin = open("security_level.csv", "r")
                fout = open("security_final.csv", "w")
                for iterator in fin:
                    fout.write(re.sub("[^\S\r\n]{1,}", ",", iterator))
                fin.close()
                fout.close()
                column_names = ["Advisory_Name", "Severity", "Security_Package"]
                security_df = pd.read_csv(
                    "./security_final.csv", names=column_names, header=None
                )
                subprocess.Popen(
                    "rm -rf ./security_level.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                subprocess.Popen(
                    "rm -rf ./security_final.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                subprocess.check_output(
                    "bash YUM_Get_Patch_Date.sh", shell=True, stderr=subprocess.STDOUT
                )
                fin = open("patch_date.csv", "r")
                fout = open("security_patch_date.csv", "w")
                for iterator in fin:
                    fout.write(re.sub(r"^([^\s]*)\s+", r"\1, ", iterator))
                fin.close()
                fout.close()
                column_names = ["Security_Package", "Patch_Deployed_Date"]
                patch_date_df = pd.read_csv(
                    "./security_patch_date.csv", names=column_names, header=None
                )
                patch_date_df["Patch_Deployed_Date"] = pd.to_datetime(
                    patch_date_df.Patch_Deployed_Date
                )
                patch_date_df["Patch_Deployed_Date"] = patch_date_df[
                    "Patch_Deployed_Date"
                ].dt.strftime("%d-%b-%Y")
                subprocess.Popen(
                    "rm -rf ./patch_date.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                subprocess.Popen(
                    "rm -rf ./security_patch_date.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                patch_dataframe = pd.merge(
                    security_df, patch_date_df, on="Security_Package", how="inner"
                )
            elif "debian" in os_name or "ubuntu" in os_name:
                subprocess.Popen(
                    "sudo apt-show-versions 2>/dev/null | grep security | grep all | sort -u | head -10 > ./output.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                fin = open("output.csv", "r")
                fout = open("ubuntu_patches.csv", "w")
                for iterator in fin:
                    fout.write(re.sub("[^\S\r\n]{1,}", ",", iterator))
                fin.close()
                fout.close()
                column_names = ["Security_Package", "Patch_Version", "Update_Status"]
                patch_data = pd.read_csv(
                    "./ubuntu_patches.csv", names=column_names, header=None
                )
                patch_data = patch_data["Security_Package"].str.split(":").str[0]
                patch_dataframe = patch_data.to_frame()
                subprocess.Popen(
                    "rm -rf ./output.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                subprocess.Popen(
                    "rm -rf ./ubuntu_patches.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
            else:
                patch_dataframe = pd.DataFrame(
                    ["Operating System is Not Supported"], columns=["Supported_Status"]
                )
            self.logger.info("applied_patches successful")
            return patch_dataframe, os_name
        except Exception as e:
            self.logger.error("applied_patches failed", exc_info=True)
            return None

    def list_hadoop_nonhadoop_libs(self):
        """Get List of hadoop and non-hadoop libraries present in cluster.

        Returns:
            hadoop_native_df (DataFrame): List of hadoop and non-hadoop libraries.
        """

        try:
            subprocess.Popen(
                "hadoop checknative -a 2>/dev/null | grep true | head -10 > ./hadoop_native.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            fin = open("hadoop_native.csv", "r")
            fout = open("hadoop_native_library.csv", "w")
            for iterator in fin:
                fout.write(re.sub("[^\S\r\n]{1,}", ",", iterator))
            fin.close()
            fout.close()
            column_names = ["Hadoop_Libraries", "Status", "Library_Path"]
            hadoop_native_df = pd.read_csv(
                "./hadoop_native_library.csv", names=column_names, header=None
            )
            subprocess.Popen(
                "rm -rf ./hadoop_native_library.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            subprocess.Popen(
                "rm -rf ./hadoop_native.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            hadoop_native_df["Hadoop_Libraries"] = hadoop_native_df[
                "Hadoop_Libraries"
            ].str.rstrip(":")
            hadoop_native_df.drop(["Status", "Library_Path"], axis=1, inplace=True)
            subprocess.Popen(
                "ls /usr/local/lib/ | tr -d ' ' | head -10 > ./user_libs.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            column_names = ["Non_Hadoop_Libraries"]
            custom_lib = pd.read_csv("./user_libs.csv", names=column_names, header=None)
            subprocess.Popen(
                "rm -rf ./user_libs.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            hadoop_native_df["Non_Hadoop_Libraries"] = custom_lib[
                "Non_Hadoop_Libraries"
            ]
            hadoop_native_df["Non_Hadoop_Libraries"] = hadoop_native_df[
                "Non_Hadoop_Libraries"
            ].fillna("")
            self.logger.info("list_hadoop_nonhadoop_libs successful")
            return hadoop_native_df
        except Exception as e:
            self.logger.error("list_hadoop_nonhadoop_libs failed", exc_info=True)
            return None

    def check_libraries_installed(self):
        """Get check whether python, java and scala are installed in cluster.

        Returns:
            python_flag (int): Check for python installation.
            java_flag (int): Check for java installation.
            scala_flag (int): Check for scala installation.
        """

        try:
            python_flag, java_flag, scala_flag = 0, 0, 0
            jdk_line, scala_line = "", ""
            python_check = subprocess.Popen(
                "python3 --version",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            python_check.wait(10)
            python_check, err = python_check.communicate()
            os_name = subprocess.Popen(
                "grep PRETTY_NAME /etc/os-release",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            os_name.wait(10)
            os_name, err = os_name.communicate()
            os_name = os_name.lower()
            if "centos" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa 2>/dev/null | grep java > ./java_check.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
            elif "debian" in os_name:
                softwares_installed = subprocess.Popen(
                    "dpkg -l | grep java > ./java_check.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
            elif "ubuntu" in os_name:
                softwares_installed = subprocess.Popen(
                    "apt list --installed 2>/dev/null | grep java > ./java_check.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
            elif "red hat" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa | grep java > ./java_check.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
            elif "suse" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa | grep java > ./java_check.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
            if "Python 3." in python_check:
                python_flag = 1
            with open("java_check.csv", "r") as fp:
                for jdk_line in fp:
                    if "openjdk" in jdk_line:
                        java_flag = 1
                        break
            subprocess.Popen(
                "rm -rf ./java_check.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            os.popen("timeout -k 30 29 spark-shell > ./scala.csv 2>/dev/null").read()
            spark_scala = subprocess.Popen(
                "cat ./scala.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            )
            spark_scala.wait(10)
            out, err = spark_scala.communicate()
            if "Spark context available as" in out:
                scala_flag = 1
            subprocess.Popen(
                "rm -rf ./scala.csv 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            self.logger.info("check_libraries_installed successful")
            return python_flag, java_flag, scala_flag
        except Exception as e:
            self.logger.error("check_libraries_installed failed", exc_info=True)
            return None

    def security_software(self):
        """Get list of security software present in cluster.

        Returns:
            security_software (dict): List of security software.
        """

        try:
            cyberSecurity = subprocess.Popen(
                'find / -type f \( -iname "knox-server" -o -iname "grr" -o -iname "splunk" -o -iname "MISP" -o -iname "TheHive-Project" -o -iname "nagios.cfg" \) 2>/dev/null',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            cyberSecurity.wait()
            cyberSecurity, err = cyberSecurity.communicate()
            Cloudera_navigator = subprocess.Popen(
                "ls /*/*/*/webapp/static/release/js/cloudera/navigator 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            Cloudera_navigator.wait(10)
            out, err = Cloudera_navigator.communicate()
            security_software = {}
            if cyberSecurity.find("knox-server") == -1:
                security_software["knox"] = "Knox-server is not installed"
            else:
                security_software["knox"] = "Knox-server is installed"
            if cyberSecurity.find("splunk") == -1:
                security_software["splunk"] = "Splunk is not installed"
            else:
                security_software["splunk"] = "Splunk is installed"
            if cyberSecurity.find("nagios") == -1:
                security_software["nagios"] = "Nagios is not installed"
            else:
                security_software["nagios"] = "Nagios is installed"
            if cyberSecurity.find("GRR") == -1:
                security_software["grr"] = "GRR Rapid responce is not installed"
            else:
                security_software["grr"] = "GRR Rapid responce is installed"
            if cyberSecurity.find("MISP") == -1:
                security_software["misp"] = "MISP is not installed"
            else:
                security_software["misp"] = "MISP is installed"
            if cyberSecurity.find("thehive") == -1:
                security_software["thehive"] = "TheHive is not installed"
            else:
                security_software["thehive"] = "TheHive is installed"
            osquery = subprocess.Popen(
                "yum list installed osquery 2>/dev/null | grep osquery",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            osquery.wait(10)
            osquery, err = osquery.communicate()
            if not osquery:
                security_software["osquery"] = "OSQuery is not installed"
            else:
                security_software["osquery"] = "OSQuery is installed"
            if not out:
                security_software[
                    "cloudera_navigator"
                ] = "Cloudera Navigator is not installed"
            else:
                security_software[
                    "cloudera_navigator"
                ] = "Cloudera Navigator is installed"
            security_software["ranger"] = "Ranger is not installed"
            try:
                r = None
                if self.version == 7:
                    r = requests.get(
                        "{}://{}:{}/api/v40/clusters/{}/services".format(
                            self.http,
                            self.cloudera_manager_host_ip,
                            self.cloudera_manager_port,
                            self.cluster_name,
                        ),
                        auth=HTTPBasicAuth(
                            self.cloudera_manager_username,
                            self.cloudera_manager_password,
                        ),
                        verify=False,
                    )
                    if r.status_code == 200:
                        r = r.json()
                        inter = ""
                        for i in range(0, len(r["items"])):
                            cluster_service_item = r["items"][i]["name"]
                            inter += cluster_service_item + ","
                        if inter.find("ranger") != -1:
                            security_software["ranger"] = "Ranger is installed"
            except Exception as e:
                security_software["ranger"] = "Ranger is not installed"
            self.logger.info("security_software successful")
            return security_software
        except Exception as e:
            self.logger.error("security_software failed", exc_info=True)
            return None

    def speciality_hardware(self):
        """Get check whether GPU is present in cluster.

        Returns:
            gpu_status (str): Check for GPU.
        """

        try:
            gpu_status = subprocess.Popen(
                'lshw | egrep -i -c "non-vga"',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            gpu_status.wait(10)
            gpu_status, err = gpu_status.communicate()
            self.logger.info("speciality_hardware successful")
            return gpu_status
        except Exception as e:
            self.logger.error("speciality_hardware failed", exc_info=True)
            return None
