# ------------------------------------------------------------------------------
# This module is used to get the storage related features like the size of
# the Hadoop clusters.Unveiling the usage over the period of time for the
# customized range specified by the user. This module generates the clear output
# of various key specifications of hadoop distributed file system.
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class DataAPI:
    """This Class has functions related to the Cluster Data category.

    Has functions which fetch different data metrics from Hadoop cluster 
    like HDFS metrics, hive metrics, etc.

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

    def total_size_configured(self):
        """Get total storage size and storage at each node for HDFS.

        Returns:
            individual_node_size (list): Total storage of all nodes.
            total_storage (float): Total storage of cluster.
        """

        try:
            subprocess.Popen(
                "hdfs dfsadmin -report > ./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            dt = "Live datanodes "
            list_of_results = []
            flag = 0
            with open("data.csv", "r") as fp:
                with open("out2.csv", "w") as f1:
                    for line in fp:
                        if dt in line:
                            flag = 1
                        if dt not in line and flag == 1:
                            line = line.replace(": ", "  ")
                            f1.write(re.sub("[^\S\r\n]{2,}", ",", line))
            dataframe = pd.read_csv("out2.csv")
            dataframe.dropna(axis=0, how="all", inplace=True)
            dataframe.to_csv("sizeConfigured.csv", index=False)
            dataframe = pd.read_csv("sizeConfigured.csv", names=["key", "value"])
            subprocess.Popen(
                "rm ./sizeConfigured.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            list_Hostnames = []
            list_Configured_Capacity = []
            count_row = dataframe.shape[0]
            for i in range(count_row):
                if dataframe.loc[i, "key"] == "Hostname":
                    list_Hostnames.append(dataframe.loc[i, "value"])
                if dataframe.loc[i, "key"] == "Configured Capacity":
                    list_Configured_Capacity.append(dataframe.loc[i, "value"])
            dictionary = {
                "Hostname": list_Hostnames,
                "Configured_Capacity": list_Configured_Capacity,
            }
            mapped_df = pd.DataFrame(dictionary)
            subprocess.Popen(
                "rm -rf ./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            subprocess.Popen(
                "rm -rf ./out2.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            mapped_df[
                ["Configured_Capacity_bytes", "Configured_Capacity"]
            ] = mapped_df.Configured_Capacity.str.split("\(|\)", expand=True).iloc[
                :, [0, 1]
            ]
            mapped_df["Configured_Capacity_bytes"] = mapped_df[
                "Configured_Capacity_bytes"
            ].astype(int)
            total_storage = (mapped_df["Configured_Capacity_bytes"].sum()) / (
                1024 * 1024 * 1024
            )
            self.logger.info("total_size_configured successful")
            return mapped_df, total_storage
        except Exception as e:
            self.logger.error("total_size_configured failed", exc_info=True)
            return None

    def replication_factor(self):
        """Get HDFS replication factor.

        Returns:
            replication_factor (str): Replication factor value
        """

        try:
            replication_factor = subprocess.Popen(
                "hdfs getconf -confKey dfs.replication",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            replication_factor.wait(10)
            replication_factor, err = replication_factor.communicate()
            self.logger.info("replication_factor successful")
            return replication_factor
        except Exception as e:
            self.logger.error("replication_factor failed", exc_info=True)
            return None

    def get_trash_status(self):
        """Get config value for HDFS trash interval.

        Returns:
            trash_flag (str): Trash interval value
        """

        try:
            xml_data = subprocess.Popen(
                "cat {}".format(self.config_path["core"]),
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            xml_data.wait(10)
            xml_data, err = xml_data.communicate()
            root = ET.fromstring(xml_data)
            for val in root.findall("property"):
                name = val.find("name").text
                if "trash" not in name:
                    root.remove(val)
            trash_value = int(root[0][1].text)
            trash_flag = ""
            if trash_value > 0:
                trash_flag = "Enabled"
            else:
                trash_flag = "Disabled"
            self.logger.info("get_trash_status successful")
            return trash_flag
        except Exception as e:
            self.logger.error("get_trash_status failed", exc_info=True)
            return None

    def get_cliresult(self, clipath):
        """Get HDFS size breakdown based on HDFS directory system.

        Args:
            clipath (str): HDFS path for storage breakdown
        Returns:
            hdfs_root_dir (str): HDFS storage breakdown
        """

        try:
            keyword = ["dfs.permissions"]
            data = subprocess.Popen(
                "ls -at /run/cloudera-scm-agent/process/*-hdfs-NAMENODE/hdfs-site.xml 2>/dev/null | head -n 1",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding="utf-8",
            )
            data.wait(10)
            data_out, data_err = data.communicate()
            final_val = "false"
            if len(data_out) > 0:
                lst = []
                res = []
                xml_data = subprocess.Popen(
                    "cat " + data_out,
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                out, err = xml_data.communicate()
                root = ET.fromstring(out)
                for val in root.findall("property"):
                    name = val.find("name").text
                    if "dfs.permissions" not in name:
                        root.remove(val)
                if len(list(root)) == 0:
                    pass
                else:
                    for elem in root.iter():
                        intermediate_text = elem.text
                        intermediate_text = intermediate_text.replace("\n", "").strip(
                            " "
                        )
                        if len(intermediate_text) > 2:
                            lst.append(intermediate_text)
                i = 0
                while i < len(lst):
                    if keyword.count(lst[i]) > 0:
                        res.append(i)
                    i += 1
                index = int(" ".join([str(elem) for elem in res]))
                final_val = lst[index + 1]
            hdfs_root_dir = None
            if final_val == "false":
                path = clipath
                out = subprocess.Popen(
                    ["hadoop", "fs", "-du", "-h", path],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                )
                out.wait(10)
                stdout, stderr = out.communicate()
                hdfs_root_dir = stdout
            self.logger.info("get_cliresult successful")
            return hdfs_root_dir
        except Exception as e:
            self.logger.error("get_cliresult failed", exc_info=True)
            return None

    def get_hdfs_capacity(self, cluster_name):
        """Get HDFS storage available data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            hdfs_capacity_df (DataFrame): HDFS storage available over time
            hdfs_storage_config (float): Average HDFS storage available
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_hdfs_capacity failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                hdfs_capacity = r.json()
                hdfs_capacity_list = hdfs_capacity["items"][0]["timeSeries"][0]["data"]
                hdfs_capacity_df = pd.DataFrame(hdfs_capacity_list)
                hdfs_capacity_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            hdfs_capacity_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": hdfs_capacity_df["value"] / 1024 / 1024 / 1024,
                    }
                )
                hdfs_capacity_df["DateTime"] = pd.to_datetime(
                    hdfs_capacity_df["DateTime"]
                )
                hdfs_capacity_df = (
                    pd.DataFrame(
                        pd.date_range(
                            hdfs_capacity_df["DateTime"].min(),
                            hdfs_capacity_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(hdfs_capacity_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                hdfs_capacity_df["Time"] = hdfs_capacity_df.DateTime.dt.strftime(
                    "%d-%b %H:%M"
                )
                hdfs_capacity_df = hdfs_capacity_df.set_index("Time")
                hdfs_storage_config = hdfs_capacity_df.sort_values(
                    by="DateTime", ascending=False
                ).iloc[0]["Mean"]
                self.logger.info("get_hdfs_capacity successful")
                return hdfs_capacity_df, hdfs_storage_config
            else:
                self.logger.error(
                    "get_hdfs_capacity failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hdfs_capacity failed", exc_info=True)
            return None

    def get_hdfs_capacity_used(self, cluster_name):
        """Get HDFS storage used data over a date range.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            hdfs_capacity_used_df (DataFrame): HDFS storage used over time
            hdfs_storage_used (float): Average HDFS storage used
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity_used%2Bdfs_capacity_used_non_hdfs%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity_used%2Bdfs_capacity_used_non_hdfs%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "{}://{}:{}/api/v19/timeseries?contentType=application%2Fjson&from={}&desiredRollup=HOURLY&mustUseDesiredRollup=true&query=select%20dfs_capacity_used%2Bdfs_capacity_used_non_hdfs%20where%20entityName%3Dhdfs%20and%20clusterName%20%3D%20{}&to={}".format(
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
                    "get_hdfs_capacity_used failed as cloudera does not exist",
                )
                return None
            if r.status_code == 200:
                hdfs_capacity_used = r.json()
                hdfs_capacity_used_list = hdfs_capacity_used["items"][0]["timeSeries"][
                    0
                ]["data"]
                hdfs_capacity_used_df = pd.DataFrame(hdfs_capacity_used_list)
                hdfs_capacity_used_df = pd.DataFrame(
                    {
                        "DateTime": pd.to_datetime(
                            hdfs_capacity_used_df["timestamp"]
                        ).dt.strftime("%Y-%m-%d %H:%M"),
                        "Mean": hdfs_capacity_used_df["value"] / 1024 / 1024 / 1024,
                    }
                )
                hdfs_capacity_used_df["DateTime"] = pd.to_datetime(
                    hdfs_capacity_used_df["DateTime"]
                )
                hdfs_capacity_used_avg = (
                    hdfs_capacity_used_df["Mean"].sum()
                    / hdfs_capacity_used_df["DateTime"].count()
                )
                hdfs_capacity_used_df = (
                    pd.DataFrame(
                        pd.date_range(
                            hdfs_capacity_used_df["DateTime"].min(),
                            hdfs_capacity_used_df["DateTime"].max(),
                            freq="H",
                        ),
                        columns=["DateTime"],
                    )
                    .merge(hdfs_capacity_used_df, on=["DateTime"], how="outer")
                    .fillna(0)
                )
                hdfs_capacity_used_df[
                    "Time"
                ] = hdfs_capacity_used_df.DateTime.dt.strftime("%d-%b %H:%M")
                hdfs_capacity_used_df = hdfs_capacity_used_df.set_index("Time")
                hdfs_storage_used = hdfs_capacity_used_df.sort_values(
                    by="DateTime", ascending=False
                ).iloc[0]["Mean"]
                self.logger.info("get_hdfs_capacity_used successful")
                return hdfs_capacity_used_df, hdfs_storage_used
            else:
                self.logger.error(
                    "get_hdfs_capacity_used failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hdfs_capacity_used failed", exc_info=True)
            return None

    def hdfs_storage(self):
        """Get HDFS folders and files details in cluster.

        Returns:
            hdfs_storage_df (DataFrame): HDFS folders and files details
            hdfs_flag (bool): Check whether acl is enabled or not
        """

        try:
            hdfs_flag = 0
            raw = subprocess.Popen(
                "hdfs dfs -ls / > ./direc_list.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            raw.wait(10)
            raw, err = raw.communicate()
            hdfs_storage_df = pd.read_csv("direc_list.csv")
            subprocess.Popen(
                "rm ./direc_list.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            hdfs_storage_df.columns = ["output"]
            hdfs_storage_df[
                [
                    "permissions",
                    "num_replicas",
                    "owner",
                    "group",
                    "size",
                    "modified_date",
                    "time",
                    "path",
                ]
            ] = hdfs_storage_df.output.str.split(expand=True)
            for i in hdfs_storage_df["path"]:
                comm = "hdfs storagepolicies -getStoragePolicy -path " + i
                sam_text = subprocess.Popen(
                    comm, shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                sam_text.wait(10)
                sam_text, err = sam_text.communicate()
                sam_text = sam_text.split("is ", 1)[1]
                hdfs_storage_df["storage_policy"] = sam_text.split("\n", 1)[0]
            hdfs_temp = hdfs_storage_df
            for i in hdfs_storage_df["path"]:
                comm = "hdfs dfs -getfacl " + i + " > ./acl_list.csv"
                sam_text = subprocess.Popen(
                    comm, shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                sam_text.wait(10)
                sam_text, err = sam_text.communicate()
            hdfs_storage_df_temp = pd.read_csv("acl_list.csv")
            subprocess.Popen(
                "rm ./acl_list.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            for i in hdfs_storage_df_temp:
                user_str = str(hdfs_storage_df_temp.iloc[[2]])
                group_str = str(hdfs_storage_df_temp.iloc[[3]])
                other_str = str(hdfs_storage_df_temp.iloc[[4]])
                hdfs_storage_df["user"] = user_str.split("::", 1)[1]
                hdfs_storage_df["user_group"] = group_str.split("::", 1)[1]
                hdfs_storage_df["other"] = other_str.split("::", 1)[1]
            self.logger.info("hdfsStorage successful")
            return hdfs_storage_df, hdfs_flag
        except IndexError:
            hdfs_storage_df = hdfs_temp
            hdfs_flag = 1
            self.logger.info("hdfs_storage successful")
            return hdfs_storage_df, hdfs_flag
        except Exception as e:
            self.logger.error("hdfs_storage failed", exc_info=True)
            return None

    def structured_vs_unstructured(self, total_used_size, hadoop_db_names):
        """Get structure v/s unstructure data details.

        Args:
            total_used_size (float): Total storage size.
            hadoop_db_names (DataFrame): Hive database size.
        Returns:
            size_breakdown_df (DataFrame): Structure v/s unstructure data breakdown
        """

        try:
            total_used_size = float(total_used_size)
            structured_size = float(hadoop_db_names["File_Size"].sum())
            structured_size = structured_size / 1024.0
            unstructured_size = total_used_size - structured_size
            percent_structured = (structured_size / total_used_size) * 100
            percent_structured = str("{0:.3f}".format(percent_structured) + " %")
            percent_unstructured = (unstructured_size / total_used_size) * 100
            percent_unstructured = str("{0:.3f}".format(percent_unstructured) + " %")
            column_names = ["Storage_Type", "Percentage"]
            size_breakdown_df = pd.DataFrame(
                {
                    "Structured Size": percent_structured,
                    "Unstructured Size": percent_unstructured,
                },
                index=[0],
            )
            self.logger.info("structured_vs_unstructured successful")
            return size_breakdown_df
        except Exception as e:
            self.logger.error("structured_vs_unstructured failed", exc_info=True)
            return None

    def check_compression(self):
        """Get HDFS file compression details in cluster.

        Returns:
            value (str): HDFS file compression details.
        """

        try:
            path_status = path.exists("{}".format(self.config_path["mapred"]))
            if path_status == True:
                xml_data = subprocess.Popen(
                    "cat {}".format(self.config_path["mapred"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                xml_data, err = xml_data.communicate()
                root = ET.fromstring(xml_data)
                for val in root.findall("property"):
                    name = val.find("name").text
                    if "mapreduce.map.output.compress.codec" not in name:
                        root.remove(val)
                value = root[0][1].text
                value = " ".join(value.split(".", 5)[5:6])
            else:
                value = None
            self.logger.info("check_compression successful")
            return value
        except Exception as e:
            self.logger.error("check_compression failed", exc_info=True)
            return None

    def cluster_filesize(self):
        """Get HDFS files distribution in cluster.

        Returns:
            grpby_data (DataFrame): File type distribution with its size.
            max_value (float): Maximum size of file.
            min_value (float): Minimum size of file.
            avg_value (float): Average size of file.
        """

        try:
            subprocess.Popen(
                "hdfs dfs -ls -R / | sort -r -n -k 5 > ./hadoop_storage.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            col_names = [
                "permission",
                "links",
                "owner",
                "group",
                "size",
                "creation_date",
                "creation_time",
                "name",
            ]
            big_data = pd.read_csv(
                "hadoop_storage.csv", names=col_names, delimiter=r"\s+", skiprows=1,
            )
            subprocess.Popen(
                "rm ./hadoop_storage.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            big_data = big_data.assign(size_mb=lambda x: (x["size"] / (1024 * 1024)))
            big_data.drop(big_data[big_data["size_mb"] <= 0.1].index, inplace=True)
            big_data["FileType"] = big_data.name.apply(lambda x: x.split(".")[-1])
            big_data = big_data[big_data["FileType"].apply(lambda x: len(x) < 8)]
            grpby_data = big_data.groupby("FileType")["size_mb"].sum()
            grpby_data = grpby_data.sort_values(ascending=False)
            column = big_data["size_mb"]
            max_value = column.max()
            min_value = column.min()
            avg_value = column.mean()
            grpby_data = grpby_data.to_frame().reset_index()
            self.logger.info("cluster_filesize successful")
            return grpby_data, max_value, min_value, avg_value
        except Exception as e:
            self.logger.error("cluster_filesize failed", exc_info=True)
            return None

    def get_hive_config_items(self, cluster_name):
        """Get Hive metastore config details from cluster.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            mt_db_host (str): Metastore database host name
            mt_db_name (str): Metastore database name
            mt_db_type (str): Metastore database type
            mt_db_port (str): Metastore database port number
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/services/hive/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hive/config".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/services/hive/config".format(
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
                    "get_hive_config_items failed as cloudera does not exist",
                )
                return None
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
                self.logger.info("get_hive_config_items successful")
                return mt_db_host, mt_db_name, mt_db_type, mt_db_port
            else:
                self.logger.error(
                    "get_hive_config_items failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hive_config_items failed", exc_info=True)
            return None

    def get_hive_metaStore(self, database_uri, database_type):
        """Get Hive tables and databases details.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            table_df (DataFrame): List of tables and database in hive.
        """

        try:
            engine = create_engine(database_uri)
            table_count = 0
            table_df = pd.DataFrame(
                columns=["Table_Name", "Last_Access_Time", "Data_Type", "Database"]
            )
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select t."TBL_NAME",t."LAST_ACCESS_TIME", d."NAME" 
                from 
                "DBS" as d join "TBLS" as t 
                on 
                t."DB_ID"=d."DB_ID" 
                where 
                d."NAME" not in ('information_schema','sys');
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select t.TBL_NAME,t.LAST_ACCESS_TIME, d.NAME 
                from 
                DBS as d join TBLS as t 
                on 
                t.DB_ID=d.DB_ID 
                where 
                d.NAME not in ('information_schema','sys');
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select t.TBL_NAME, t.LAST_ACCESS_TIME, d.NAME 
                from 
                DBS as d join TBLS as t 
                on 
                t.DB_ID=d.DB_ID 
                where 
                d.NAME not in ('information_schema','sys');
                """
                )
            for row in result:
                table_count = table_count + 1
                table_name = row[0]
                last_access_time = (int(row[1]) + 500) / 1000
                database = row[2]
                table_tmp_df = pd.DataFrame(
                    {
                        "Table_Name": table_name,
                        "Last_Access_Time": datetime.fromtimestamp(
                            last_access_time
                        ).strftime("%Y-%m-%d %H:%M:%S"),
                        "Database": database,
                    },
                    index=[table_count],
                )
                table_df = table_df.append(table_tmp_df)
            table_df["Last_Access_Time"] = pd.to_datetime(table_df["Last_Access_Time"])
            warm = datetime.strptime(self.end_date, "%Y-%m-%dT%H:%M:%S") - timedelta(
                days=1
            )
            cold = datetime.strptime(self.end_date, "%Y-%m-%dT%H:%M:%S") - timedelta(
                days=3
            )
            table_df.loc[table_df["Last_Access_Time"] > warm, "Data_Type"] = "Hot"
            table_df.loc[
                (table_df["Last_Access_Time"] <= warm)
                & (table_df["Last_Access_Time"] > cold),
                "Data_Type",
            ] = "Warm"
            table_df.loc[(table_df["Last_Access_Time"] <= cold), "Data_Type"] = "Cold"
            table_df["Count"] = 1
            table_df = pd.DataFrame(
                {"Data_Type": table_df["Data_Type"], "Table Count": table_df["Count"]}
            )
            table_df = table_df.groupby(["Data_Type"]).sum()
            self.logger.info("get_hive_metaStore successful")
            return table_df
        except Exception as e:
            self.logger.error("get_hive_metaStore failed", exc_info=True)
            return None

    def get_hive_database_info(self, database_uri, database_type):
        """Get Hive databases details.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            database_df (DataFrame): List of databases and thier size in hive.
        """

        try:
            engine = create_engine(database_uri)
            database_df = pd.DataFrame(columns=["Database", "File_Size", "Count"])
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select "NAME"
                from
                "DBS"
                where
                "NAME" not in ('information_schema','sys');
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select NAME
                from
                DBS
                where
                NAME not in ('information_schema','sys');
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select NAME
                from
                DBS
                where
                NAME not in ('information_schema','sys');
                """
                )
            for row in result:
                db = row[0]
                table_count = 0
                if database_type == "postgresql":
                    result = engine.execute(
                        """
                    SELECT count(t."TBL_ID")
                    FROM
                    "DBS" as d join "TBLS" as t
                    on
                    d."DB_ID"=t."DB_ID"
                    where
                    d."NAME" = '{}'
                    GROUP BY d."DB_ID";
                    """.format(
                            db
                        )
                    )
                elif database_type == "mysql":
                    result = engine.execute(
                        """
                    SELECT count(t.TBL_ID)
                    FROM
                    DBS as d join TBLS as t
                    on
                    d.DB_ID=t.DB_ID
                    where
                    d.NAME = '{}'
                    GROUP BY d.DB_ID;
                    """.format(
                            db
                        )
                    )
                elif database_type == "mssql":
                    result = engine.execute(
                        """
                    SELECT count(t.TBL_ID)
                    FROM
                    DBS as d join TBLS as t
                    on
                    d.DB_ID=t.DB_ID
                    where
                    d.NAME = '{}'
                    GROUP BY d.DB_ID;
                    """.format(
                            db
                        )
                    )
                for row in result:
                    table_count = row[0]
                if database_type == "postgresql":
                    result = engine.execute(
                        """
                    SELECT "DB_LOCATION_URI"
                    FROM
                    "DBS"
                    where
                    "NAME" = '{}';
                    """.format(
                            db
                        )
                    )
                elif database_type == "mysql":
                    result = engine.execute(
                        """
                    SELECT DB_LOCATION_URI
                    FROM
                    DBS
                    where
                    NAME = '{}';
                    """.format(
                            db
                        )
                    )
                elif database_type == "mssql":
                    result = engine.execute(
                        """
                    SELECT DB_LOCATION_URI
                    FROM
                    DBS
                    where
                    NAME = '{}';
                    """.format(
                            db
                        )
                    )
                for row in result:
                    database_location = row[0]
                    command = "hdfs dfs -du -s -h {}".format(database_location)
                    command = command + " | awk ' {print $2} '"
                    database_size = subprocess.check_output(command, shell=True)
                    database_size = str(database_size.strip())
                    database_size = database_size.split("'")[1]
                    database_tmp_df = pd.DataFrame(
                        {
                            "Database": db,
                            "File_Size": database_size,
                            "Count": table_count,
                        },
                        index=[table_count],
                    )
                    database_df = database_df.append(database_tmp_df)
            database_df["File_Size"] = database_df["File_Size"].astype(str).astype(int)
            self.logger.info("get_hive_database_info successful")
            return database_df
        except Exception as e:
            self.logger.error("get_hive_database_info failed", exc_info=True)
            return None

    def get_hive_database_count(self, database_uri, database_type):
        """Get Hive databases count.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            database_count (int): Number of databases in hive.
        """

        try:
            engine = create_engine(database_uri)
            database_count = 0
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select count("DB_ID") from "DBS" where "NAME" not in ('information_schema','sys')
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select count(DB_ID) from DBS where NAME not in ('information_schema','sys')
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select count(DB_ID) from DBS where NAME not in ('information_schema','sys')
                """
                )
            for row in result:
                database_count = row[0]
            self.logger.info("get_hive_database_count successful")
            return database_count
        except Exception as e:
            self.logger.error("get_hive_database_count failed", exc_info=True)
            return None

    def get_hive_partitioned_table_count(self, database_uri, database_type):
        """Get Hive partitioned and non-partitioned tables details.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            number_of_tables_with_partition (int): Number of tables with partition in hive
            number_of_tables_without_partition (int): Number of tables without partition in hive
        """

        try:
            engine = create_engine(database_uri)
            total_tables = 0
            number_of_tables_without_partition = 0
            number_of_tables_with_partition = 0
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select count(distinct("TBL_ID")) from "PARTITIONS"
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select count(distinct(TBL_ID)) from PARTITIONS
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select count(distinct(TBL_ID)) from PARTITIONS
                """
                )
            for row in result:
                number_of_tables_with_partition = row[0]
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select count(t."TBL_NAME") 
                from 
                "DBS" as d join "TBLS" as t 
                on 
                t."DB_ID"=d."DB_ID" 
                where 
                d."NAME" not in ('information_schema','sys');
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select count(t.TBL_NAME) 
                from 
                DBS as d join TBLS as t 
                on 
                t.DB_ID=d.DB_ID 
                where 
                d.NAME not in ('information_schema','sys');
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select count(t.TBL_NAME) 
                from 
                DBS as d join TBLS as t 
                on 
                t.DB_ID=d.DB_ID 
                where 
                d.NAME not in ('information_schema','sys');
                """
                )
            for row in result:
                total_tables = row[0]
            number_of_tables_without_partition = (
                total_tables - number_of_tables_with_partition
            )
            self.logger.info("get_hive_partitioned_table_count successful")
            return number_of_tables_with_partition, number_of_tables_without_partition
        except Exception as e:
            self.logger.error("get_hive_partitioned_table_count failed", exc_info=True)
            return None

    def get_hive_internal_external_tables(self, database_uri, database_type):
        """Get Hive internal and external tables count.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            internal_tables (int): Number of internal tables in hive
            external_tables (int): Number of external tables in hive
        """

        try:
            engine = create_engine(database_uri)
            internal_tables = 0
            external_tables = 0
            if database_type == "postgresql":
                result = engine.execute(
                    """
                SELECT count(b."TBL_ID")
                FROM
                "DBS" as a join "TBLS" as b
                on
                a."DB_ID"=b."DB_ID"
                where
                a."NAME" not in('information_schema','sys') and b."TBL_TYPE" = 'MANAGED_TABLE'
                GROUP BY a."DB_ID"
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                SELECT count(b.TBL_ID)
                FROM
                DBS as a join TBLS as b
                on
                a.DB_ID=b.DB_ID
                where
                a.NAME not in('information_schema','sys') and b.TBL_TYPE = 'MANAGED_TABLE'
                GROUP BY a.DB_ID
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                SELECT count(b.TBL_ID)
                FROM
                DBS as a join TBLS as b
                on
                a.DB_ID=b.DB_ID
                where
                a.NAME not in('information_schema','sys') and b.TBL_TYPE = 'MANAGED_TABLE'
                GROUP BY a.DB_ID
                """
                )
            for row in result:
                internal_tables = row[0]
            if database_type == "postgresql":
                result = engine.execute(
                    """
                SELECT count(b."TBL_ID")
                FROM
                "DBS" as a join "TBLS" as b
                on
                a."DB_ID"=b."DB_ID"
                where
                a."NAME" not in('information_schema','sys') and b."TBL_TYPE" = 'EXTERNAL_TABLE'
                GROUP BY a."DB_ID"
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                SELECT count(b.TBL_ID)
                FROM
                DBS as a join TBLS as b
                on
                a.DB_ID=b.DB_ID
                where
                a.NAME not in('information_schema','sys') and b.TBL_TYPE = 'EXTERNAL_TABLE'
                GROUP BY a.DB_ID
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                SELECT count(b.TBL_ID)
                FROM
                DBS as a join TBLS as b
                on
                a.DB_ID=b.DB_ID
                where
                a.NAME not in('information_schema','sys') and b.TBL_TYPE = 'EXTERNAL_TABLE'
                GROUP BY a.DB_ID
                """
                )
            for row in result:
                external_tables = row[0]
            self.logger.info("get_hive_internal_external_tables successful")
            return internal_tables, external_tables
        except Exception as e:
            self.logger.error("get_hive_internal_external_tables failed", exc_info=True)
            return None

    def get_hive_execution_engine(self):
        """Get Hive execution engine details.

        Returns:
            hive_execution_engine (str): Execution engine used by hive.
        """

        try:
            hive_execution_engine = ""
            xml_data = subprocess.Popen(
                "beeline --help", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            )
            xml_data.wait(10)
            out, err = xml_data.communicate()
            out = out.splitlines()
            out1 = str(out)
            substring = "which should be present in beeline-site.xml"
            substring_in_list = any(substring in out1 for string in out)
            if substring_in_list == True:
                xml = subprocess.Popen(
                    'beeline -u jdbc:hive2:// -e "set hive.execution.engine" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                xml.wait(10)
                xml, err = xml.communicate()
            else:
                xml = subprocess.Popen(
                    'hive -e "set hive.execution.engine" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                xml.wait(10)
                xml, err = xml.communicate()
            hive_execution_engine = str(xml)
            hive_execution_engine = hive_execution_engine.split("\\n")
            for line in hive_execution_engine:
                if line.find("hive.execution.engine") != -1:
                    hive_execution_engine = line.split("=")[1]
                    if hive_execution_engine.find("|") != -1:
                        hive_execution_engine = hive_execution_engine.split("|")[0]
                        hive_execution_engine = hive_execution_engine.strip()
            self.logger.info("get_hive_execution_engine successful")
            return hive_execution_engine
        except Exception as e:
            self.logger.error("get_hive_execution_engine failed", exc_info=True)
            return None

    def get_hive_file_formats(self, database_uri, database_type):
        """Get Hive file formats.

        Args:
            database_uri (str): Metastore database connection URI.
            database_type (str): Metastore database type.
        Returns:
            formats (str): List of formats used by Hive.
        """

        try:
            engine = create_engine(database_uri)
            file_formats = []
            if database_type == "postgresql":
                result = engine.execute(
                    """
                select "NAME", "DB_ID" 
                from 
                "DBS" 
                where 
                "NAME" not in ('information_schema','sys');
                """
                )
            elif database_type == "mysql":
                result = engine.execute(
                    """
                select NAME, DB_ID
                from 
                DBS 
                where 
                NAME not in ('information_schema','sys');
                """
                )
            elif database_type == "mssql":
                result = engine.execute(
                    """
                select NAME, DB_ID
                from 
                DBS 
                where 
                NAME not in ('information_schema','sys');
                """
                )
            for row in result:
                db = row[0]
                db_id = row[1]
                if database_type == "postgresql":
                    result = engine.execute(
                        """
                    select "TBL_NAME"
                    from 
                    "TBLS" 
                    where 
                    "DB_ID" = {};
                    """.format(
                            db_id
                        )
                    )
                elif database_type == "mysql":
                    result = engine.execute(
                        """
                    select TBL_NAME
                    from 
                    TBLS
                    where 
                    DB_ID = {};
                    """.format(
                            db_id
                        )
                    )
                elif database_type == "mssql":
                    result = engine.execute(
                        """
                    select TBL_NAME
                    from 
                    TBLS
                    where 
                    DB_ID = {};
                    """.format(
                            db_id
                        )
                    )
                table_name = ""
                for row in result:
                    table_name = row[0]
                    break
                if table_name != "":
                    xml_data = subprocess.Popen(
                        "beeline --help",
                        shell=True,
                        stdout=subprocess.PIPE,
                        encoding="utf-8",
                    )
                    xml_data.wait(10)
                    out, err = xml_data.communicate()
                    out = out.splitlines()
                    out1 = str(out)
                    substring = "which should be present in beeline-site.xml"
                    substring_in_list = any(substring in out1 for string in out)
                    if substring_in_list == True:
                        xml = subprocess.Popen(
                            'beeline -u jdbc:hive2:// -e "use {}; show create table {}" 2>/dev/null | grep "Input"'.format(
                                db, table_name
                            ),
                            shell=True,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            encoding="utf-8",
                        )
                        xml.wait()
                        xml, err = xml.communicate()
                    else:
                        xml = subprocess.Popen(
                            'hive -e "use {}; show create table {}" 2>/dev/null | grep "Input"'.format(
                                db, table_name
                            ),
                            shell=True,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT,
                            encoding="utf-8",
                        )
                        xml.wait(10)
                        xml, err = xml.communicate()
                    file_format = str(xml.strip())
                    file_format = file_format.split("'")[1]
                    file_format = file_format.split(".")[-1]
                    if file_format not in file_formats:
                        file_formats.append(file_format)
            formats = ", ".join(file_formats)
            self.logger.info("get_hive_file_formats successful")
            return formats
        except Exception as e:
            self.logger.error("get_hive_file_formats failed", exc_info=True)
            return None

    def get_transaction_locking_concurrency(self):
        """Get Hive concurrency and locking config.

        Returns:
            transaction_locking_concurrency (str): Concurrency and locking config value.
        """

        try:
            transaction_locking_concurrency = ""
            xml_data = subprocess.Popen(
                "beeline --help", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            )
            xml_data.wait(10)
            out, err = xml_data.communicate()
            out = out.splitlines()
            out1 = str(out)
            substring = "which should be present in beeline-site.xml"
            substring_in_list = any(substring in out1 for string in out)
            if substring_in_list == True:
                concurrency = subprocess.Popen(
                    'beeline -u jdbc:hive2:// -e "set hive.support.concurrency" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                concurrency.wait(10)
                concurrency, err = concurrency.communicate()
                txn_manager = subprocess.Popen(
                    'beeline -u jdbc:hive2:// -e "set hive.txn.manager" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                txn_manager.wait(10)
                txn_manager, err = txn_manager.communicate()

            else:
                concurrency = subprocess.Popen(
                    'hive -e "set hive.support.concurrency" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                concurrency.wait(10)
                concurrency, err = concurrency.communicate()
                txn_manager = subprocess.Popen(
                    'hive -e "set hive.txn.manager" 2>/dev/null',
                    shell=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding="utf-8",
                )
                txn_manager.wait(10)
                txn_manager, err = txn_manager.communicate()

            concurrency = str(concurrency)
            concurrency = concurrency.split("\\n")
            for line in concurrency:
                if line.find("hive.support.concurrency") != -1:
                    concurrency = line.split("=")[1]
                    if concurrency.find("|") != -1:
                        concurrency = concurrency.split("|")[0]
                        concurrency = concurrency.strip()

            txn_manager = str(txn_manager)
            txn_manager = txn_manager.split("\\n")
            for line in txn_manager:
                if line.find("hive.txn.manager") != -1:
                    txn_manager = line.split("=")[1]
                    if txn_manager.find("|") != -1:
                        txn_manager = txn_manager.split("|")[0]
                        txn_manager = txn_manager.strip()

            if (
                concurrency == "true"
                and txn_manager == "org.apache.hadoop.hive.ql.lockmgr.DbTxnManager"
            ):
                transaction_locking_concurrency = "Yes"
            else:
                transaction_locking_concurrency = "No"
            self.logger.info("get_transaction_locking_concurrency successful")
            return transaction_locking_concurrency
        except Exception as e:
            self.logger.error(
                "get_transaction_locking_concurrency failed", exc_info=True
            )
            return None

    def get_hive_adhoc_etl_query(self, yarn_rm, yarn_port):
        """Get Hive adhoc and etl query count over a date range.

        Args:
            yarn_rm (str): Yarn resource manager IP.
        Returns:
            query_type_count_df (DataFrame): Hive adhoc and etl query count in cluster.
        """

        try:
            r = requests.get(
                "{}://{}:{}/ws/v1/cluster/apps".format(self.http, yarn_rm, yarn_port)
            )
            if r.status_code == 200:
                yarn_application = r.json()
                yarn_application_list = yarn_application["apps"]["app"]
                yarn_application_df = pd.DataFrame(yarn_application_list)
                yarn_application_df = pd.DataFrame(
                    {
                        "ApplicationType": yarn_application_df["applicationType"],
                        "StartedTime": pd.to_datetime(
                            (yarn_application_df["startedTime"] + 500) / 1000, unit="s",
                        ),
                        "FinishedTime": pd.to_datetime(
                            (yarn_application_df["finishedTime"] + 500) / 1000,
                            unit="s",
                        ),
                        "User": yarn_application_df["user"],
                        "Name": yarn_application_df["name"],
                    }
                )
                yarn_application_df = yarn_application_df[
                    (yarn_application_df["StartedTime"] < (self.end_date))
                    & (yarn_application_df["StartedTime"] >= (self.start_date))
                    & (yarn_application_df["FinishedTime"] >= (self.start_date))
                ]
                yarn_application_df[yarn_application_df["Name"].str.contains("HIVE")]
                yarn_application_df = yarn_application_df.drop_duplicates(
                    subset="Name", keep="first"
                ).reset_index(drop=True)
                yarn_application_df["QueryType"] = "adhoc"
                yarn_application_df.loc[
                    yarn_application_df["User"].str.contains("service"), "QueryType"
                ] = "etl"
                yarn_application_df.loc[
                    yarn_application_df["User"].str.contains("_svc"), "QueryType"
                ] = "etl"
                yarn_application_df.loc[
                    yarn_application_df["User"].str.contains("svc_"), "QueryType"
                ] = "etl"
                yarn_application_df["Count"] = 1
                query_type_count_df = pd.DataFrame(
                    {
                        "Query_Type": yarn_application_df["QueryType"],
                        "Query Count": yarn_application_df["Count"],
                    }
                )
                query_type_count_df = query_type_count_df.groupby(["Query_Type"]).sum()
                self.logger.info("getHiveAdhocEtlQuery successful")
                return query_type_count_df
            else:
                self.logger.error(
                    "get_hive_adhoc_etl_query failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("get_hive_adhoc_etl_query failed", exc_info=True)
            return None

    def interactive_queries_status(self):
        """Get Hive interactive queries status in cluster.

        Returns:
            hive_interactive_status (str): Hive interactive queries status.
        """

        try:
            path_status = path.exists("{}".format(self.config_path["hive"]))
            if path_status == True:
                hive_interactive_status = "NO"
                xml_data = subprocess.Popen(
                    "cat {}".format(self.config_path["hive"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                xml_data, err = xml_data.communicate()
                root = ET.fromstring(xml_data)
                for key in root.findall("property"):
                    name = key.find("name").text
                    value = key.find("value").text
                    if name == "hive.execution.mode":
                        if value == "llap":
                            hive_interactive_status = "YES"
            else:
                hive_interactive_status = None
            self.logger.info("interactive_queries_status successful")
            return hive_interactive_status
        except Exception as e:
            self.logger.error("interactive_queries_status failed", exc_info=True)
            return None
