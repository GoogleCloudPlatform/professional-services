# ------------------------------------------------------------------------------
# This module contains the logic to retrieve information of the features of the
# category application. This module also contains the logic related to YARN
# Resource manager API and other Generic features.
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class ApplicationAPI:
    """This Class has functions related to Application category.

    Has functions which fetch different application metrics from Hadoop cluster 
    like yarn, Hbase, Kafka, etc.

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
        self.broker_list = inputs["broker_list"]
        self.config_path = inputs["config_path"]
        self.logger = inputs["logger"]
        self.ssl = inputs["ssl"]
        if self.ssl:
            self.http = "https"
        else:
            self.http = "http"
        self.start_date = inputs["start_date"]
        self.end_date = inputs["end_date"]

    def get_application_details(self, yarn_rm, yarn_port):
        """Get list of all yarn related application over a date range.

        Args:
            yarn_rm (str): Yarn resource manager IP.
        Returns:
            yarn_application_df (DataFrame): List of yarn related application in cluster.
        """

        try:
            r = requests.get(
                "{}://{}:{}/ws/v1/cluster/apps".format(self.http, yarn_rm, yarn_port),
                verify=False,
            )
            if r.status_code == 200:
                yarn_application = r.json()
                yarn_application_list = yarn_application["apps"]["app"]
                yarn_application_df = pd.DataFrame(yarn_application_list)
                if self.version == 7:
                    yarn_application_df = pd.DataFrame(
                        {
                            "ApplicationId": yarn_application_df["id"],
                            "ApplicationType": yarn_application_df["applicationType"],
                            "LaunchTime": pd.to_datetime(
                                (yarn_application_df["launchTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "StartedTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "FinishedTime": pd.to_datetime(
                                (yarn_application_df["finishedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "ElapsedTime": (yarn_application_df["elapsedTime"] + 500)
                            / 1000,
                            "FinalStatus": yarn_application_df["finalStatus"],
                            "MemorySeconds": yarn_application_df["memorySeconds"],
                            "VcoreSeconds": yarn_application_df["vcoreSeconds"],
                            "User": yarn_application_df["user"],
                            "Diagnostics": yarn_application_df["diagnostics"],
                            "Queue": yarn_application_df["queue"],
                            "Name": yarn_application_df["name"],
                        }
                    )
                    yarn_application_df = yarn_application_df[
                        (yarn_application_df["StartedTime"] < (self.end_date))
                        & (yarn_application_df["StartedTime"] >= (self.start_date))
                        & (yarn_application_df["LaunchTime"] >= (self.start_date))
                        & (yarn_application_df["FinishedTime"] >= (self.start_date))
                    ]
                elif self.version == 6:
                    yarn_application_df = pd.DataFrame(
                        {
                            "ApplicationId": yarn_application_df["id"],
                            "ApplicationType": yarn_application_df["applicationType"],
                            "LaunchTime": pd.to_datetime(
                                (yarn_application_df["launchTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "StartedTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "FinishedTime": pd.to_datetime(
                                (yarn_application_df["finishedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "ElapsedTime": (yarn_application_df["elapsedTime"] + 500)
                            / 1000,
                            "FinalStatus": yarn_application_df["finalStatus"],
                            "MemorySeconds": yarn_application_df["memorySeconds"],
                            "VcoreSeconds": yarn_application_df["vcoreSeconds"],
                            "User": yarn_application_df["user"],
                            "Diagnostics": yarn_application_df["diagnostics"],
                            "Queue": yarn_application_df["queue"],
                            "Name": yarn_application_df["name"],
                        }
                    )
                    yarn_application_df = yarn_application_df[
                        (yarn_application_df["StartedTime"] < (self.end_date))
                        & (yarn_application_df["StartedTime"] >= (self.start_date))
                        & (yarn_application_df["LaunchTime"] >= (self.start_date))
                        & (yarn_application_df["FinishedTime"] >= (self.start_date))
                    ]
                elif self.version == 5:
                    yarn_application_df = pd.DataFrame(
                        {
                            "ApplicationId": yarn_application_df["id"],
                            "ApplicationType": yarn_application_df["applicationType"],
                            "LaunchTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "StartedTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "FinishedTime": pd.to_datetime(
                                (yarn_application_df["finishedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "ElapsedTime": (yarn_application_df["elapsedTime"] + 500)
                            / 1000,
                            "FinalStatus": yarn_application_df["finalStatus"],
                            "MemorySeconds": yarn_application_df["memorySeconds"],
                            "VcoreSeconds": yarn_application_df["vcoreSeconds"],
                            "User": yarn_application_df["user"],
                            "Diagnostics": yarn_application_df["diagnostics"],
                            "Queue": yarn_application_df["queue"],
                            "Name": yarn_application_df["name"],
                        }
                    )
                    yarn_application_df = yarn_application_df[
                        (yarn_application_df["StartedTime"] < (self.end_date))
                        & (yarn_application_df["StartedTime"] >= (self.start_date))
                        & (yarn_application_df["FinishedTime"] >= (self.start_date))
                    ]
                else:
                    yarn_application_df = pd.DataFrame(
                        {
                            "ApplicationId": yarn_application_df["id"],
                            "ApplicationType": yarn_application_df["applicationType"],
                            "LaunchTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "StartedTime": pd.to_datetime(
                                (yarn_application_df["startedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "FinishedTime": pd.to_datetime(
                                (yarn_application_df["finishedTime"] + 500) / 1000,
                                unit="s",
                            ),
                            "ElapsedTime": (yarn_application_df["elapsedTime"] + 500)
                            / 1000,
                            "FinalStatus": yarn_application_df["finalStatus"],
                            "MemorySeconds": yarn_application_df["memorySeconds"],
                            "VcoreSeconds": yarn_application_df["vcoreSeconds"],
                            "User": yarn_application_df["user"],
                            "Diagnostics": yarn_application_df["diagnostics"],
                            "Queue": yarn_application_df["queue"],
                            "Name": yarn_application_df["name"],
                        }
                    )
                    yarn_application_df = yarn_application_df[
                        (yarn_application_df["StartedTime"] < (self.end_date))
                        & (yarn_application_df["StartedTime"] >= (self.start_date))
                        & (yarn_application_df["FinishedTime"] >= (self.start_date))
                    ]
                yarn_application_df = yarn_application_df.reset_index(drop=True)
                self.logger.info("get_application_details successful")
                return yarn_application_df
            else:
                self.logger.error(
                    "get_application_details failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_application_details failed", exc_info=True)
            return None

    def get_application_type_status_count(self, yarn_application_df):
        """Get yarn related application count based to its type and status.

        Args:
            yarn_application_df (DataFrame): List of yarn related application in cluster.
        Returns:
            app_count_df (DataFrame): Application count in yarn.
            app_type_count_df (DataFrame): Application count by type in yarn.
            app_status_count_df (DataFrame): Application count by status in yarn.
        """

        try:
            app_count_df = pd.DataFrame(
                {
                    "Application Type": yarn_application_df["ApplicationType"],
                    "Status": yarn_application_df["FinalStatus"],
                    "Count": 1,
                }
            )
            app_count_df = app_count_df.groupby(["Application Type", "Status"]).sum()
            app_count_df.index = app_count_df.index.set_names(
                ["Application Type", "Status"]
            )
            app_count_df.reset_index(inplace=True)
            app_type_count_df = app_count_df[["Application Type", "Count"]]
            app_type_count_df = app_type_count_df.groupby(["Application Type"]).sum()
            app_status_count_df = app_count_df[["Status", "Count"]]
            app_status_count_df = app_status_count_df.groupby(["Status"]).sum()
            self.logger.info("get_application_type_status_count successful")
            return app_count_df, app_type_count_df, app_status_count_df
        except Exception as e:
            self.logger.error("get_application_type_status_count failed", exc_info=True)
            return None

    def streaming_jobs(self, yarn_application_df):
        """Get a list of streaming application in cluster.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            only_streaming (str): List of streaming application.
        """

        try:
            spark_streaming_status = 0
            file_paths = subprocess.check_output(
                "hdfs dfs -ls /user/spark/applicationHistory | awk ' {print $8} ' | head -n 10",
                shell=True,
            )
            file_paths = str(file_paths)
            list1 = file_paths.split("\\n")
            list1.pop(0)
            list1.pop(-1)
            file_paths2 = subprocess.check_output(
                "hdfs dfs -ls /user/spark/applicationHistory | awk ' {print $8} ' | tail -n 10",
                shell=True,
            )
            file_paths2 = str(file_paths2)
            list2 = file_paths2.split("\\n")
            list2.pop(0)
            list2.pop(-1)
            list3 = list(set(list1) & set(list2))
            for i in range(0, len(list1)):
                command = "hdfs dfs -cat " + list1[i]
                json_dt = subprocess.check_output(command, shell=True)
                parse_str = str(json_dt)
                if re.search(r"\borg.apache.spark.streaming\b", parse_str):
                    spark_streaming_status = 1
            spark_streaming_status = int(spark_streaming_status)
            Streaming_Applications = ["KAFKA", "FLUME", "STORM", "SAMZA"]
            column_names = ["ApplicationType"]
            yarn_manager_df = pd.DataFrame(columns=column_names)
            yarn_application_df["ApplicationType"] = yarn_application_df[
                "ApplicationType"
            ].str.upper()
            yarn_manager_df = yarn_manager_df.append(
                yarn_application_df, ignore_index=True
            )
            yarn_manager_df.drop(
                yarn_manager_df.columns.difference(["ApplicationType"]), 1, inplace=True
            )
            yarn_manager_df.drop_duplicates(subset="ApplicationType", inplace=True)
            yarn_manager_df.drop(
                yarn_manager_df.loc[
                    yarn_manager_df["ApplicationType"] == "SPARK"
                ].index,
                inplace=True,
            )
            for application in Streaming_Applications:
                only_streaming = yarn_manager_df[
                    yarn_manager_df["ApplicationType"] == application
                ]
            if spark_streaming_status == 1:
                insert_spark_if_streaming = {"ApplicationType": "SPARK"}
                only_streaming = only_streaming.append(
                    insert_spark_if_streaming, ignore_index=True
                )
            self.logger.info("streaming_jobs successful")
            return only_streaming
        except Exception as e:
            self.logger.error("streaming_jobs failed", exc_info=True)
            return None

    def dynamic_resouce_pool(self):
        """Get dynamic resource pool information of cluster.

        Returns:
            resource (str): Dynamic resource pool information.
        """

        try:
            resource = subprocess.Popen(
                "ls /run/cloudera-scm-agent/process 2>/dev/null | grep refresh",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out, err = resource.communicate()
            if not out:
                resource = "Dynamic resource pool is not Configured"
            else:
                resource = "Dynamic resource pool are Configured"
            self.logger.info("dynamic_resouce_pool successful")
            return resource
        except Exception as e:
            self.logger.error("dynamic_resouce_pool failed", exc_info=True)
            return None

    def identify_ha(self):
        """Get HA config for various services.

        Returns:
            zookeeper_ha (str): ZooKeeper HA config
            hive_ha (str): Hive HA config
            yarn_ha (str): Yarn HA config
            hdfs_ha (str): HDFS HA config
        """

        try:
            hdfs_ha = 0
            yarn_ha = 0
            hive_ha = 0
            zookeeper_ha = 0
            data_hdfs = subprocess.Popen(
                "cat {} | grep dfs.nameservices".format(self.config_path["hdfs"]),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out_1, err = data_hdfs.communicate()
            if len(out_1) > 0:
                hdfs_ha = 1
            else:
                hdfs_ha = 0
            data_yarn = subprocess.Popen(
                "cat {} | grep yarn.resourcemanager.ha.enabled".format(
                    self.config_path["yarn"]
                ),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out_2, err = data_yarn.communicate()
            if len(out_2) > 0:
                yarn_ha = 1
            else:
                yarn_ha = 0
            data_hive = subprocess.Popen(
                " cat {}".format(self.config_path["hive"]),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out_3, err = data_hive.communicate()
            root = ET.fromstring(out_3)
            for val in root.findall("property"):
                name = val.find("name").text
                if "hive.metastore.uri" not in name:
                    root.remove(val)
            value = root[0][1].text
            count_hive = value.count(",") + 1
            if count_hive > 1:
                hive_ha = 1
            else:
                hive_ha = 0
            xml_data = subprocess.Popen(
                "cat {}".format(self.config_path["hive"]),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out, err = xml_data.communicate()
            root = ET.fromstring(out)
            for val in root.findall("property"):
                name = val.find("name").text
                if "hive.zookeeper.quorum" not in name:
                    root.remove(val)
            value = root[0][1].text
            count_zookepper = value.count(",") + 1
            if count_zookepper > 1:
                zookeeper_ha = 1
            else:
                zookeeper_ha = 0
            self.logger.info("identify_ha successful")
            return zookeeper_ha, hive_ha, yarn_ha, hdfs_ha
        except Exception as e:
            self.logger.error("identify_ha failed", exc_info=True)
            return None

    def get_application_vcore_memory_usage(self, yarn_application_df):
        """Get vcore and memory usage of yarn application.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            app_vcore_df (DataFrame): Vcores usage by applications
            app_memory_df (DataFrame): Memory usage by applications
        """

        try:
            app_vcore_df = pd.DataFrame(
                {
                    "Application Type": yarn_application_df["ApplicationType"],
                    "Vcore": yarn_application_df["VcoreSeconds"],
                }
            )
            app_vcore_df = app_vcore_df.groupby(["Application Type"]).sum()
            app_memory_df = pd.DataFrame(
                {
                    "Application Type": yarn_application_df["ApplicationType"],
                    "Memory": yarn_application_df["MemorySeconds"],
                }
            )
            app_memory_df = app_memory_df.groupby(["Application Type"]).sum()
            self.logger.info("get_application_vcore_memory_usage successful")
            return app_vcore_df, app_memory_df
        except Exception as e:
            self.logger.error(
                "get_application_vcore_memory_usage failed", exc_info=True
            )
            return None

    def get_job_launch_frequency(self, yarn_application_df):
        """Get details about job launch frequency of yarn application.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            job_launch_df (DataFrame): Job launch frequency of applications.
        """

        try:
            job_launch_df = pd.DataFrame(
                {
                    "Name": yarn_application_df["Name"],
                    "ApplicationType": yarn_application_df["ApplicationType"],
                    "StartedTime": pd.to_datetime(
                        yarn_application_df["StartedTime"]
                    ).dt.strftime("%Y-%m"),
                    "Count": 1,
                    "frequency": "",
                }
            )
            job_launch_df = (
                job_launch_df.groupby(
                    ["StartedTime", "Name", "ApplicationType"], as_index=False
                )
                .sum()
                .sort_values(by="StartedTime", ascending=False)
            )
            job_launch_df = job_launch_df.drop_duplicates(
                subset="Name", keep="first"
            ).reset_index(drop=True)
            job_launch_df.loc[job_launch_df["Count"] > 20, "frequency"] = "Daily"
            job_launch_df.loc[job_launch_df["Count"] <= 20, "frequency"] = "Weekly"
            job_launch_df.loc[job_launch_df["Count"] <= 2, "frequency"] = "Monthly"
            job_launch_df = job_launch_df.drop(["StartedTime"], axis=1)
            self.logger.info("get_job_launch_frequency successful")
            return job_launch_df
        except Exception as e:
            self.logger.error("get_job_launch_frequency failed", exc_info=True)
            return None

    def get_bursty_application_details(self, yarn_application_df):
        """Get details about busrty yarn application.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            bursty_app_time_df (DataFrame): Time taken by bursty application.
            bursty_app_vcore_df (DataFrame): Vcores taken by bursty application.
            bursty_app_mem_df (DataFrame): Memory taken by bursty application.
        """

        try:
            bursty_app_time_df = pd.DataFrame(
                columns=["Application Name", "Min", "Mean", "Max"]
            )
            bursty_app_vcore_df = pd.DataFrame(
                columns=["Application Name", "Min", "Mean", "Max"]
            )
            bursty_app_mem_df = pd.DataFrame(
                columns=["Application Name", "Min", "Mean", "Max"]
            )
            count = 0
            for apps in yarn_application_df["Name"].unique():
                if apps == "Spark shell":
                    continue
                bursty_app_check = yarn_application_df[
                    yarn_application_df["Name"] == apps
                ]
                min_time = bursty_app_check["ElapsedTime"].min()
                max_time = bursty_app_check["ElapsedTime"].max()
                if (max_time / min_time) > 15.0:
                    count = count + 1
                    bursty_app_time_tmp_df = pd.DataFrame(
                        {
                            "Application Name": apps,
                            "Min": min_time,
                            "Mean": bursty_app_check["ElapsedTime"].mean(),
                            "Max": max_time,
                        },
                        index=[count],
                    )
                    bursty_app_vcore_tmp_df = pd.DataFrame(
                        {
                            "Application Name": apps,
                            "Min": bursty_app_check[
                                bursty_app_check["ElapsedTime"] == min_time
                            ]["VcoreSeconds"].iloc[0],
                            "Mean": bursty_app_check["VcoreSeconds"].mean(),
                            "Max": bursty_app_check[
                                bursty_app_check["ElapsedTime"] == max_time
                            ]["VcoreSeconds"].iloc[0],
                        },
                        index=[count],
                    )
                    bursty_app_mem_tmp_df = pd.DataFrame(
                        {
                            "Application Name": apps,
                            "Min": bursty_app_check[
                                bursty_app_check["ElapsedTime"] == min_time
                            ]["MemorySeconds"].iloc[0],
                            "Mean": bursty_app_check["MemorySeconds"].mean(),
                            "Max": bursty_app_check[
                                bursty_app_check["ElapsedTime"] == max_time
                            ]["MemorySeconds"].iloc[0],
                        },
                        index=[count],
                    )
                    bursty_app_time_df = bursty_app_time_df.append(
                        bursty_app_time_tmp_df
                    )
                    bursty_app_mem_df = bursty_app_mem_df.append(bursty_app_mem_tmp_df)
                    bursty_app_vcore_df = bursty_app_vcore_df.append(
                        bursty_app_vcore_tmp_df
                    )
            self.logger.info("get_bursty_application_details successful")
            return bursty_app_time_df, bursty_app_vcore_df, bursty_app_mem_df
        except Exception as e:
            self.logger.error("get_bursty_application_details failed", exc_info=True)
            return None

    def get_failed_application_details(self, yarn_application_df):
        """Get details about failed or killed yarn application.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            yarn_failed_app (DataFrame): RCA of failed or killed application.
        """

        try:
            yarn_failed_app = yarn_application_df[
                (yarn_application_df["FinalStatus"] == "KILLED")
                | (yarn_application_df["FinalStatus"] == "FAILED")
            ].sort_values(by="ElapsedTime", ascending=False)
            self.logger.info("get_failed_application_details successful")
            return yarn_failed_app
        except Exception as e:
            self.logger.error("get_failed_application_details failed", exc_info=True)
            return None

    def get_yarn_total_vcore(self, yarn_rm, yarn_port):
        """Get total vcores allocated to yarn.

        Args:
            yarn_rm (str): Yarn resource manager IP.
        Returns:
            yarn_total_vcores_count (float): Total vcores configured to yarn
        """

        try:
            r = requests.get(
                "{}://{}:{}/ws/v1/cluster/metrics".format(
                    self.http, yarn_rm, yarn_port
                ),
                verify=False,
            )
            if r.status_code == 200:
                yarn_total_vcores = r.json()
                yarn_total_vcores_count = math.ceil(
                    yarn_total_vcores["clusterMetrics"]["totalVirtualCores"]
                )
                self.logger.info("get_yarn_total_vcore successful")
                return yarn_total_vcores_count
            else:
                self.logger.error(
                    "get_yarn_total_vcore failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("get_yarn_total_vcore failed", exc_info=True)
            return None

    def get_yarn_vcore_available(self, cluster_name):
        """Get yarn vcore availability data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_vcore_available_df (DataFrame): Vcores available over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_yarn_vcore_available failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_vcore_available = r.json()
                yarn_vcore_available_list = yarn_vcore_available["items"][0][
                    "timeSeries"
                ][0]["data"]
                yarn_vcore_available_df = pd.DataFrame(yarn_vcore_available_list)
                yarn_vcore_available_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_vcore_available_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_vcore_available_df["value"],
                        "Min": yarn_vcore_available_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_vcore_available_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_vcore_available_df["DateTime"] = pd.to_datetime(
                    yarn_vcore_available_df["DateTime"]
                )
                yarn_vcore_available_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_vcore_available_df["DateTime"].min(),
                            yarn_vcore_available_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_vcore_available_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_vcore_available_df[
                    "Time"
                ] = yarn_vcore_available_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_vcore_available_df = yarn_vcore_available_df.set_index("Time")
                self.logger.info("get_yarn_vcore_available successful")
                return yarn_vcore_available_df
            else:
                self.logger.error(
                    "get_yarn_vcore_available failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_yarn_vcore_available failed", exc_info=True)
            return None

    def get_yarn_vcore_allocated(self, cluster_name):
        """Get yarn vcore allocation data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_vcore_allocated_avg (float): Average vcores allocated in cluster.
            yarn_vcore_allocated_df (DataFrame): Vcores allocation over time.
            yarn_vcore_allocated_pivot_df (DataFrame): Seasonality of vcores allocation over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_yarn_vcore_allocated failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_vcore_allocated = r.json()
                yarn_vcore_allocated_list = yarn_vcore_allocated["items"][0][
                    "timeSeries"
                ][0]["data"]
                yarn_vcore_allocated_df = pd.DataFrame(yarn_vcore_allocated_list)
                yarn_vcore_allocated_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_vcore_allocated_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_vcore_allocated_df["value"],
                        "Min": yarn_vcore_allocated_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_vcore_allocated_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_vcore_allocated_df["DateTime"] = pd.to_datetime(
                    yarn_vcore_allocated_df["DateTime"]
                )
                yarn_vcore_allocated_avg = (
                    yarn_vcore_allocated_df["Mean"].sum()
                    / yarn_vcore_allocated_df["DateTime"].count()
                )
                yarn_vcore_allocated_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_vcore_allocated_df["DateTime"].min(),
                            yarn_vcore_allocated_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_vcore_allocated_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_vcore_allocated_df[
                    "Time"
                ] = yarn_vcore_allocated_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_vcore_allocated_df = yarn_vcore_allocated_df.set_index("Time")
                yarn_vcore_allocated_pivot_df = yarn_vcore_allocated_df[
                    ["DateTime", "Mean"]
                ]
                yarn_vcore_allocated_pivot_df = yarn_vcore_allocated_pivot_df.reset_index(
                    drop=True
                )
                yarn_vcore_allocated_pivot_df["Day"] = yarn_vcore_allocated_pivot_df[
                    "DateTime"
                ].dt.strftime("%A")
                yarn_vcore_allocated_pivot_df["Time"] = yarn_vcore_allocated_pivot_df[
                    "DateTime"
                ].dt.strftime("%H:%M")
                yarn_vcore_allocated_pivot_df = yarn_vcore_allocated_pivot_df.drop(
                    ["DateTime"], axis=1
                )
                yarn_vcore_allocated_pivot_df = pd.pivot_table(
                    yarn_vcore_allocated_pivot_df,
                    index="Day",
                    columns="Time",
                    values="Mean",
                )
                yarn_vcore_allocated_pivot_df = yarn_vcore_allocated_pivot_df.fillna(0)
                self.logger.info("get_yarn_vcore_allocated successful")
                return (
                    yarn_vcore_allocated_avg,
                    yarn_vcore_allocated_df,
                    yarn_vcore_allocated_pivot_df,
                )
            else:
                self.logger.error(
                    "get_yarn_vcore_allocated failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_yarn_vcore_allocated failed", exc_info=True)
            return None

    def get_yarn_total_memory(self, yarn_rm, yarn_port):
        """Get total memory allocated to yarn.

        Args:
            yarn_rm (str): Yarn resource manager IP.
        Returns:
            yarn_total_memory_count (float): Total memory configured to yarn.
        """

        try:
            r = requests.get(
                "{}://{}:{}/ws/v1/cluster/metrics".format(
                    self.http, yarn_rm, yarn_port
                ),
                verify=False,
            )
            if r.status_code == 200:
                yarn_total_memory = r.json()
                yarn_total_memory_count = math.ceil(
                    yarn_total_memory["clusterMetrics"]["totalMB"] / 1024
                )
                self.logger.info("get_yarn_total_memory successful")
                return yarn_total_memory_count
            else:
                self.logger.error(
                    "get_yarn_total_memory failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_yarn_total_memory failed", exc_info=True)
            return None

    def get_yarn_memory_available(self, cluster_name):
        """Get yarn memory availability data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_memory_available_df (DataFrame): Memory available over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_available_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_yarn_memory_available failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_memory_available = r.json()
                yarn_memory_available_list = yarn_memory_available["items"][0][
                    "timeSeries"
                ][0]["data"]
                yarn_memory_available_df = pd.DataFrame(yarn_memory_available_list)
                yarn_memory_available_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_memory_available_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_memory_available_df["value"],
                        "Min": yarn_memory_available_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_memory_available_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_memory_available_df["DateTime"] = pd.to_datetime(
                    yarn_memory_available_df["DateTime"]
                )
                yarn_memory_available_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_memory_available_df["DateTime"].min(),
                            yarn_memory_available_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_memory_available_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_memory_available_df[
                    "Time"
                ] = yarn_memory_available_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_memory_available_df = yarn_memory_available_df.set_index("Time")
                self.logger.info("get_yarn_memory_available successful")
                return yarn_memory_available_df
            else:
                self.logger.error(
                    "get_yarn_memory_available failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_yarn_memory_available failed", exc_info=True)
            return None

    def get_yarn_memory_allocated(self, cluster_name):
        """Get yarn memory allocation data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_memory_allocated_avg (float): Average memory allocated in cluster.
            yarn_memory_allocated_df (DataFrame): Memory allocation over time.
            yarn_memory_allocated_pivot_df (DataFrame): Seasonality of memory allocation over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_allocated_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_yarn_memory_allocated failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_memory_allocated = r.json()
                yarn_memory_allocated_list = yarn_memory_allocated["items"][0][
                    "timeSeries"
                ][0]["data"]
                yarn_memory_allocated_df = pd.DataFrame(yarn_memory_allocated_list)
                yarn_memory_allocated_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_memory_allocated_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_memory_allocated_df["value"],
                        "Min": yarn_memory_allocated_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_memory_allocated_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_memory_allocated_df["DateTime"] = pd.to_datetime(
                    yarn_memory_allocated_df["DateTime"]
                )
                yarn_memory_allocated_avg = (
                    yarn_memory_allocated_df["Mean"].sum()
                    / yarn_memory_allocated_df["DateTime"].count()
                )
                yarn_memory_allocated_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_memory_allocated_df["DateTime"].min(),
                            yarn_memory_allocated_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_memory_allocated_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_memory_allocated_df[
                    "Time"
                ] = yarn_memory_allocated_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_memory_allocated_df = yarn_memory_allocated_df.set_index("Time")
                yarn_memory_allocated_pivot_df = yarn_memory_allocated_df[
                    ["DateTime", "Mean"]
                ]
                yarn_memory_allocated_pivot_df = yarn_memory_allocated_pivot_df.reset_index(
                    drop=True
                )
                yarn_memory_allocated_pivot_df["Day"] = yarn_memory_allocated_pivot_df[
                    "DateTime"
                ].dt.strftime("%A")
                yarn_memory_allocated_pivot_df["Time"] = yarn_memory_allocated_pivot_df[
                    "DateTime"
                ].dt.strftime("%H:%M")
                yarn_memory_allocated_pivot_df = yarn_memory_allocated_pivot_df.drop(
                    ["DateTime"], axis=1
                )
                yarn_memory_allocated_pivot_df = pd.pivot_table(
                    yarn_memory_allocated_pivot_df,
                    index="Day",
                    columns="Time",
                    values="Mean",
                )
                yarn_memory_allocated_pivot_df = yarn_memory_allocated_pivot_df.fillna(
                    0
                )
                self.logger.info("get_yarn_memory_allocated successful")
                return (
                    yarn_memory_allocated_avg,
                    yarn_memory_allocated_df,
                    yarn_memory_allocated_pivot_df,
                )
            else:
                self.logger.error(
                    "get_yarn_memory_allocated failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_yarn_memory_allocated failed", exc_info=True)
            return None

    def get_vcore_memory_by_application(self, yarn_application_df):
        """Get vcore and memory breakdown by yarn application.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            app_vcore_df (DataFrame): Vcore breakdown by application
            app_vcore_usage_df (DataFrame): Vcore usage over time
            app_memory_df (DataFrame): Memory breakdown by application
            app_memory_usage_df (DataFrame): Memory usage over time
        """

        try:
            app_vcore_df = pd.DataFrame(None)
            app_vcore_df = pd.DataFrame(
                {
                    "Application Id": yarn_application_df["ApplicationId"],
                    "Application Type": yarn_application_df["ApplicationType"],
                    "Launch Time": pd.to_datetime(
                        yarn_application_df["LaunchTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Finished Time": pd.to_datetime(
                        yarn_application_df["FinishedTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Vcore": yarn_application_df["VcoreSeconds"]
                    / yarn_application_df["ElapsedTime"],
                    "Vcore Seconds": yarn_application_df["VcoreSeconds"],
                }
            )
            app_vcore_df["Launch Time"] = pd.to_datetime(
                app_vcore_df["Launch Time"], format="%Y-%m-%d"
            )
            app_vcore_df["Finished Time"] = pd.to_datetime(
                app_vcore_df["Finished Time"], format="%Y-%m-%d"
            )
            app_vcore_usage_df = pd.DataFrame(
                pd.date_range(
                    app_vcore_df["Launch Time"].dt.strftime("%Y-%m-%d %H:%M").min(),
                    app_vcore_df["Finished Time"].dt.strftime("%Y-%m-%d %H:%M").max(),
                    freq="H",
                ),
                columns=["Date"],
            )
            app_memory_df = pd.DataFrame(None)
            app_memory_df = pd.DataFrame(
                {
                    "Application Id": yarn_application_df["ApplicationId"],
                    "Application Type": yarn_application_df["ApplicationType"],
                    "Launch Time": pd.to_datetime(
                        yarn_application_df["LaunchTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Finished Time": pd.to_datetime(
                        yarn_application_df["FinishedTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Memory": yarn_application_df["MemorySeconds"]
                    / yarn_application_df["ElapsedTime"],
                    "Memory Seconds": yarn_application_df["MemorySeconds"],
                }
            )
            app_memory_df["Launch Time"] = pd.to_datetime(
                app_memory_df["Launch Time"], format="%Y-%m-%d"
            )
            app_memory_df["Finished Time"] = pd.to_datetime(
                app_memory_df["Finished Time"], format="%Y-%m-%d"
            )
            app_memory_usage_df = pd.DataFrame(
                pd.date_range(
                    app_memory_df["Launch Time"].dt.strftime("%Y-%m-%d %H:%M").min(),
                    app_memory_df["Finished Time"].dt.strftime("%Y-%m-%d %H:%M").max(),
                    freq="H",
                ),
                columns=["Date"],
            )
            self.logger.info("get_vcore_memory_by_application successful")
            return app_vcore_df, app_vcore_usage_df, app_memory_df, app_memory_usage_df
        except Exception as e:
            self.logger.error("get_vcore_memory_by_application failed", exc_info=True)
            return None

    def get_pending_application(self, cluster_name):
        """Get pending application over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_pending_apps_df (DataFrame): Pending application count over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_pending_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_pending_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_pending_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_pending_application failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_pending_apps = r.json()
                yarn_pending_apps_list = yarn_pending_apps["items"][0]["timeSeries"][0][
                    "data"
                ]
                yarn_pending_apps_df = pd.DataFrame(yarn_pending_apps_list)
                yarn_pending_apps_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_pending_apps_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_pending_apps_df["value"],
                        "Min": yarn_pending_apps_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_pending_apps_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_pending_apps_df["DateTime"] = pd.to_datetime(
                    yarn_pending_apps_df["DateTime"]
                )
                yarn_pending_apps_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_pending_apps_df["DateTime"].min(),
                            yarn_pending_apps_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_pending_apps_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_pending_apps_df[
                    "Time"
                ] = yarn_pending_apps_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_pending_apps_df = yarn_pending_apps_df.set_index("Time")
                self.logger.info("get_pending_application successful")
                return yarn_pending_apps_df
            else:
                self.logger.error(
                    "get_pending_application failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_pending_application failed", exc_info=True)
            return None

    def get_pending_memory(self, cluster_name):
        """Get pending memory over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_pending_memory_df (DataFrame): Pending memory over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_memory_mb_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_pending_memory failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_pending_memory = r.json()
                yarn_pending_memory_list = yarn_pending_memory["items"][0][
                    "timeSeries"
                ][0]["data"]
                yarn_pending_memory_df = pd.DataFrame(yarn_pending_memory_list)
                yarn_pending_memory_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_pending_memory_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_pending_memory_df["value"],
                        "Min": yarn_pending_memory_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_pending_memory_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_pending_memory_df["DateTime"] = pd.to_datetime(
                    yarn_pending_memory_df["DateTime"]
                )
                yarn_pending_memory_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_pending_memory_df["DateTime"].min(),
                            yarn_pending_memory_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_pending_memory_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_pending_memory_df[
                    "Time"
                ] = yarn_pending_memory_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_pending_memory_df = yarn_pending_memory_df.set_index("Time")
                self.logger.info("get_pending_memory successful")
                return yarn_pending_memory_df
            else:
                self.logger.error(
                    "get_pending_memory failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_pending_memory failed", exc_info=True)
            return None

    def get_pending_vcore(self, cluster_name):
        """Get pending vcore over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_pending_vcore_df (DataFrame): Pending vcores over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_pending_vcores_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_pending_vcore failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_pending_vcore = r.json()
                yarn_pending_vcore_list = yarn_pending_vcore["items"][0]["timeSeries"][
                    0
                ]["data"]
                yarn_pending_vcore_df = pd.DataFrame(yarn_pending_vcore_list)
                yarn_pending_vcore_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_pending_vcore_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_pending_vcore_df["value"],
                        "Min": yarn_pending_vcore_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_pending_vcore_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_pending_vcore_df["DateTime"] = pd.to_datetime(
                    yarn_pending_vcore_df["DateTime"]
                )
                yarn_pending_vcore_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_pending_vcore_df["DateTime"].min(),
                            yarn_pending_vcore_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_pending_vcore_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_pending_vcore_df[
                    "Time"
                ] = yarn_pending_vcore_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_pending_vcore_df = yarn_pending_vcore_df.set_index("Time")
                self.logger.info("get_pending_vcore successful")
                return yarn_pending_vcore_df
            else:
                self.logger.error(
                    "get_pending_vcore failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_pending_vcore failed", exc_info=True)
            return None

    def get_running_application(self, cluster_name):
        """Get running application over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            yarn_running_apps_df (DataFrame): Running application count over time.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_running_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_running_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20total_apps_running_across_yarn_pools%20where%20entityName%3Dyarn%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_running_application failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                yarn_running_apps = r.json()
                yarn_running_apps_list = yarn_running_apps["items"][0]["timeSeries"][0][
                    "data"
                ]
                yarn_running_apps_df = pd.DataFrame(yarn_running_apps_list)
                yarn_running_apps_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            yarn_running_apps_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": yarn_running_apps_df["value"],
                        "Min": yarn_running_apps_df["aggregateStatistics"].apply(
                            pd.Series
                        )["min"],
                        "Max": yarn_running_apps_df["aggregateStatistics"].apply(
                            pd.Series
                        )["max"],
                    }
                )
                yarn_running_apps_df["DateTime"] = pd.to_datetime(
                    yarn_running_apps_df["DateTime"]
                )
                yarn_running_apps_df = (
                    pd.DataFrame(
                        pd.date_range(
                            yarn_running_apps_df["DateTime"].min(),
                            yarn_running_apps_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(yarn_running_apps_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                yarn_running_apps_df[
                    "Time"
                ] = yarn_running_apps_df.DateTime.dt.strftime("%d-%b %H:%M")
                yarn_running_apps_df = yarn_running_apps_df.set_index("Time")
                self.logger.info("get_running_application successful")
                return yarn_running_apps_df
            else:
                self.logger.error(
                    "get_running_application failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_running_application failed", exc_info=True)
            return None

    def get_queue_details(self, yarn_rm, yarn_port):
        """Get details about yarn queues.

        Args:
            yarn_rm (str): Yarn resource manager IP.
        Returns:
            yarn_queues_list (list): Yarn queue details
        """

        try:
            r = requests.get(
                "{}://{}:{}/ws/v1/cluster/scheduler".format(
                    self.http, yarn_rm, yarn_port
                )
            )
            if r.status_code == 200:
                yarn_queues = r.json()
                yarn_queues_list = yarn_queues["scheduler"]["schedulerInfo"]
                self.logger.info("get_queue_details successful")
                return yarn_queues_list
            else:
                self.logger.error(
                    "get_queue_details failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_queue_details failed", exc_info=True)
            return None

    def get_queue_application(self, yarn_application_df):
        """Get yarn application count based on different yarn queues.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            queue_app_count_df (DataFrame): Queued application count
            queue_elapsed_time_df (DataFrame): Queued application elapsed time
        """

        try:
            queue_app_count_df = pd.DataFrame(
                {"Queue": yarn_application_df["Queue"], "Application Count": 1}
            )
            queue_app_count_df = queue_app_count_df.groupby(["Queue"]).sum()
            queue_elapsed_time_df = pd.DataFrame(
                {
                    "Queue": yarn_application_df["Queue"],
                    "Elapsed Time": yarn_application_df["ElapsedTime"],
                }
            )
            queue_elapsed_time_df = queue_elapsed_time_df.groupby(["Queue"]).sum()
            self.logger.info("get_queue_application successful")
            return queue_app_count_df, queue_elapsed_time_df
        except Exception as e:
            self.logger.error("get_queue_application failed", exc_info=True)
            return None

    def get_queue_pending_application(self, yarn_application_df):
        """Get details about yarn application pending in yarn queues.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            app_queue_df (DataFrame): Pending queued application list
            app_queue_usage_df (DataFrame): Pending queued application usage over time.
        """

        try:
            app_queue_df = pd.DataFrame(
                {
                    "Queue": yarn_application_df["Queue"],
                    "Start Time": pd.to_datetime(
                        yarn_application_df["StartedTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Launch Time": pd.to_datetime(
                        yarn_application_df["LaunchTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Wait Time": yarn_application_df["LaunchTime"]
                    - yarn_application_df["StartedTime"],
                }
            )
            app_queue_df["Launch Time"] = pd.to_datetime(
                app_queue_df["Launch Time"], format="%Y-%m-%d"
            )
            app_queue_df["Start Time"] = pd.to_datetime(
                app_queue_df["Start Time"], format="%Y-%m-%d"
            )
            app_queue_usage_df = pd.DataFrame(
                pd.date_range(
                    app_queue_df["Start Time"].dt.strftime("%Y-%m-%d %H:%M").min(),
                    app_queue_df["Launch Time"].dt.strftime("%Y-%m-%d %H:%M").max(),
                    freq="H",
                ),
                columns=["Date"],
            )
            self.logger.info("get_queue_pending_application successful")
            return app_queue_df, app_queue_usage_df
        except Exception as e:
            self.logger.error("get_queue_pending_application failed", exc_info=True)
            return None

    def get_queue_vcore_memory(self, yarn_application_df):
        """Get vcore and memory used by yarn queues.

        Args:
            yarn_application_df (DataFrame): List of yarn application in cluster.
        Returns:
            queue_vcore_df (DataFrame): Queue vcores details
            queue_vcore_usage_df (DataFrame): Queue vcores usage over time
            queue_memory_df (DataFrame): Queue memory details
            queue_memory_usage_df (DataFrame): Queue memory usage over time
        """

        try:
            queue_vcore_df = pd.DataFrame(None)
            queue_vcore_df = pd.DataFrame(
                {
                    "Application Id": yarn_application_df["ApplicationId"],
                    "Queue": yarn_application_df["Queue"],
                    "Launch Time": pd.to_datetime(
                        yarn_application_df["LaunchTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Finished Time": pd.to_datetime(
                        yarn_application_df["FinishedTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Vcore": yarn_application_df["VcoreSeconds"]
                    / yarn_application_df["ElapsedTime"],
                    "Vcore Seconds": yarn_application_df["VcoreSeconds"],
                }
            )
            queue_vcore_df["Launch Time"] = pd.to_datetime(
                queue_vcore_df["Launch Time"], format="%Y-%m-%d"
            )
            queue_vcore_df["Finished Time"] = pd.to_datetime(
                queue_vcore_df["Finished Time"], format="%Y-%m-%d"
            )
            queue_vcore_usage_df = pd.DataFrame(
                pd.date_range(
                    queue_vcore_df["Launch Time"].dt.strftime("%Y-%m-%d %H:%M").min(),
                    queue_vcore_df["Finished Time"].dt.strftime("%Y-%m-%d %H:%M").max(),
                    freq="H",
                ),
                columns=["Date"],
            )
            queue_memory_df = pd.DataFrame(None)
            queue_memory_df = pd.DataFrame(
                {
                    "Application Id": yarn_application_df["ApplicationId"],
                    "Queue": yarn_application_df["Queue"],
                    "Launch Time": pd.to_datetime(
                        yarn_application_df["LaunchTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Finished Time": pd.to_datetime(
                        yarn_application_df["FinishedTime"]
                    ).dt.strftime("%Y-%m-%d %H:%M:%S"),
                    "Memory": yarn_application_df["MemorySeconds"]
                    / yarn_application_df["ElapsedTime"],
                    "Memory Seconds": yarn_application_df["MemorySeconds"],
                }
            )
            queue_memory_df["Launch Time"] = pd.to_datetime(
                queue_memory_df["Launch Time"], format="%Y-%m-%d"
            )
            queue_memory_df["Finished Time"] = pd.to_datetime(
                queue_memory_df["Finished Time"], format="%Y-%m-%d"
            )
            queue_memory_usage_df = pd.DataFrame(
                pd.date_range(
                    queue_memory_df["Launch Time"].dt.strftime("%Y-%m-%d %H:%M").min(),
                    queue_memory_df["Finished Time"]
                    .dt.strftime("%Y-%m-%d %H:%M")
                    .max(),
                    freq="H",
                ),
                columns=["Date"],
            )
            self.logger.info("get_queue_vcore_memory successful")
            return (
                queue_vcore_df,
                queue_vcore_usage_df,
                queue_memory_df,
                queue_memory_usage_df,
            )
        except Exception as e:
            self.logger.error("get_queue_vcore_memory failed", exc_info=True)
            return None

    def nodes_serving_hbase(self):
        """Get number of nodes serving Hbase.

        Returns:
            NumNodesServing (int) : number of nodes serving Hbase
        """

        try:
            statuscomm = subprocess.Popen(
                "echo 'status' | hbase shell -n",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            statuscomm, err = statuscomm.communicate()
            statusinfo = statuscomm.split()
            if "servers," in statusinfo:
                NumNodesServing = int(statusinfo[statusinfo.index("servers,") - 1])
            else:
                NumNodesServing = None
            self.logger.info("nodes_serving_hbase successful")
            return NumNodesServing
        except Exception as e:
            self.logger.error("nodes_serving_hbase failed", exc_info=True)
            return None

    def get_hbase_data_size(self):
        """Get HBase storage details.

        Returns:
            base_size (float) : Base size of HBase
            disk_space_consumed (float) : Disk size consumed by HBase
        """

        try:
            base_size = 0
            disk_space_consumed = 0
            out = subprocess.Popen(
                "hdfs dfs -du / | grep 'hbase'",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out, err = out.communicate()
            base_size = ""
            disk_space_consumed = ""
            hbase_data = out.split("/")[0].strip()
            dt = hbase_data.split(" ")
            base_size = 0
            disk_space_consumed = 0
            count = 0
            for i in dt:
                try:
                    count = count + 1
                    if isinstance(int(i), int) == True:
                        if count > 1:
                            disk_space_consumed = i
                except:
                    pass
            if isinstance(int(dt[0]), int) == True:
                base_size = int(dt[0]) / 1024 / 1024 / 1024
            disk_space_consumed = int(disk_space_consumed) / 1024 / 1024 / 1024
            self.logger.info("get_hbase_data_size successful")
            return base_size, disk_space_consumed
        except Exception as e:
            self.logger.error("get_hbase_data_size failed", exc_info=True)
            return None

    def get_hbase_replication(self, cluster_name):
        """Get HBase replication factor.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            replication (str): HBase replication factor.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services/hbase/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hbase/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hbase/config".format(
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
                    "get_hbase_replication failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                hbase = r.json()
                hbase_config = hbase["items"]
                hbase_replication = "false"
                replication = "No"
                for i in hbase_config:
                    if i["name"] == "hbase_enable_replication":
                        hbase_replication = i["value"]
                        if hbase_replication == "true":
                            replication = "Yes"
                self.logger.info("get_hbase_replication successful")
                return replication
            else:
                self.logger.error(
                    "get_hbase_replication failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hbase_replication failed", exc_info=True)
            return None

    def get_hbase_secondary_index(self, cluster_name):
        """Get HBase secondary indexing details.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            indexing (str): HBase secondary index value.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services/hbase/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hbase/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hbase/config".format(
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
                    "get_hbase_secondary_index failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                hbase = r.json()
                hbase_config = hbase["items"]
                hbase_indexing = "false"
                hbase_replication = "false"
                indexing = "No"
                for i in hbase_config:
                    if i["name"] == "hbase_enable_indexing":
                        hbase_indexing = i["value"]
                    if i["name"] == "hbase_enable_replication":
                        hbase_replication = i["value"]
                if hbase_indexing == hbase_replication == "true":
                    indexing = "Yes"
                self.logger.info("get_hbase_secondary_index successful")
                return indexing
            else:
                self.logger.error(
                    "get_hbase_secondary_index failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hbase_secondary_index failed", exc_info=True)
            return None

    def hBase_on_hive(self):
        """Get HBase-hive information.

        Returns:
            hbasehive_var (str): HBase-hive information.
        """

        try:
            hive_aux = subprocess.Popen(
                "awk '/HIVE_AUX_JARS_PATH/ {print}' /etc/hive/conf/hive-env.sh",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            hive_aux, err = hive_aux.communicate()
            if "hive-hbase-handler" in hive_aux:
                hbasehive_var = "Yes"
            else:
                hbasehive_var = "No"
            self.logger.info("hBase_on_hive successful")
            return hbasehive_var
        except Exception as e:
            self.logger.error("hBase_on_hive failed", exc_info=True)
            return None

    def phoenix_in_hbase(self):
        """Get HBase phoenix information.

        Returns:
            phoenixHbase (str): HBase phoenix information.
        """

        try:
            subprocess.Popen(
                'find / -path "*/hbase/lib/phoenix*.jar" 2>/dev/null > phoenixpath.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            sleep(1)
            phoenix_path_df = pd.read_csv(
                "phoenixpath.csv", delimiter="\n", header=None
            )
            subprocess.Popen(
                "rm ./phoenixpath.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            phoenixHbase = "No"
            if not phoenix_path_df.empty:
                phoenix_path_df.columns = ["location"]
                for i in phoenix_path_df["location"]:
                    if i != "":
                        phoenixHbase = "Yes"
            self.logger.info("phoenix_in_hbase successful")
            return phoenixHbase
        except EmptyDataError:
            phoenixHbase = "No"
            self.logger.info("phoenix_in_hbase successful")
            return phoenixHbase
        except Exception as e:
            self.logger.error("phoenix_in_hbase failed", exc_info=True)
            return None

    def coprocessor_in_hbase(self):
        """Get HBase coprocessor information.

        Returns:
            coprocessorHbase (str): HBase coprocessor information.
        """

        try:
            coprocessorHbase = ""
            subprocess.Popen(
                'find / -path "*/hbase/lib/*coprocessor*.jar" 2>/dev/null > coprocessorpath.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            sleep(1)
            coprocessor_path_df = pd.read_csv(
                "coprocessorpath.csv", delimiter="\n", header=None
            )
            subprocess.Popen(
                "rm ./coprocessorpath.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            coprocessorHbase = "No"
            if not coprocessor_path_df.empty:
                coprocessor_path_df.columns = ["location"]
                for i in coprocessor_path_df["location"]:
                    if i != "":
                        coprocessorHbase = "Yes"
            self.logger.info("coprocessor_in_hbase successful")
            return coprocessorHbase
        except EmptyDataError:
            coprocessorHbase = "No"
            self.logger.info("coprocessor_in_hbase successful")
            return coprocessorHbase
        except Exception as e:
            self.logger.error("coprocessor_in_hbase failed", exc_info=True)
            return None

    def get_dynamic_allocation_and_spark_resource_manager(self):
        """Get spark config details.

        Returns:
            dynamic_allocation (str): Dynamic Allocation value.
            spark_resource_manager (str): Spark resource manager value.
        """

        try:
            dynamic_allocation = ""
            spark_resource_manager = ""
            spark_config_filename = glob.glob("{}".format(self.config_path["spark"]))
            with open(spark_config_filename[0], "r") as f:
                for line in f:
                    if line.split("=")[0] == "spark.dynamicAllocation.enabled":
                        if line.split("=")[1].strip() == "true":
                            dynamic_allocation = "Enabled"
                        else:
                            dynamic_allocation = "Disabled"
                    elif line.split("=")[0] == "spark.master":
                        spark_resource_manager = line.split("=")[1].strip()
                    else:
                        continue
            self.logger.info(
                "get_dynamic_allocation_and_spark_resource_manager successful"
            )
            return dynamic_allocation, spark_resource_manager
        except Exception as e:
            self.logger.error(
                "get_dynamic_allocation_and_spark_resource_manager failed",
                exc_info=True,
            )
            return None

    def get_spark_version(self):
        """Get Spark version details.

        Returns:
            spark_version (str): Spark version
        """

        try:
            out = subprocess.check_output(
                '(spark-shell --version &> tmp.data ; grep version tmp.data | head -1 | awk "{print $NF}";rm tmp.data)',
                shell=True,
                stderr=subprocess.STDOUT,
            )
            spark_version = out.splitlines()
            dt = ""
            for i in spark_version:
                if "version" in str(i):
                    dt = i
                    break
            dt = dt.split()
            spark_version = dt[-1]
            spark_version = spark_version.decode("utf-8")
            self.logger.info("get_spark_version successful")
            return spark_version
        except Exception as e:
            self.logger.error("get_spark_version failed", exc_info=True)
            return None

    def get_spark_api_programming_languages(self):
        """Get list of languages used by spark programs.

        Returns:
            language_list (str): List of languages separated by comma.
        """

        try:
            command = "hdfs dfs -ls /user/spark/applicationHistory"
            command = command + " | awk ' {print $8} '"
            file_paths = subprocess.check_output(
                command, shell=True, stderr=subprocess.STDOUT,
            )
            file_paths = str(file_paths)
            l_list = file_paths.split("\\n")
            language_list = []
            if len(l_list) > 2:
                l_list.pop(0)
                l_list.pop(-1)
                paths = []
                if len(l_list) > 30:
                    for item in l_list[:10]:
                        paths.append(item)
                    if (len(l_list) % 2) != 0:
                        middle = int(len(l_list) / 2)
                    else:
                        middle = int(len(l_list) / 2) - 1
                    for item in l_list[middle : middle + 10]:
                        paths.append(item)
                    for item in l_list[len(l_list) - 11 :]:
                        paths.append(item)
                    l_list = paths
                for path in l_list:
                    output = subprocess.check_output(
                        "hdfs dfs -cat {}".format(path), shell=True
                    )
                    output = str(output)
                    if output != "b''":
                        language = (output).split('"sun.java.command":')[1]
                        language = language.split(",")[0]
                        if language.find(".py") != -1:
                            if "Python" not in language_list:
                                language_list.append("Python")
                        elif language.find(".java") != -1:
                            if "Java" not in language_list:
                                language_list.append("Java")
                        elif language.find(".scala") != -1:
                            if "Scala" not in language_list:
                                language_list.append("Scala")
                        elif language.find(".R") != -1:
                            if "R" not in language_list:
                                language_list.append("R")
            language_list = ", ".join(language_list)
            self.logger.info("get_spark_api_programming_languages successful")
            return language_list
        except Exception as e:
            self.logger.error(
                "get_spark_api_programming_languages failed", exc_info=True
            )
            return None

    def spark_components_used(self):
        """Get components of spark used in programming.

        Returns:
            rdd_flag (bool) : Use of Spark RDD
            dataset_flag (bool) : Use of Spark Dataset
            sql_flag (bool) : Use of Spark SQL
            df_flag (bool) : Use of Spark Dataframe
            mllib_flag (bool) : Use of Spark ML
            stream_flag (bool) : Use of Spark Streaming
        """

        try:
            rdd_flag = 0
            dataset_flag = 0
            sql_flag = 0
            df_flag = 0
            mllib_flag = 0
            stream_flag = 0

            file_paths = subprocess.check_output(
                "hdfs dfs -ls /user/spark/applicationHistory | awk ' {print $8} ' | head -n 10",
                shell=True,
            )
            file_paths = str(file_paths)
            list1 = file_paths.split("\\n")
            list1.pop(0)
            list1.pop(-1)
            file_paths2 = subprocess.check_output(
                "hdfs dfs -ls /user/spark/applicationHistory | awk ' {print $8} ' | tail -n 10",
                shell=True,
            )
            file_paths2 = str(file_paths2)
            list2 = file_paths2.split("\\n")
            list2.pop(0)
            list2.pop(-1)
            list3 = list(set(list1) & set(list2))
            for i in range(0, len(list1)):
                command = "hdfs dfs -cat " + list1[i]
                json_dt = subprocess.check_output(command, shell=True)
                parse_str = str(json_dt)
                if re.search(r"\borg.apache.spark.rdd.RDD\b", parse_str):
                    rdd_flag = 1
                if re.search(r"\borg.apache.spark.sql.Dataset\b", parse_str):
                    dataset_flag = 1
                if re.search(r"\borg.apache.spark.sql\b", parse_str):
                    sql_flag = 1
                if re.search(r"\bcreateDataFrame\b", parse_str):
                    stream_flag = 1
                if re.search(r"\borg.apache.spark.streaming\b", parse_str):
                    df_flag = 1
                if re.search(r"\borg.apache.spark.ml\b", parse_str):
                    mllib_flag = 1
            self.logger.info("spark_components_used successful")
            return rdd_flag, dataset_flag, sql_flag, df_flag, mllib_flag, stream_flag
        except Exception as e:
            self.logger.error("spark_components_used failed", exc_info=True)
            return None

    def retention_period_kafka(self):
        """Get retention period of kafka.

        Returns:
            retention_period (str): Kafka retention period
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "retention_period_kafka failed as cloudera does not exist",
                )
                return None
            version_related = r.json()
            for i in version_related["items"]:
                try:
                    if i["name"] == "log.cleaner.delete.retention.ms":
                        retention_period = int(i["value"]) / (60 * 60 * 1000)
                except KeyError:
                    retention_period = int(i["default"]) / (60 * 60 * 1000)
            self.logger.info("retention_period_kafka successful")
            return retention_period
        except Exception as e:
            self.logger.error("retention_period_kafka failed", exc_info=True)
            return None

    def zookeeper_conn(self):
        """Get zookeeper connection string in kafka.
        
        Returns:
            zookeeper_conn (str): Returns the zookeeper connection string for kafka
        """

        try:
            subprocess.Popen(
                "awk '/zookeeper.connect/'  {} > zookeeper_conn.csv".format(
                    self.config_path["kafka"]
                ),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            sleep(1)
            zookeeper_conn_df = pd.read_csv(
                "zookeeper_conn.csv", delimiter="\n", header=None
            )
            subprocess.Popen(
                "rm ./zookeeper_conn.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            zookeeper_conn_df.columns = ["parameters"]
            zookeeper_conn_df = zookeeper_conn_df.iloc[[-1]]
            for i in zookeeper_conn_df["parameters"]:
                if i != "":
                    zookeeper_conn = i.split("=")[-1]
                else:
                    zookeeper_conn = None
            self.logger.info("zookeeper_conn successful")
            return zookeeper_conn
        except EmptyDataError:
            zookeeper_conn = None
            self.logger.info("zookeeper_conn successful")
            return zookeeper_conn
        except Exception as e:
            self.logger.error("zookeeper_conn failed", exc_info=True)
            return None

    def num_topics_kafka(self, zookeeper_conn):
        """Get num of topics in kafka.
        
        Args:
            zookeeper_conn (str) : Zookeeper Connection string for kafka
        Returns:
            num_topics (int): Number of topics in kafka.
        """

        try:
            topics = subprocess.Popen(
                "timeout 20 kafka-topics --zookeeper "
                + str(zookeeper_conn)
                + " --list 2>/dev/null 1>topics_list.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            topics.wait(10)
            topics, err = topics.communicate()
            topics_df = pd.read_csv("topics_list.csv", header=None)
            subprocess.Popen(
                "rm ./topics_list.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            topics_df.columns = ["topics"]
            num_topics = len(topics_df.index)
            self.logger.info("num_topics_kafka successful")
            return num_topics
        except Exception as e:
            self.logger.error("num_topics_kafka failed", exc_info=True)
            return None

    def msg_size_kafka(self, zookeeper_conn):
        """Get volume of message in kafka in bytes.
        
        Args:
            zookeeper_conn (str) Zookeeper Connection string for kafka
        Returns:
            sum_size (int): Message size of Kafka
        """
        if not self.broker_list:
            self.logger.error("msg_count_kafka failed", exc_info=True)
            return None
        else:
            try:
                broker_connection = ""
                for i in self.broker_list:
                    conn_temp = str(i["host"]) + str(":") + str(i["port"]) + str(",")
                    broker_connection = broker_connection + conn_temp
                broker_connection = broker_connection.strip(",")
                topics = subprocess.Popen(
                    "timeout 20 kafka-topics --zookeeper "
                    + str(zookeeper_conn)
                    + " --list 2>/dev/null 1>topics_list.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                topics.wait(10)
                topics, err = topics.communicate()
                topics_df = pd.read_csv("topics_list.csv", header=None)
                subprocess.Popen(
                    "rm ./topics_list.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                topics_df.columns = ["topics"]
                sum_size = 0
                for i in topics_df["topics"]:
                    msg_size = subprocess.Popen(
                        "timeout 20 kafka-log-dirs     --bootstrap-server "
                        + str(broker_connection)
                        + "  --topic-list "
                        + str(i)
                        + " --describe 2>/dev/null | grep '^{'   | jq '[ ..|.size? | numbers ] | add'",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    )
                    msg_size.wait(10)
                    msg_size, err = msg_size.communicate()

                    msg_size = msg_size.strip("\n")
                    if msg_size != "":
                        sum_size = sum_size + (
                            int(msg_size) if msg_size != "null" else 0
                        )
                    else:
                        sum_size = 0
                self.logger.info("msg_size_kafka successful")
                return sum_size
            except Exception as e:
                self.logger.error("msg_size_kafka failed", exc_info=True)
                return None

    def msg_count_kafka(self, zookeeper_conn):
        """Get count of messages in kafka topics.

        Args:
            zookeeper_conn (str) Zookeeper Connection string for kafka
        Returns:
            sum_count (int): Number of messages in Kafka
        """
        if not self.broker_list:
            self.logger.error("msg_count_kafka failed", exc_info=True)
            return None
        else:
            try:
                sum_count = 0
                broker_connection = ""
                for i in self.broker_list:
                    conn_temp = str(i["host"]) + str(":") + str(i["port"]) + str(",")
                    broker_connection = broker_connection + conn_temp
                broker_connection = broker_connection.strip(",")
                topics = subprocess.Popen(
                    "timeout 20 kafka-topics --zookeeper "
                    + str(zookeeper_conn)
                    + " --list 2>/dev/null 1>topics_list.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                topics.wait(10)
                topics, err = topics.communicate()
                sleep(1)
                topics_df = pd.read_csv("topics_list.csv", header=None)
                subprocess.Popen(
                    "rm ./topics_list.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                topics_df.columns = ["topics"]
                sum_count = 0
                for i in topics_df["topics"]:
                    msg_count = subprocess.Popen(
                        "timeout 20 kafka-run-class kafka.tools.GetOffsetShell --broker-list "
                        + str(broker_connection)
                        + " --topic "
                        + str(i)
                        + " --time -1 --offsets 1 2>/dev/null | awk -F  \":\" '{sum += $3} END {print sum}'",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    )
                    msg_count.wait(10)
                    msg_count, err = msg_count.communicate()

                    msg_count = msg_count.strip("\n")
                    if msg_count != "":
                        sum_count = sum_count + int(msg_count)
                    else:
                        sum_count = None
                self.logger.info("msg_count_kafka successful")
                return sum_count
            except Exception as e:
                self.logger.error("msg_count_kafka failed", exc_info=True)
                return None

    def kafka_cluster_size(self):
        """Get Total size of Kafka Cluster.

        Returns:
            total_size (int): Total size of Kafka Cluster in KB
        """
        if not self.broker_list:
            self.logger.error("kafka_cluster_size failed", exc_info=True)
            return None
        else:
            try:
                broker_id = 0
                brokersize = pd.DataFrame(columns=["broker_size"])
                j = 0
                list_com = []
                list_temp = []
                for i in self.broker_list:
                    list_temp = i["log_dir"].split("?")
                    list_com = list_com + list_temp
                if len(set(list_com)) == 1:
                    for val in set(list_com):
                        log_dir = val
                    broker_dir = subprocess.Popen(
                        "du -sh " + str(log_dir) + "/* 2>/dev/null 1>broker_size.csv",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    )
                    broker_dir.wait()
                    broker_dir, err = broker_dir.communicate()
                    try:
                        brokers_df = pd.read_csv("broker_size.csv", header=None)
                        subprocess.Popen(
                            "rm ./broker_size.csv",
                            shell=True,
                            stdout=subprocess.PIPE,
                            encoding="utf-8",
                        ).wait(10)
                        brokers_df.columns = ["logs"]
                        size_sum = 0
                        for i in brokers_df["logs"]:
                            size = i.split("\t", 1)[0]
                            size = float(size.strip("K"))
                            size_sum = size_sum + size
                        brokersize.loc[j] = size_sum
                        broker_list_len = len(self.broker_list) - 1
                        for i in range(broker_list_len):
                            brokersize.loc[j + i + 1] = 0
                        total_size = size_sum
                    except EmptyDataError:
                        total_size = None
                elif len(set(list_com)) == 0:
                    total_size = None
                else:
                    try:
                        for k in self.broker_list:
                            broker_dir = subprocess.Popen(
                                "du -sh "
                                + str(k["log_dir"])
                                + "/* 2>/dev/null 1>broker_size.csv",
                                shell=True,
                                stdout=subprocess.PIPE,
                                encoding="utf-8",
                            )
                            broker_dir.wait()
                            broker_dir, err = broker_dir.communicate()
                            brokers_df = pd.read_csv("broker_size.csv", header=None)
                            subprocess.Popen(
                                "rm ./broker_size.csv",
                                shell=True,
                                stdout=subprocess.PIPE,
                                encoding="utf-8",
                            ).wait(10)
                            brokers_df.columns = ["logs"]
                            size_sum = 0
                            for i in brokers_df["logs"]:
                                size = i.split("\t", 1)[0]
                                size = float(size.strip("K"))
                                size_sum = size_sum + size
                            brokersize.loc[j] = size_sum
                            j = j + 1
                        total_size = 0
                        for i in brokersize["broker_size"]:
                            total_size = total_size + float(i)
                    except EmptyDataError:
                        total_size = None
                self.logger.info("kafka_cluster_size successful")
                return total_size
            except Exception as e:
                self.logger.error("kafka_cluster_size failed", exc_info=True)
                return None

    def broker_size_kafka(self):

        """Get individual broker size in the Kafka Cluster.

        Returns:
            brokersize (DataFrame): Returns a df with the sizes of all the brokers in the Kafka Cluster
        """
        if not self.broker_list:
            self.logger.error("broker_size_kafka failed", exc_info=True)
            return None
        else:
            try:
                broker_id = 0
                brokersize = pd.DataFrame(columns=["broker_size"])
                j = 0
                for k in self.broker_list:
                    broker_dir = subprocess.Popen(
                        "du -sh "
                        + str(k["log_dir"])
                        + "/* 2>/dev/null 1>broker_size.csv",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    )
                    broker_dir.wait()
                    broker_dir, err = broker_dir.communicate()
                    brokers_df = pd.read_csv("broker_size.csv", header=None)
                    subprocess.Popen(
                        "rm ./broker_size.csv",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    ).wait(10)
                    brokers_df.columns = ["logs"]
                    size_sum = 0
                    for i in brokers_df["logs"]:
                        size = i.split("\t", 1)[0]
                        size = float(size.strip("K"))
                        size_sum = size_sum + size
                    brokersize.loc[j] = size_sum
                    j = j + 1
                brokersize.columns = ["size"]
                self.logger.info("broker_size_kafka successful")
                return brokersize
            except Exception as e:
                self.logger.error("broker_size_kafka failed", exc_info=True)
                return None

    def ha_strategy_kafka(self, zookeeper_conn):
        """Check High Availability of Kafka Cluster
        
        Args:
            zookeeper_conn (str) Zookeeper Connection string for kafka
        Returns:
            HA_Strategy (str): returns whether High availability in kafka is enabled or not
        """
        try:
            brokers = ""
            Num_brokers = 0
            subprocess.Popen(
                "sh ./zkcli.sh 2>/dev/null 1>broker_id.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            broker_id_df = pd.read_csv("./broker_id.csv", delimiter="\n", header=None)
            subprocess.Popen(
                "rm ./broker_id.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            broker_id_df.columns = ["parameters"]
            broker_id_df = broker_id_df.iloc[[-1]]
            for i in broker_id_df["parameters"]:
                if i != "":
                    brokers = i.strip("][").split(", ")
                    Num_brokers = len(brokers)
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 6:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            elif self.version == 5:
                r = requests.get(
                    "{}://{}:{}/api/v19/clusters/{}/services/{}/config?view=full".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                        self.cluster_name,
                        "kafka",
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            else:
                self.logger.error(
                    "ha_strategy_kafka failed as cloudera does not exist",
                )
                return None
            version_related = r.json()
            for i in version_related["items"]:
                try:
                    if i["name"] == "offsets.topic.replication.factor":
                        replication = int(i["value"])
                except KeyError:
                    replication = int(i["default"])
            if replication > 1 and Num_brokers > 1:
                HA_Strategy = "Yes"
            else:
                HA_Strategy = "No"
            self.logger.info("ha_strategy_kafka successful")
            return HA_Strategy
        except Exception as e:
            self.logger.error("ha_strategy_kafka failed", exc_info=True)
            return None

    def use_of_impala(self):
        """Get impala service in cluster.

        Returns:
            output (str): Impala information for cluster.
        """

        try:
            output = ""
            inter = subprocess.Popen(
                "cat /opt/cloudera/parcels/CDH/meta/parcel.json 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            inter, err = inter.communicate()
            version_data = json.loads(inter)
            data = version_data["components"]
            df = pd.DataFrame(data)
            services_df = df
            found = 0
            services_df["sub_version"] = services_df.version.str[:5]
            for i in services_df["name"]:
                if i == "impala":
                    found = 1
                    name = i
            if found == 1:
                output = (
                    "Impala found with version: "
                    + services_df.loc[services_df["name"] == name].sub_version.item()
                )
            else:
                output = "Impala is not found"
            self.logger.info("use_of_impala successful")
            return output
        except Exception as e:
            self.logger.error("use_of_impala failed", exc_info=True)
            return None

    def use_of_sentry(self):
        """Get sentry service in cluster.

        Returns:
            output (str): Sentry information for cluster.
        """

        try:
            output = ""
            inter = subprocess.Popen(
                "cat /opt/cloudera/parcels/CDH/meta/parcel.json 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            inter, err = inter.communicate()
            version_data = json.loads(inter)
            data = version_data["components"]
            df = pd.DataFrame(data)
            services_df = df
            found = 0
            services_df["sub_version"] = services_df.version.str[:5]
            for i in services_df["name"]:
                if i == "sentry":
                    found = 1
                    name = i
            if found == 1:
                output = (
                    "Apache Sentry found with version: "
                    + services_df.loc[services_df["name"] == name].sub_version.item()
                )
            else:
                output = "Apache Sentry is not found"
            self.logger.info("use_of_sentry successful")
            return output
        except Exception as e:
            self.logger.error("use_of_sentry failed", exc_info=True)
            return None

    def use_of_kudu(self):
        """Get kudu service in cluster.

        Returns:
            output (str): Kudu information for cluster.
        """

        try:
            output = ""
            inter = subprocess.Popen(
                "cat /opt/cloudera/parcels/CDH/meta/parcel.json 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            inter, err = inter.communicate()
            version_data = json.loads(inter)
            data = version_data["components"]
            df = pd.DataFrame(data)
            services_df = df
            found = 0
            services_df["sub_version"] = services_df.version.str[:6]
            for i in services_df["name"]:
                if i == "kudu":
                    found = 1
                    name = i
            if found == 1:
                output = (
                    "Apache Kudu found with version: "
                    + services_df.loc[services_df["name"] == name].sub_version.item()
                )
            else:
                output = "Apache Kudu is not found"
            self.logger.info("use_of_kudu successful")
            return output
        except Exception as e:
            self.logger.error("use_of_kudu failed", exc_info=True)
            return None

    def get_cloudera_services_used_for_ingestion(self, cluster_name):
        """Get a list of services used for ingestion.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            services (str): List services used for ingestion.
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
                    "get_cloudera_services_used_for_ingestion failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                cluster_services = r.json()
                cluster_service_item = cluster_services["items"]
                services_list = []
                for i in cluster_service_item:
                    if i["name"] == "hive":
                        services_list.append("Hive")
                    elif i["name"] == "impala":
                        services_list.append("Impala")
                    elif i["name"] == "flume":
                        services_list.append("Flume")
                    elif i["name"] == "sqoop":
                        services_list.append("Sqoop")
                    elif i["name"] == "kafka":
                        services_list.append("Kafka")
                    elif i["name"] == "nifi":
                        services_list.append("NiFi")
                services = ", ".join(services_list)
                self.logger.info("get_cloudera_services_used_for_ingestion successful")
                return services
            else:
                self.logger.error(
                    "get_cloudera_services_used_for_ingestion failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error(
                "get_cloudera_services_used_for_ingestion failed", exc_info=True
            )
            return None

    def backup_and_recovery(self):
        """Get backup and disaster recovery information.

        Returns:
            br (str): backup and disaster recovery information.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/cm/peers".format(
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
                    "{}://{}:{}/api/v19/cm/peers".format(
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
                    "{}://{}:{}/api/v19/cm/peers".format(
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
                self.logger.error(
                    "backup_and_recovery failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                Backup = r.json()
                if len(Backup["items"]) >= 1:
                    br = "Cloudera Backup & Disaster Recovery are enabled"
                else:
                    br = "Cloudera Backup & Disaster Recovery are not enabled"
                self.logger.info("backup_and_recovery successful")
                return br
            else:
                self.logger.error(
                    "backup_and_recovery failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("backup_and_recovery failed", exc_info=True)
            return None
