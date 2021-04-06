# ------------------------------------------------------------------------------
# pdffunction is a helper module to generate pdf which handles exception and
# based on that the flow will go the particular module as a argument
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class PdfFunctions:
    """This Class has helper functions for pdf generation.

    Args:
        inputs (dict): Contains user input attributes.
        pdf (obj): PDF object.
    """

    def __init__(self, inputs, pdf):
        """Initialize inputs"""

        self.inputs = inputs
        self.version = inputs["version"]
        self.cloudera_manager_host_ip = inputs["cloudera_manager_host_ip"]
        self.cloudera_manager_username = inputs["cloudera_manager_username"]
        self.cloudera_manager_password = inputs["cloudera_manager_password"]
        self.cluster_name = inputs["cluster_name"]
        self.logger = inputs["logger"]
        self.start_date = inputs["start_date"]
        self.end_date = inputs["end_date"]
        self.pdf = pdf

    def summary_table(
        self,
        all_host_data,
        cluster_cpu_usage_avg,
        cluster_memory_usage_avg,
        hadoopVersionMajor,
        hadoopVersionMinor,
        distribution,
        total_storage,
        hdfs_storage_config,
        replication_factor,
        database_df,
        size_breakdown_df,
        table_df,
        yarn_vcore_allocated_avg,
        yarn_memory_allocated_avg,
        new_ref_df,
        base_size,
    ):
        """Add cluster information in PDF

        Args:
            data (dict): Key value pair data for summary table
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(175, 5, "Metrics", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Value", 1, 1, "C", True)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        if type(all_host_data) != type(None):
            host_df = pd.DataFrame(columns=["Hostname"])
            namenodes_df = pd.DataFrame(columns=["HostName"])
            datanodes_df = pd.DataFrame(columns=["HostName"])
            edgenodes_df = pd.DataFrame(columns=["HostName"])
            for i, host in enumerate(all_host_data):
                host_df = host_df.append(
                    pd.DataFrame({"Hostname": [host["hostname"]],}), ignore_index=True,
                )
                for role in host["roleRefs"]:
                    if (
                        re.search(r"\bNAMENODE\b", role["roleName"])
                        or re.search(r"\bSECONDARYNAMENODE\b", role["roleName"])
                        and "hdfs" in role["serviceName"]
                    ):
                        namenodes_df = namenodes_df.append(
                            pd.DataFrame({"HostName": [host["hostname"]],}),
                            ignore_index=True,
                        )
                    if re.search(r"\bDATANODE\b", role["roleName"]):
                        datanodes_df = datanodes_df.append(
                            pd.DataFrame({"HostName": [host["hostname"]],}),
                            ignore_index=True,
                        )
                    if (
                        re.search(r"\bGATEWAY\b", role["roleName"])
                        and "hdfs" in role["serviceName"]
                    ):
                        edgenodes_df = edgenodes_df.append(
                            pd.DataFrame({"HostName": [host["hostname"]],}),
                            ignore_index=True,
                        )
            self.pdf.cell(175, 5, "Number of Host", 1, 0, "L", True)
            self.pdf.cell(50, 5, str(len(host_df)), 1, 1, "C", True)
            self.pdf.cell(175, 5, "Number of NameNodes", 1, 0, "L", True)
            self.pdf.cell(50, 5, str(len(namenodes_df)), 1, 1, "C", True)
            self.pdf.cell(175, 5, "Number of DataNodes", 1, 0, "L", True)
            self.pdf.cell(50, 5, str(len(datanodes_df)), 1, 1, "C", True)
            self.pdf.cell(175, 5, "Number of EdgeNodes", 1, 0, "L", True)
            self.pdf.cell(50, 5, str(len(edgenodes_df)), 1, 1, "C", True)

        if type(cluster_cpu_usage_avg) != type(None):
            self.pdf.cell(175, 5, "Average Cluster CPU Utilization", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f}%".format(cluster_cpu_usage_avg), 1, 1, "C", True
            )

        if type(cluster_memory_usage_avg) != type(None):
            self.pdf.cell(175, 5, "Average Cluster Memory Utilization", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f} GB".format(cluster_memory_usage_avg), 1, 1, "C", True
            )

        if type(hadoopVersionMajor) != type(None):
            self.pdf.cell(175, 5, "Hadoop Major Version", 1, 0, "L", True)
            self.pdf.cell(50, 5, hadoopVersionMajor, 1, 1, "C", True)

        if type(hadoopVersionMinor) != type(None):
            self.pdf.cell(175, 5, "Hadoop Minor Version", 1, 0, "L", True)
            self.pdf.cell(50, 5, hadoopVersionMinor, 1, 1, "C", True)

        if type(distribution) != type(None):
            self.pdf.cell(175, 5, "Hadoop Distribution", 1, 0, "L", True)
            self.pdf.cell(50, 5, distribution, 1, 1, "C", True)

        if type(total_storage) != type(None):
            self.pdf.cell(
                175, 5, "Total Size Configured in the Cluster", 1, 0, "L", True
            )
            self.pdf.cell(50, 5, "{: .2f} GB".format(total_storage), 1, 1, "C", True)

        if type(hdfs_storage_config) != type(None):
            self.pdf.cell(175, 5, "HDFS Storage Available", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f} GB".format(hdfs_storage_config), 1, 1, "C", True
            )

        if type(replication_factor) != type(None):
            self.pdf.cell(175, 5, "HDFS Replication Factor", 1, 0, "L", True)
            self.pdf.cell(50, 5, "{}".format(replication_factor), 1, 1, "C", True)

        if type(size_breakdown_df) != type(None):
            self.pdf.cell(175, 5, "Structured Data", 1, 0, "L", True)
            self.pdf.cell(
                50,
                5,
                "{}".format(size_breakdown_df["Structured Size"].iloc[0]),
                1,
                1,
                "C",
                True,
            )
            self.pdf.cell(175, 5, "Unstructured Data", 1, 0, "L", True)
            self.pdf.cell(
                50,
                5,
                "{}".format(size_breakdown_df["Unstructured Size"].iloc[0]),
                1,
                1,
                "C",
                True,
            )

        if type(table_df) != type(None):
            self.pdf.cell(175, 5, "Number of tables in Hive", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{}".format(table_df["Table Count"].sum()), 1, 1, "C", True
            )

        if type(database_df) != type(None):
            self.pdf.cell(175, 5, "Total data stored in Hive tables", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f}".format(database_df["File_Size"].sum()), 1, 1, "C", True
            )

        if type(yarn_vcore_allocated_avg) != type(None):
            self.pdf.cell(175, 5, "Average No. of Yarn Vcores Used", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f}".format(yarn_vcore_allocated_avg), 1, 1, "C", True
            )

        if type(yarn_memory_allocated_avg) != type(None):
            self.pdf.cell(175, 5, "Average Yarn Memory Used", 1, 0, "L", True)
            self.pdf.cell(
                50, 5, "{: .2f} GB".format(yarn_memory_allocated_avg), 1, 1, "C", True
            )

        if type(base_size) != type(None):
            self.pdf.cell(175, 5, "Hbase data size", 1, 0, "L", True)
            self.pdf.cell(50, 5, "{}".format(base_size), 1, 1, "C", True)

        if type(new_ref_df) != type(None):
            if not new_ref_df[new_ref_df["name"] == "hbase"].empty:
                self.pdf.cell(175, 5, "HBase version", 1, 0, "L", True)
                self.pdf.cell(
                    50,
                    5,
                    "{}".format(
                        new_ref_df[new_ref_df["name"] == "hbase"]["sub_version"].iloc[0]
                    ),
                    1,
                    1,
                    "C",
                    True,
                )

            if not new_ref_df[new_ref_df["name"] == "spark"].empty:
                self.pdf.cell(175, 5, "Spark version", 1, 0, "L", True)
                self.pdf.cell(
                    50,
                    5,
                    "{}".format(
                        new_ref_df[new_ref_df["name"] == "spark"]["sub_version"].iloc[0]
                    ),
                    1,
                    1,
                    "C",
                    True,
                )

            if not new_ref_df[new_ref_df["name"] == "kafka"].empty:
                self.pdf.cell(175, 5, "Kafka version", 1, 0, "L", True)
                self.pdf.cell(
                    50,
                    5,
                    "{}".format(
                        new_ref_df[new_ref_df["name"] == "kafka"]["sub_version"].iloc[0]
                    ),
                    1,
                    1,
                    "C",
                    True,
                )

            if not new_ref_df[new_ref_df["name"] == "impala"].empty:
                self.pdf.cell(175, 5, "Impala version", 1, 0, "L", True)
                self.pdf.cell(
                    50,
                    5,
                    "{}".format(
                        new_ref_df[new_ref_df["name"] == "impala"]["sub_version"].iloc[
                            0
                        ]
                    ),
                    1,
                    1,
                    "C",
                    True,
                )

    def cluster_info(self, cluster_items):
        """Add cluster information in PDF

        Args:
            cluster_items (dict): Metrics of all clusters
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Number of Cluster Configured: {}".format(len(cluster_items)), 0, 1,
        )
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Cluster Details : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        cluster_df = pd.DataFrame(
            cluster_items, columns=["name", "fullVersion", "entityStatus"]
        )
        cluster_df.index = cluster_df.index + 1
        cluster_df = cluster_df.rename(
            columns={
                "name": "Cluster Name",
                "fullVersion": "Cloudera Version",
                "entityStatus": "Health Status",
            }
        )
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(50, 5, "Cluster Name", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Cloudera Version", 1, 0, "C", True)
        self.pdf.cell(60, 5, "Health Status", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(cluster_df)):
            x = self.pdf.get_x()
            y = self.pdf.get_y()
            line_width = 1
            line_width = max(
                line_width,
                self.pdf.get_string_width(cluster_df["Cluster Name"].iloc[pos]),
            )
            cell_y = line_width / 49.0
            line_width = max(
                line_width,
                self.pdf.get_string_width(cluster_df["Cloudera Version"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 49.0)
            line_width = max(
                line_width,
                self.pdf.get_string_width(cluster_df["Health Status"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 59.0)
            cell_y = math.ceil(cell_y)
            cell_y = max(cell_y, 1)
            cell_y = cell_y * 5
            line_width = self.pdf.get_string_width(cluster_df["Cluster Name"].iloc[pos])
            y_pos = line_width / 49.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                50,
                y_pos,
                "{}".format(cluster_df["Cluster Name"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 50, y)
            line_width = self.pdf.get_string_width(
                cluster_df["Cloudera Version"].iloc[pos]
            )
            y_pos = line_width / 49.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                50,
                y_pos,
                "{}".format(cluster_df["Cloudera Version"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 100, y)
            line_width = self.pdf.get_string_width(
                cluster_df["Health Status"].iloc[pos]
            )
            y_pos = line_width / 59.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                60,
                y_pos,
                "{}".format(cluster_df["Health Status"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def cluster_host_info(self, cluster_host_items, all_host_data, os_version):
        """Add detailed information of all host in cluster in PDF.

        Args:
            cluster_host_items (dict): Summary of all hosts in cluster
            all_host_all (list) : Detailed specs of all hosts
            os_version (str): OS version and distribution of host
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        host_df = pd.DataFrame(
            columns=[
                "Hostname",
                "Host ip",
                "Number of cores",
                "Physical Memory",
                "Health Status",
                "Distribution",
            ]
        )
        namenodes_df = pd.DataFrame(columns=["HostName", "Cores", "Memory"])
        masternodes_df = pd.DataFrame(columns=["HostName", "Cores", "Memory"])
        datanodes_df = pd.DataFrame(columns=["HostName", "Cores", "Memory"])
        edgenodes_df = pd.DataFrame(columns=["HostName", "Cores", "Memory"])
        client_gateway_df = pd.DataFrame(columns=["service"])
        for i, host in enumerate(all_host_data):
            if "distribution" in host:
                host_df = host_df.append(
                    pd.DataFrame(
                        {
                            "Hostname": [host["hostname"]],
                            "Host IP": [host["ipAddress"]],
                            "Number of cores": [host["numCores"]],
                            "Physical Memory": [
                                "{: .2f}".format(
                                    float(host["totalPhysMemBytes"])
                                    / 1024
                                    / 1024
                                    / 1024
                                )
                            ],
                            "Health Status": [host["entityStatus"]],
                            "Distribution": [
                                host["distribution"]["name"]
                                + " "
                                + host["distribution"]["version"]
                            ],
                        }
                    ),
                    ignore_index=True,
                )
            else:
                host_df = host_df.append(
                    pd.DataFrame(
                        {
                            "Hostname": [host["hostname"]],
                            "Host IP": [host["ipAddress"]],
                            "Number of cores": [host["numCores"]],
                            "Physical Memory": [
                                "{: .2f}".format(
                                    float(host["totalPhysMemBytes"])
                                    / 1024
                                    / 1024
                                    / 1024
                                )
                            ],
                            "Health Status": [host["entityStatus"]],
                            "Distribution": [os_version],
                        }
                    ),
                    ignore_index=True,
                )
            for role in host["roleRefs"]:
                if (
                    re.search(r"\bNAMENODE\b", role["roleName"])
                    or re.search(r"\bSECONDARYNAMENODE\b", role["roleName"])
                    and "hdfs" in role["serviceName"]
                ):
                    namenodes_df = namenodes_df.append(
                        pd.DataFrame(
                            {
                                "HostName": [host["hostname"]],
                                "Cores": [host["numCores"]],
                                "Memory": [
                                    "{: .2f}".format(
                                        float(host["totalPhysMemBytes"])
                                        / 1024
                                        / 1024
                                        / 1024
                                    )
                                ],
                            }
                        ),
                        ignore_index=True,
                    )
                if (
                    re.search(r"\bNAMENODE\b", role["roleName"])
                    or re.search(r"\bkafka-KAFKA_BROKER\b", role["roleName"])
                    or re.search(r"\bhive-HIVESERVER2\b", role["roleName"])
                    or re.search(r"\byarn-RESOURCEMANAGER\b", role["roleName"])
                    or re.search(r"\bSECONDARYNAMENODE\b", role["roleName"])
                    and "hdfs" in role["serviceName"]
                ):
                    masternodes_df = masternodes_df.append(
                        pd.DataFrame(
                            {
                                "HostName": [host["hostname"]],
                                "Cores": [host["numCores"]],
                                "Memory": [
                                    "{: .2f}".format(
                                        float(host["totalPhysMemBytes"])
                                        / 1024
                                        / 1024
                                        / 1024
                                    )
                                ],
                            }
                        ),
                        ignore_index=True,
                    )
                if re.search(r"\bDATANODE\b", role["roleName"]):
                    datanodes_df = datanodes_df.append(
                        pd.DataFrame(
                            {
                                "HostName": [host["hostname"]],
                                "Cores": [host["numCores"]],
                                "Memory": [
                                    "{: .2f}".format(
                                        float(host["totalPhysMemBytes"])
                                        / 1024
                                        / 1024
                                        / 1024
                                    )
                                ],
                            }
                        ),
                        ignore_index=True,
                    )
                if (
                    re.search(r"\bGATEWAY\b", role["roleName"])
                    and "hdfs" in role["serviceName"]
                ):
                    edgenodes_df = edgenodes_df.append(
                        pd.DataFrame(
                            {
                                "HostName": [host["hostname"]],
                                "Cores": [host["numCores"]],
                                "Memory": [
                                    "{: .2f}".format(
                                        float(host["totalPhysMemBytes"])
                                        / 1024
                                        / 1024
                                        / 1024
                                    )
                                ],
                            }
                        ),
                        ignore_index=True,
                    )
                if "GATEWAY" in role["roleName"]:
                    client_gateway_df = client_gateway_df.append(
                        pd.DataFrame({"service": [role["serviceName"]]}),
                        ignore_index=True,
                    )
        client_gateway_df.drop_duplicates(inplace=True)
        masternodes_df.drop_duplicates(inplace=True)
        self.pdf.cell(
            230, 8, "Number of Host: {}".format(len(all_host_data)), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Number of NameNodes: {}".format(len(namenodes_df)), 0, 1,
        )
        # self.pdf.cell(
        #     230, 8, "Number of MasterNodes: {}".format(len(masternodes_df)), 0, 1,
        # )
        self.pdf.cell(
            230, 8, "Number of DataNodes: {}".format(len(datanodes_df)), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Number of Edge Nodes: {}".format(len(edgenodes_df)), 0, 1,
        )
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Host Details : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Cores in the cluster: {}".format(host_df["Number of cores"].sum()),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Total Memory in the cluster: {: .2f} GB".format(
                host_df["Physical Memory"].astype("float64").sum()
            ),
            0,
            1,
        )
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(65, 5, "Hostname", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Host IP", 1, 0, "C", True)
        self.pdf.cell(15, 5, "Cores", 1, 0, "C", True)
        self.pdf.cell(25, 5, "Memory", 1, 0, "C", True)
        self.pdf.cell(35, 5, "Health Status", 1, 0, "C", True)
        self.pdf.cell(55, 5, "Distribution", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(host_df)):
            x = self.pdf.get_x()
            y = self.pdf.get_y()
            if y > 300:
                self.pdf.add_page()
                x = self.pdf.get_x()
                y = self.pdf.get_y()
            line_width = 0
            line_width = max(
                line_width, self.pdf.get_string_width(host_df["Hostname"].iloc[pos]),
            )
            cell_y = line_width / 64.0
            line_width = max(
                line_width, self.pdf.get_string_width(host_df["Host IP"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 29.0)
            line_width = max(
                line_width,
                self.pdf.get_string_width(str(host_df["Number of cores"].iloc[pos])),
            )
            cell_y = max(cell_y, line_width / 14.0)

            line_width = max(
                line_width,
                self.pdf.get_string_width(str(host_df["Physical Memory"].iloc[pos])),
            )
            cell_y = max(cell_y, line_width / 24.0)

            line_width = max(
                line_width,
                self.pdf.get_string_width(host_df["Health Status"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 34.0)
            line_width = max(
                line_width,
                self.pdf.get_string_width(host_df["Distribution"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 54.0)
            cell_y = math.ceil(cell_y)
            cell_y = max(cell_y, 1)
            cell_y = cell_y * 5
            line_width = self.pdf.get_string_width(host_df["Hostname"].iloc[pos])
            y_pos = line_width / 64.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                65,
                y_pos,
                "{}".format(host_df["Hostname"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 65, y)
            line_width = self.pdf.get_string_width(host_df["Host IP"].iloc[pos])
            y_pos = line_width / 29.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                30, y_pos, "{}".format(host_df["Host IP"].iloc[pos]), 1, "C", fill=True,
            )
            self.pdf.set_xy(x + 95, y)
            line_width = self.pdf.get_string_width(
                str(host_df["Number of cores"].iloc[pos])
            )
            y_pos = line_width / 14.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                15,
                y_pos,
                "{}".format(str(host_df["Number of cores"].iloc[pos])),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 110, y)
            line_width = self.pdf.get_string_width(
                str(host_df["Physical Memory"].iloc[pos])
            )
            y_pos = line_width / 24.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                25,
                y_pos,
                "{}".format(str(host_df["Physical Memory"].iloc[pos])),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 135, y)
            line_width = self.pdf.get_string_width(host_df["Health Status"].iloc[pos])
            y_pos = line_width / 34.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                35,
                y_pos,
                "{}".format(host_df["Health Status"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 170, y)
            line_width = self.pdf.get_string_width(host_df["Distribution"].iloc[pos])
            y_pos = line_width / 54.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                55,
                y_pos,
                "{}".format(host_df["Distribution"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "MasterNodes Details : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Cores Assigned to All the MasterNode: {}".format(
                masternodes_df["Cores"].sum()
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Total Memory Assigned to All the MasterNodes: {: .2f} GB".format(
                masternodes_df["Memory"].astype("float64").sum()
            ),
            0,
            1,
        )
        if len(masternodes_df) != 0:
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(120, 5, "Hostname", 1, 0, "C", True)
            self.pdf.cell(20, 5, "Cores", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Memory", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(masternodes_df)):
                self.pdf.cell(
                    120,
                    5,
                    "{}".format(masternodes_df["HostName"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    20,
                    5,
                    "{}".format(masternodes_df["Cores"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    30,
                    5,
                    "{} GB".format(masternodes_df["Memory"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
        self.pdf.cell(230, 5, "", 0, ln=1)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "DataNodes Details : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Cores Assigned to All the DataNode: {}".format(
                datanodes_df["Cores"].sum()
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Total Memory Assigned to All the DataNodes: {: .2f} GB".format(
                datanodes_df["Memory"].astype("float64").sum()
            ),
            0,
            1,
        )
        if len(datanodes_df) != 0:
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(120, 5, "Hostname", 1, 0, "C", True)
            self.pdf.cell(20, 5, "Cores", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Memory", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(datanodes_df)):
                self.pdf.cell(
                    120,
                    5,
                    "{}".format(datanodes_df["HostName"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    20, 5, "{}".format(datanodes_df["Cores"].iloc[pos]), 1, 0, "C", True
                )
                self.pdf.cell(
                    30,
                    5,
                    "{} GB".format(datanodes_df["Memory"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
        self.pdf.cell(230, 5, "", 0, ln=1)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "EdgeNodes Details : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Cores Assigned to All the EdgeNode: {}".format(
                edgenodes_df["Cores"].sum()
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Total Memory Assigned to All the EdgeNodes: {: .2f} GB".format(
                edgenodes_df["Memory"].astype("float64").sum()
            ),
            0,
            1,
        )
        if len(edgenodes_df) != 0:
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(120, 5, "Hostname", 1, 0, "C", True)
            self.pdf.cell(20, 5, "Cores", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Memory", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(edgenodes_df)):
                self.pdf.cell(
                    120,
                    5,
                    "{}".format(edgenodes_df["HostName"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    20, 5, "{}".format(edgenodes_df["Cores"].iloc[pos]), 1, 0, "C", True
                )
                self.pdf.cell(
                    30,
                    5,
                    "{} GB".format(edgenodes_df["Memory"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
        self.pdf.cell(230, 5, "", 0, ln=1)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Clients Installed on Gateway : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Services", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(client_gateway_df)):
            self.pdf.cell(
                100,
                5,
                "{}".format(client_gateway_df["service"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def cluster_service_info(self, cluster_service_item):
        """Add service installed data in PDF.

        Args:
            cluster_service_item (dict): All services installed in cluster
        """

        service_df = pd.DataFrame(
            columns=["Service Name", "Health Status", "Health Concerns"]
        )
        for i, k in enumerate(cluster_service_item):
            if k["serviceState"] != "STARTED":
                continue
            concerns = ""
            if k["entityStatus"] != "GOOD_HEALTH":
                for l in k["healthChecks"]:
                    if l["summary"] != "GOOD":
                        if concerns == "":
                            concerns = l["name"]
                        else:
                            concerns = concerns + "\n" + l["name"]
            service_df = service_df.append(
                pd.DataFrame(
                    {
                        "Service Name": [k["name"]],
                        "Health Status": [k["entityStatus"]],
                        "Health Concerns": [concerns],
                    }
                ),
                ignore_index=True,
            )
        self.pdf.set_font("Arial", "", 12)
        self.pdf.cell(230, 3, "", 0, ln=1)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Services Running in the Cluster : ", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(60, 5, "Service Name", 1, 0, "C", True)
        self.pdf.cell(60, 5, "Health Status", 1, 0, "C", True)
        self.pdf.cell(90, 5, "Health Concerns", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(service_df)):
            x = self.pdf.get_x()
            y = self.pdf.get_y()
            line_width = 0
            line_width = max(
                line_width,
                self.pdf.get_string_width(service_df["Service Name"].iloc[pos]),
            )
            cell_y = line_width / 59.0
            line_width = max(
                line_width,
                self.pdf.get_string_width(service_df["Health Status"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 59.0)
            line_width = max(
                line_width,
                self.pdf.get_string_width(service_df["Health Concerns"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 89.0)
            cell_y = math.ceil(cell_y)
            cell_y = max(cell_y, 1)
            cell_y = cell_y * 5
            line_width = self.pdf.get_string_width(service_df["Service Name"].iloc[pos])
            y_pos = line_width / 59.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                60,
                y_pos,
                "{}".format(service_df["Service Name"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 60, y)
            line_width = self.pdf.get_string_width(
                service_df["Health Status"].iloc[pos]
            )
            y_pos = line_width / 59.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                60,
                y_pos,
                "{}".format(service_df["Health Status"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 120, y)
            line_width = self.pdf.get_string_width(
                service_df["Health Concerns"].iloc[pos]
            )
            y_pos = line_width / 89.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                90,
                y_pos,
                "{}".format(service_df["Health Concerns"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def cluster_vcore_avg(self, cluster_cpu_usage_avg):
        """Add average vcore utilization of cluster in PDF.

        Args:
            cluster_cpu_usage_avg (float): Average CPU usage in cluster
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Average Cluster CPU Utilization: {: .2f} %".format(cluster_cpu_usage_avg),
            0,
            1,
        )

    def cluster_vcore_plot(self, cluster_total_cores_df, cluster_cpu_usage_df):
        """Add cluster vcore data graph in PDF.

        Args:
            cluster_total_cores_df (DataFrame): Total cores available over time.
            cluster_cpu_usage_df (DataFrame): CPU usage over time
        """

        plt.figure()
        cluster_total_cores_plot = cluster_total_cores_df["Mean"].plot(
            color="steelblue", label="Available Cores"
        )
        cluster_total_cores_plot.set_ylabel("Total CPU Cores")
        cluster_total_cores_plot.legend()
        plt.title("Cluster Vcore Availability")
        plt.savefig("cluster_total_cores_plot.png")
        self.pdf.image(
            "cluster_total_cores_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("cluster_total_cores_plot.png"):
            os.remove("cluster_total_cores_plot.png")
        plt.figure()
        cluster_cpu_usage_plot = cluster_cpu_usage_df["Max"].plot(
            color="red", linestyle="--", label="Max Core Allocated", linewidth=1
        )
        cluster_cpu_usage_plot = cluster_cpu_usage_df["Mean"].plot(
            color="steelblue", label="Mean Cores Allocated"
        )
        cluster_cpu_usage_plot = cluster_cpu_usage_df["Min"].plot(
            color="lime", linestyle="--", label="Min Cores Allocated", linewidth=1
        )
        cluster_cpu_usage_plot.legend()
        cluster_cpu_usage_plot.set_ylabel("CPU Utilization %")
        plt.title("Cluster Vcore Usage")
        plt.savefig("cluster_cpu_usage_plot.png")
        self.pdf.image(
            "cluster_cpu_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("cluster_cpu_usage_plot.png"):
            os.remove("cluster_cpu_usage_plot.png")

    def cluster_memory_avg(self, cluster_memory_usage_avg):
        """Add average memory utilization of cluster in PDF.

        Args:
            cluster_memory_usage_avg (float): Average memory usage in cluster
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Average Cluster Memory Utilization: {: .2f} GB".format(
                cluster_memory_usage_avg
            ),
            0,
            1,
        )

    def cluster_memory_plot(self, cluster_total_memory_df, cluster_memory_usage_df):
        """Add cluster memory data graph in PDF.

        Args:
            cluster_total_memory_df (DataFrame): Total memory available over time
            cluster_memory_usage_df (DataFrame): Memory usage over time
        """

        plt.figure()
        cluster_total_memory_plot = cluster_total_memory_df["Mean"].plot(
            color="steelblue", label="Avaliable Memory"
        )
        cluster_total_memory_plot.set_ylabel("Total Memory(GB)")
        cluster_total_memory_plot.legend()
        plt.title("Cluster Memory Availability")
        plt.savefig("cluster_total_memory_plot.png")
        self.pdf.image(
            "cluster_total_memory_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("cluster_total_memory_plot.png"):
            os.remove("cluster_total_memory_plot.png")
        plt.figure()
        cluster_memory_usage_plot = cluster_memory_usage_df["Mean"].plot(
            color="steelblue", label="Memory Allocated"
        )
        cluster_memory_usage_plot.legend()
        cluster_memory_usage_plot.set_ylabel("Memory Utilization %")
        plt.title("Cluster Memory Usage")
        plt.savefig("cluster_memory_usage_plot.png")
        self.pdf.image(
            "cluster_memory_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("cluster_memory_usage_plot.png"):
            os.remove("cluster_memory_usage_plot.png")

    def memory_usage_edgenode(self, mean_df):
        """Add database server like mysql for metadata in PDF.

        Args:
            database_server (str): Database server present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if len(mean_df) > 0:
            plt.figure()
            mean_df = mean_df["Mean"].plot(color="steelblue", label="Avg Memory Usage")
            mean_df.legend()
            mean_df.set_ylabel("Capacity(GB)")
            plt.title("Memory Usage Pattern")
            plt.savefig("memory_usage_edgenode.png")
            self.pdf.image(
                "memory_usage_edgenode.png", x=0, y=None, w=250, h=85, type="", link=""
            )
            if os.path.exists("memory_usage_edgenode.png"):
                os.remove("memory_usage_edgenode.png")

    def database_server(self, database_server):
        """Add database server like mysql for metadata in PDF.

        Args:
            database_server (str): Database server present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Database Server: {}".format(database_server), 0, 1,
        )

    def dns_server(self, dns_server):
        """Add DNS server details in PDF.

        Args:
            dns_server (str): DNS server present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "DNS Server: {}".format(dns_server), 0, 1,
        )

    def web_server(self, web_server):
        """Add web server details in PDF.

        Args:
            web_server (str): Web server present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Web Server: {}".format(web_server), 0, 1,
        )

    def ntp_server(self, ntp_server):
        """Add NTP server details in PDF.

        Args:
            ntp_server (str): NTP server present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "NTP Server: {}".format(ntp_server), 0, 1,
        )

    def manufacturer_name(self, manufacturer_name):
        """Add manufacturer name of processor in PDF.

        Args:
            manufacturer_name (str): Manufacturer name of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Manufacturer name: {}".format(manufacturer_name), 0, 1,
        )

    def serial_no(self, serial_no):
        """Add serial number of processor in PDF.

        Args:
            serial_no (str): Serial number of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Serial Number: {}".format(serial_no), 0, 1,
        )

    def family(self, family):
        """Add family of processor in PDF.

        Args:
            family (str): Family of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Family: {}".format(family), 0, 1,
        )

    def model_name(self, model_name):
        """Add model name of processor in PDF.

        Args:
            model_name (str): Model name of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Model Name: {}".format(model_name), 0, 1,
        )

    def microcode(self, microcode):
        """Add microcode of processor in PDF.

        Args:
            microcode (str): Microcode of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Microcode: {}".format(microcode), 0, 1,
        )

    def cpu_mhz(self, cpu_mhz):
        """Add CPU MHz of processor in PDF.

        Args:
            cpu_mhz (str): CPU MHz of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "CPU MHz: {}".format(cpu_mhz), 0, 1,
        )

    def cpu_family(self, cpu_family):
        """Add CPU family of processor in PDF.

        Args:
            cpu_family (str): CPU family of processor present in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "CPU Family: {}".format(cpu_family), 0, 1,
        )

    def network_interface_details(self, nic_details):
        """Add NIC details for cluster hardware in PDF.

        Args:
            nic_details (str): NIC details
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Network Interface Card Details: ", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Network Adapter", 1, 0, "C", True)
        self.pdf.cell(70, 5, "IP Address", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(nic_details)):
            self.pdf.cell(
                100, 5, "{}".format(nic_details["nic"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                70, 5, "{}".format(nic_details["ipv4"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def applied_patches(self, patch_dataframe, os_name):
        """Add List of security patches present in clusterr in PDF.

        Args:
            patch_dataframe (DataFrame): List of security patches.
            os_name (str): OS distribution
        """

        if "centos" in os_name or "red hat" in os_name:
            self.pdf.set_font("Arial", "", 12)
            self.pdf.set_text_color(r=66, g=133, b=244)
            self.pdf.cell(230, 8, "Security Patches Details: ", 0, ln=1)
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(70, 5, "Advisory Name", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Severity", 1, 0, "C", True)
            self.pdf.cell(90, 5, "Security Package", 1, 0, "C", True)
            self.pdf.cell(40, 5, "Deployed Date", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(patch_dataframe)):
                self.pdf.cell(
                    70,
                    5,
                    "{}".format(patch_dataframe["Advisory_Name"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    30,
                    5,
                    "{}".format(patch_dataframe["Severity"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    90,
                    5,
                    "{}".format(patch_dataframe["Security_Package"].iloc[pos]),
                    1,
                    0,
                    "C",
                    True,
                )
                self.pdf.cell(
                    40,
                    5,
                    "{}".format(patch_dataframe["Patch_Deployed_Date"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
            self.pdf.cell(230, 5, "", 0, ln=1)
        elif os_name == "":
            self.pdf.set_font("Arial", "", 12)
            self.pdf.set_text_color(r=66, g=133, b=244)
            self.pdf.cell(230, 8, "Security Patches Details: ", 0, ln=1)
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(100, 5, "Installed Security Packages", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(patch_dataframe)):
                self.pdf.cell(
                    100,
                    5,
                    "{}".format(patch_dataframe["Security_Package"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
            self.pdf.cell(230, 5, "", 0, ln=1)

    def list_hadoop_nonHadoop_libs(self, hadoop_native_df):
        """Add List of hadoop and non-hadoop libraries present in cluster in PDF.

        Args:
            hadoop_native_df (DataFrame): List of hadoop and non-hadoop libraries.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "List of Hadoop and Non-Hadoop Libraries: ", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Hadoop Libraries", 1, 0, "C", True)
        self.pdf.cell(100, 5, "Non Hadoop Libraries", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(hadoop_native_df)):
            self.pdf.cell(
                100,
                5,
                "{}".format(hadoop_native_df["Hadoop_Libraries"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                100,
                5,
                "{}".format(hadoop_native_df["Non_Hadoop_Libraries"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def check_libraries_installed(self, python_flag, java_flag, scala_flag):
        """Add check whether python, java and scala are installed in cluster in PDF.

        Args:
            python_flag (int): Check for python installation.
            java_flag (int): Check for java installation.
            scala_flag (int): Check for scala installation.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Programming Softwares: ", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if python_flag == 1:
            self.pdf.cell(230, 8, "Python3 installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Python3 not installed", 0, ln=1)
        if java_flag == 1:
            self.pdf.cell(230, 8, "Java installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Java not installed", 0, ln=1)
        if scala_flag == 1:
            self.pdf.cell(230, 8, "Scala not installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Scala installed", 0, ln=1)

    def security_software(self, security_software):
        """Add list of security software present in cluster in PDF.

        Args:
            security_software (dict): List of security software.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "List of security softwares: ", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(security_software["ranger"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["knox"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["splunk"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["nagios"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["grr"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["misp"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["thehive"]), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(security_software["osquery"]), 0, ln=1)
        self.pdf.cell(
            230, 8, "{}".format(security_software["cloudera_navigator"]), 0, ln=1
        )

    def speciality_hardware(self, gpu_status):
        """Add heck whether GPU is present in cluster in PDF.

        Args:
            gpu_status (str): Check for GPU.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Speciality Hardware:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if int(gpu_status) >= 1:
            self.pdf.cell(230, 8, "GPU is not present", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "GPU is present", 0, ln=1)

    def hadoop_version(self, hadoop_major, hadoop_minor, distribution):
        """Add Hadoop version details in PDF.

        Args:
            hadoop_major (str): Hadoop major version
            hadoop_minor (str): Hadoop miror version
            distribution (str): Hadoop vendor name
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Hadoop Major Version: {}".format(hadoop_major), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Hadoop Minor Version: {}".format(hadoop_minor), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Hadoop Distribution: {}".format(distribution), 0, 1,
        )

    def service_installed(self, new_ref_df):
        """Add list of service installed with their versions in PDF.

        Args:
            new_ref_df (DataFrame): Services mapped with their version.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "List of Services Installed  : ", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Name", 1, 0, "C", True)
        self.pdf.cell(70, 5, "Version", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(new_ref_df)):
            self.pdf.cell(
                100, 5, "{}".format(new_ref_df["name"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                70, 5, "{}".format(new_ref_df["sub_version"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def third_party_software(self, third_party_package):
        """Add list of 3rd party software installed in cluster in PDF.

        Args:
            third_party_package (DataFrame): List of rd party software.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Softwares", 1, 0, "C", True)
        self.pdf.cell(100, 5, "Version", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(third_party_package)):
            self.pdf.cell(
                100,
                5,
                "{}".format(third_party_package["name"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                100,
                5,
                "{}".format(third_party_package["version"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def version_package(self, package_version):
        """Add list of software installed in cluster with their versions in PDF.

        Args:
            package_version (DataFrame): List of software installed.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Name", 1, 0, "C", True)
        self.pdf.cell(70, 5, "Version", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(package_version)):
            self.pdf.cell(
                100, 5, "{}".format(package_version["name"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                70,
                5,
                "{}".format(package_version["version"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def salesforce_sapDriver(self, df_ngdbc, df_salesforce):
        """Add SalesForce and SAP driver in cluster in PDF.

        Args:
            df_ngdbc (DataFrame): SAP driver.
            df_salesforce (DataFrame): SalesForce driver.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if df_salesforce.empty:
            self.pdf.cell(230, 8, "Salesforce driver not found", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Salesforce driver found", 0, ln=1)
        if df_ngdbc.empty:
            self.pdf.cell(230, 8, "Sap driver not found", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Sap driver found", 0, ln=1)

    def jdbcodbc_driver(self, final_df):
        """Add list of JDBC and ODBC driver in cluster in PDF.

        Args:
            final_df (DataFrame): List of JDBC and ODBC driver.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(150, 5, "Drivers", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(final_df)):
            self.pdf.cell(
                150, 5, "{}".format(final_df["name"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def installed_connectors(self, connectors_present):
        """Add list of connectors present in cluster in PDF.

        Args:
            connectors_present (DataFrame): List of connectors.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(150, 5, "Installed Connectors", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(connectors_present)):
            self.pdf.cell(
                150,
                5,
                "{}".format(connectors_present["Connector_Name"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def total_hdfs_size(self, total_storage):
        """Add HDFS configured size in PDF.

        Args:
            total_storage (float): Total storage of cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Size Configured in the Cluster: {: .2f} GB".format(total_storage),
            0,
            1,
        )

    def individual_hdfs_size(self, mapped_df):
        """Add HDFS configured size for each node in PDF.

        Args:
            mapped_df (DataFrame): Storage for each node of cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Size Configured for each Node in the Cluster: ", 0, ln=1)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(120, 5, "Host Name", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Storage Capacity", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(mapped_df)):
            x = self.pdf.get_x()
            y = self.pdf.get_y()
            if y > 300:
                self.pdf.add_page()
                x = self.pdf.get_x()
                y = self.pdf.get_y()
            line_width = 0
            line_width = max(
                line_width, self.pdf.get_string_width(mapped_df["Hostname"].iloc[pos])
            )
            cell_y = line_width / 119.0
            line_width = max(
                line_width,
                self.pdf.get_string_width(mapped_df["Configured_Capacity"].iloc[pos]),
            )
            cell_y = max(cell_y, line_width / 49.0)
            cell_y = math.ceil(cell_y)
            cell_y = max(cell_y, 1)
            cell_y = cell_y * 5
            line_width = self.pdf.get_string_width(mapped_df["Hostname"].iloc[pos])
            y_pos = line_width / 119.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                120,
                y_pos,
                "{}".format(mapped_df["Hostname"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
            self.pdf.set_xy(x + 120, y)
            line_width = self.pdf.get_string_width(
                mapped_df["Configured_Capacity"].iloc[pos]
            )
            y_pos = line_width / 49.0
            y_pos = math.ceil(y_pos)
            y_pos = max(y_pos, 1)
            y_pos = cell_y / y_pos
            self.pdf.multi_cell(
                50,
                y_pos,
                "{}".format(mapped_df["Configured_Capacity"].iloc[pos]),
                1,
                "C",
                fill=True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def rep_factor(self, replication_factor):
        """Add HDFS replication faction in PDF.

        Args:
            replication_factor (str): Replication factor value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Replication Factor: {}".format(replication_factor), 0, 1,
        )

    def trash_interval(self, trash_flag):
        """Add HDFS trash interval data in PDF.

        Args:
            trash_flag (str): Trash interval value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Trash Interval Setup in the Cluster: {}".format(trash_flag), 0, 1,
        )

    def check_compression(self, value):
        """Add HDFS file compression details in PDF.

        Args:
            value (str): HDFS file compression details.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Compression Technique used: {}".format(value), 0, 1,
        )

    def available_hdfs_storage(self, hdfs_storage_config):
        """Add HDFS available size in PDF.

        Args:
            hdfs_storage_config (float): Average HDFS storage available
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "HDFS Storage Available: {: .2f} GB".format(hdfs_storage_config),
            0,
            1,
        )

    def used_hdfs_storage(self, hdfs_storage_used):
        """Add HDFS used size in PDF.

        Args:
            hdfs_storage_used (float): Average HDFS storage used
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "HDFS Storage Used: {: .2f} GB".format(hdfs_storage_used), 0, 1,
        )

    def hdfs_storage_plot(self, hdfs_capacity_df, hdfs_capacity_used_df):
        """Add HDFS storage size graph in PDF.

        Args:
            hdfs_capacity_df (DataFrame): HDFS storage available over time
            hdfs_capacity_used_df (DataFrame): HDFS storage used over time
        """

        plt.figure()
        hdfs_usage_plot = hdfs_capacity_df["Mean"].plot(
            color="steelblue", label="Storage Available"
        )
        hdfs_usage_plot = hdfs_capacity_used_df["Mean"].plot(
            color="darkorange", label="Storage Used"
        )
        hdfs_usage_plot.legend()
        hdfs_usage_plot.set_ylabel("HDFS Capacity(GB)")
        plt.title("HDFS Usage")
        plt.savefig("hdfs_usage_plot.png")
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 3, "", 0, ln=1)
        self.pdf.image(
            "hdfs_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("hdfs_usage_plot.png"):
            os.remove("hdfs_usage_plot.png")

    def hdfs_storage(self, hdfs_storage_df, hdfs_flag):
        """Add HDFS folders and files details in PDF.

        Args:
            hdfs_storage_df (DataFrame): HDFS folders and files details
        """

        if not hdfs_storage_df.empty:
            self.pdf.set_font("Arial", "", 12)
            self.pdf.set_text_color(r=66, g=133, b=244)
            self.pdf.cell(230, 8, "HDFS Folder and File Structure: ", 0, ln=1)
            if hdfs_flag == 0:
                self.pdf.set_font("Arial", "B", 12)
                self.pdf.set_fill_color(r=66, g=133, b=244)
                self.pdf.set_text_color(r=255, g=255, b=255)
                self.pdf.cell(30, 5, "Folder", 1, 0, "C", True)
                self.pdf.cell(15, 5, "Owner", 1, 0, "C", True)
                self.pdf.cell(15, 5, "Size", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Modified Date", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Modified Time", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Storage Policy", 1, 0, "C", True)
                self.pdf.cell(25, 5, "Permissions", 1, 0, "C", True)
                self.pdf.cell(15, 5, "User", 1, 0, "C", True)
                self.pdf.cell(20, 5, "User-Group", 1, 0, "C", True)
                self.pdf.cell(15, 5, "Other", 1, 1, "C", True)
                self.pdf.set_text_color(r=1, g=1, b=1)
                self.pdf.set_fill_color(r=244, g=244, b=244)
                self.pdf.set_font("Arial", "", 12)
                for pos in range(0, len(hdfs_storage_df)):
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["path"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["owner"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["size"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["modified_date"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["time"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["storage_policy"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        25,
                        5,
                        "{}".format(hdfs_storage_df["permissions"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["user"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        20,
                        5,
                        "{}".format(hdfs_storage_df["user_group"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["other"].iloc[pos]),
                        1,
                        1,
                        "C",
                        True,
                    )
                self.pdf.cell(230, 5, "", 0, ln=1)
            else:
                self.pdf.set_font("Arial", "B", 12)
                self.pdf.set_fill_color(r=66, g=133, b=244)
                self.pdf.set_text_color(r=255, g=255, b=255)
                self.pdf.cell(30, 5, "Folder", 1, 0, "C", True)
                self.pdf.cell(15, 5, "Owner", 1, 0, "C", True)
                self.pdf.cell(15, 5, "Size", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Modified Date", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Modified Time", 1, 0, "C", True)
                self.pdf.cell(30, 5, "Storage Policy", 1, 0, "C", True)
                self.pdf.cell(25, 5, "Permissions", 1, 1, "C", True)
                self.pdf.set_text_color(r=1, g=1, b=1)
                self.pdf.set_fill_color(r=244, g=244, b=244)
                self.pdf.set_font("Arial", "", 12)
                for pos in range(0, len(hdfs_storage_df)):
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["path"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["owner"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        15,
                        5,
                        "{}".format(hdfs_storage_df["size"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["modified_date"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["time"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        30,
                        5,
                        "{}".format(hdfs_storage_df["storage_policy"].iloc[pos]),
                        1,
                        0,
                        "C",
                        True,
                    )
                    self.pdf.cell(
                        25,
                        5,
                        "{}".format(hdfs_storage_df["permissions"].iloc[pos]),
                        1,
                        1,
                        "C",
                        True,
                    )
                self.pdf.cell(230, 5, "", 0, ln=1)

    def cluster_file_size(self, grpby_data, max_value, min_value, avg_value):
        """Add HDFS files distribution in PDF.

        Args:
            grpby_data (DataFrame): File type distribution with its size.
            max_value (float): Maximum size of file.
            min_value (float): Minimum size of file.
            avg_value (float): Average size of file.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "HDFS Data Distribution: ", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Maximum Size of a file: {: .2f} MB".format(max_value), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Minimum Size of a file: {: .2f} MB".format(min_value), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Average Size of a file: {: .2f} MB".format(avg_value), 0, 1,
        )
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(60, 5, "File Type", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Size (mb)", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(grpby_data)):
            self.pdf.cell(
                60, 5, "{}".format(grpby_data["FileType"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                50,
                5,
                "{}".format((grpby_data["size_mb"].round(2)).iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def hive_metastore_details(self, mt_db_host, mt_db_name, mt_db_type, mt_db_port):
        """Add Hive metastore details in PDF.

        Args:
            mt_db_host (str): Metastore database host name
            mt_db_name (str): Metastore database name
            mt_db_type (str): Metastore database type
            mt_db_port (str): Metastore database port number
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Hive Metastore Details:", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Metastore Host: {}".format(mt_db_host), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Metastore Database: {}".format(mt_db_type), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Metastore Database Name: {}".format(mt_db_name), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Metastore Database Port: {}".format(mt_db_port), 0, 1,
        )

    def hive_details(
        self,
        database_count,
        tables_with_partition,
        tables_without_partition,
        internal_tables,
        external_tables,
        hive_execution_engine,
        formats,
        transaction_locking_concurrency,
        hive_interactive_status,
    ):
        """Add Hive details in PDF.

        Args:
            database_count (int): Number of databases in hive.
            tables_with_partition (int): Number of tables with partition in hive
            tables_without_partition (int): Number of tables without partition in hive
            internal_tables (int): Number of internal tables in hive
            external_tables (int): Number of external tables in hive
            hive_execution_engine (str): Execution engine used by hive.
            formats (str): List of formats used by Hive.
            transaction_locking_concurrency (str): Concurrency and locking config value.
            hive_interactive_status (str): Hive interactive queries status.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Hive Details:", 0, ln=1)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Number of Databases: {}".format(database_count), 0, 1,
        )
        self.pdf.cell(
            230,
            8,
            "Number of tables with partition: {}".format(tables_with_partition),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Number of tables without partition: {}".format(tables_without_partition),
            0,
            1,
        )
        self.pdf.cell(
            230, 8, "Number of Internal Tables: {}".format(internal_tables), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Number of External Tables: {}".format(external_tables), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Hive Execution Engine: {}".format(hive_execution_engine), 0, 1,
        )
        self.pdf.cell(
            230, 8, "File Formats used in hive datasets: {}".format(formats), 0, 1,
        )
        self.pdf.cell(
            230,
            8,
            "Do tables require Transaction Locking concurrency: {}".format(
                transaction_locking_concurrency
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Hive Interactive Queries: {}".format(hive_interactive_status),
            0,
            1,
        )

    def hive_databases_size(self, database_df):
        """Add Hive databases size table in PDF.

        Args:
            database_df (DataFrame): List of databases and thier size in hive.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Hive Databases:", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(80, 5, "Database", 1, 0, "C", True)
        self.pdf.cell(40, 5, "Size", 1, 0, "C", True)
        self.pdf.cell(40, 5, "No. of Tables", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(database_df)):
            self.pdf.cell(
                80, 5, "{}".format(database_df["Database"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                40,
                5,
                "{: .2f} GB".format(float(database_df["File_Size"].iloc[pos])),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                40, 5, "{}".format(database_df["Count"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def hive_access_frequency(self, table_df):
        """Add Hive access frequency graph in PDF.

        Args:
            table_df (DataFrame): List of tables and database in hive.
        """

        plt.figure()
        table_plot = table_df.plot.pie(
            y="Table Count",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Table Count By Access Frequency",
        )
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Hot(within 1 day), Warm(from 1 to 3 days), Cold(more than 3 days)",
            0,
            ln=1,
        )
        plt.savefig("table_type_count_plot.png")
        self.pdf.image(
            "table_type_count_plot.png", x=15, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("table_type_count_plot.png"):
            os.remove("table_type_count_plot.png")

    def hive_adhoc_etl_query(self, query_type_count_df):
        """Add structure v/s unstructure data details in PDF.

        Args:
            size_breakdown_df (DataFrame): Structure v/s unstructure data breakdown.
        """

        plt.figure()
        hive_query_type_plot = query_type_count_df.plot.pie(
            y="Query Count",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Hive Queries By Type",
        )
        plt.savefig("hive_query_type_plot.png")
        self.pdf.image(
            "hive_query_type_plot.png", x=15, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("hive_query_type_plot.png"):
            os.remove("hive_query_type_plot.png")

    def structured_vs_unstructured(self, size_breakdown_df):
        """Add Hive adhoc and etl query count graph in PDF.

        Args:
            query_type_count_df (DataFrame): Hive adhoc and etl query count in cluster.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(80, 5, "Structured Size", 1, 0, "C", True)
        self.pdf.cell(80, 5, "Unstructured Size", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(size_breakdown_df)):
            self.pdf.cell(
                80,
                5,
                "{}".format(size_breakdown_df["Structured Size"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                80,
                5,
                "{}".format(size_breakdown_df["Unstructured Size"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def kerberos_info(self, kerberos):
        """Add Kerberos details in PDF.

        Args:
            kerberos (str): Kerberos information of cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Kerberos Details: {}".format(kerberos), 0, 1,
        )

    def ad_server_name_and_port(self, ADServer):
        """Add AD server details in PDF.

        Args:
            ADServer (str): Url and port of AD server.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "AD Server Name and Port: {}".format(ADServer), 0, 1,
        )

    def ad_server_based_dn(self, Server_dn):
        """Add AD server details based on domain name details in PDF.

        Args:
            Server_dn (str): Domain name of LDAP bind parameter.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "AD Server Based DN: {}".format(Server_dn), 0, 1,
        )

    def ssl_status(self, Mr_ssl, hdfs_ssl, yarn_ssl):
        """Add SSL staus of various services in PDF.

        Args:
            Mr_ssl (str): MapReduce SSL status
            hdfs_ssl (str): HDFS SSL status
            yarn_ssl (str): Yarn SSL status
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "SSL/TLS Status:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(hdfs_ssl), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(yarn_ssl), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(Mr_ssl), 0, ln=1)

    def kerberos_http_auth(self, hue_flag, mapred_flag, hdfs_flag, yarn_flag, keytab):
        """Add kerberos status of various services in PDF.

        Args:
            hue_flag (str): Hue kerberos status
            mapred_flag (str): MapReduce kerberos status
            hdfs_flag (str): HDFS kerberos status
            yarn_flag (str): Yarn kerberos status
            keytab (str): Presence of keytab files
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Kerberos Status:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "{}".format(keytab), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(hue_flag), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(mapred_flag), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(hdfs_flag), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(yarn_flag), 0, 1,
        )

    def check_luks(self, luks_detect):
        """Add LUKS information in PDF.

        Args:
            luks_detect (str): LUKS information.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if luks_detect["TYPE_LOWER"].str.contains("luks").any():
            self.pdf.cell(230, 8, "LUKS is used", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "LUKS is not used", 0, ln=1)

    def port_used(self, port_df):
        """Add port number for different services in PDF.

        Args:
            port_df (DataGrame): port number for different services.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(80, 5, "Service", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Port", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(port_df)):
            self.pdf.cell(
                80, 5, "{}".format(port_df["service"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                50, 5, "{}".format(port_df["port"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def key_list(self, key_list):
        """Add list of keys in PDF.

        Args:
            key_list (str): list of keys.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Key list: {}".format(key_list), 0, 1,
        )

    def encryption_zone(self, enc_zoneList):
        """Add list of encryption zone in PDF.

        Args:
            enc_zoneList (DataGrame): list of encryption zone.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(80, 5, "Zones", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(enc_zoneList)):
            self.pdf.cell(
                80, 5, "{}".format(enc_zoneList["data"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def max_bandwidth(self, max_bandwidth):
        """Add maximum bandwidth information in PDF.

        Args:
            max_bandwidth (str): maximum bandwidth.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Maximum Bandwidth:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Maximum Data Transferred: {} Mbps".format(max_bandwidth), 0, 1,
        )

    def ingress_egress(
        self,
        max_value_in,
        min_value_in,
        avg_value_in,
        curr_value_in,
        max_value_out,
        min_value_out,
        avg_value_out,
        curr_value_out,
    ):
        """Add ingress network traffic information in PDF.

        Args:
            max_value (str) : Maximun ingress value
            min_value (str) : Minimun ingress value
            avg_value (str) : Average ingress value
            curr_value (str) : Current ingress value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Ingress Traffic:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Maximum Incoming Throughput: {: .2f} Kbps".format(max_value_in),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Minimum Incoming Throughput: {: .2f} Kbps".format(min_value_in),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Average Incoming Throughput: {: .2f} Kbps".format(avg_value_in),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Current Incoming Throughput: {: .2f} Kbps".format(curr_value_in),
            0,
            1,
        )
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Egress Traffic:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Maximum Outgoing Throughput: {: .2f} Kbps".format(max_value_out),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Minimum Outgoing Throughput: {: .2f} Kbps".format(min_value_out),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Average Outgoing Throughput: {: .2f} Kbps".format(avg_value_out),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Current Outgoing Throughput: {: .2f} Kbps".format(curr_value_out),
            0,
            1,
        )

    def disk_read_write(self, total_disk_read, total_disk_write):
        """Add disk read and write speed information in PDF.

        Args:
            total_disk_read (str) : Disk read speed
            total_disk_write (str) : Disk write speed
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Disk Write and Read Speed:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Total disk read in KB/s: {: .2f}".format(total_disk_read), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Total disk write in KB/s: {: .2f}".format(total_disk_write), 0, 1,
        )

    def third_party_monitor(
        self,
        softwares_installed,
        prometheus_server,
        grafana_server,
        ganglia_server,
        check_mk_server,
    ):
        """Add list of third party monitoring tools in PDF.

        Args:
            softwares_installed (str): List of software installed in cluster.
            prometheus_server (str): Presence of prometheus in cluster
            grafana_server (str): Presence of grafana in cluster
            ganglia_server (str): Presence of ganglia in cluster
            check_mk_server (str): Presence of check_mk_server in cluster
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Third Party Monitoring Tools:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if "nagios" in softwares_installed:
            self.pdf.cell(230, 8, "Nagios is Installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Nagios is not Installed", 0, ln=1)
        if "zabbiz" in softwares_installed:
            self.pdf.cell(230, 8, "Zabbiz is Installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Zabbiz is not Installed", 0, ln=1)
        if "cacti" in softwares_installed:
            self.pdf.cell(230, 8, "Cacti is Installed", 0, ln=1)
        else:
            self.pdf.cell(230, 8, "Cacti is not Installed", 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(prometheus_server), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(grafana_server), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(ganglia_server), 0, ln=1)
        self.pdf.cell(230, 8, "{}".format(check_mk_server), 0, ln=1)

    def orchestration_tools(self, oozie_flag, crontab_flag, airflow_flag):
        """Add orchestration tool details in PDF.

        Args:
            oozie_flag (str): Presence of oozie in cluster
            crontab_flag (str): Presence of crontab in cluster
            airflow_flag (str): Presence of airflow in cluster
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Orchestration Tools:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "{}".format(oozie_flag), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(crontab_flag), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(airflow_flag), 0, 1,
        )

    def logging_tool(self, ddog, splunk, new_relic, elastic_search):
        """Add logging tool details in PDF.

        Args:
            ddog (str): Presence of Datadog in cluster
            splunk (str): Presence of Splunk in cluster
            new_relic (str): Presence of Newrelic in cluster
            elastic_search (str): Presence of Elasticsearch in cluster
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Logging Tools:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "{}".format(ddog), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(splunk), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(new_relic), 0, 1,
        )
        self.pdf.cell(
            230, 8, "{}".format(elastic_search), 0, 1,
        )

    def pdf_monitor_network_speed(
        self,
        max_value_1,
        min_value_1,
        avg_value_1,
        max_value_2,
        min_value_2,
        avg_value_2,
    ):
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Third Party Network Monitoring:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Receiver Speed:", 0, ln=1)
        self.pdf.cell(230, 8, "Peak Speed: {} ".format(max_value_1), 0, ln=1)
        self.pdf.cell(230, 8, "Minimum Speed: {} ".format(min_value_1), 0, ln=1)
        self.pdf.cell(230, 8, "Average Speed: {} ".format(avg_value_1), 0, ln=1)
        self.pdf.cell(230, 8, "Transfer Speed:", 0, ln=1)
        self.pdf.cell(230, 8, "Peak Speed: {} ".format(max_value_2), 0, ln=1)
        self.pdf.cell(230, 8, "Minimum Speed: {} ".format(min_value_2), 0, ln=1)
        self.pdf.cell(230, 8, "Average Speed: {} ".format(avg_value_2), 0, ln=1)

    def get_logs(self, logs):
        """Add logs paths in PDF.

        Args:
            logs (str): List of logs path.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(80, 5, "Name", 1, 0, "C", True)
        self.pdf.cell(130, 5, "Logs Path", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for i in logs.index:
            self.pdf.cell(
                80, 5, "{}".format(logs["name"][i]), 1, 0, "C", True,
            )
            self.pdf.cell(
                130, 5, "/var/log/{}".format(logs["name"][i]), 1, 1, "C", True,
            )

    def dynamic_resouce_pool(self, resource):
        """Add dynamic resource pool information of cluster in PDF.

        Args:
            resource (str): Dynamic resource pool information.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "{}".format(resource), 0, 1,
        )

    def identify_ha(self, zookeeper_ha, hive_ha, yarn_ha, hdfs_ha):
        """Add HA config for various services in PDF.

        Args:
            zookeeper_ha (str): ZooKeeper HA config
            hive_ha (str): Hive HA config
            yarn_ha (str): Yarn HA config
            hdfs_ha (str): HDFS HA config
        """
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "HA Status:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if hdfs_ha == 1:
            self.pdf.cell(
                230, 8, "HDFS: Enabled", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "HDFS: Disabled", 0, 1,
            )
        if yarn_ha == 1:
            self.pdf.cell(
                230, 8, "Yarn: Enabled", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Yarn: Disabled", 0, 1,
            )
        if hive_ha == 1:
            self.pdf.cell(
                230, 8, "Hive: Enabled", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Hive: Disabled", 0, 1,
            )
        if zookeeper_ha == 1:
            self.pdf.cell(
                230, 8, "Zookeeper: Enabled", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Zookeeper: Disabled", 0, 1,
            )

    def yarn_vcore_total(self, yarn_total_vcores_count):
        """Add yarn total vcore in PDF.

        Args:
            yarn_total_vcores_count (float): Total vcores configured to yarn
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Total Yarn Vcore: {: .2f}".format(yarn_total_vcores_count), 0, 1,
        )

    def yarn_vcore_avg(self, yarn_vcore_allocated_avg):
        """Add yarn average vcore in PDF.

        Args:
            yarn_vcore_allocated_avg (float): Average vcores allocated in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Average No. of Vcores Used: {: .2f}".format(yarn_vcore_allocated_avg),
            0,
            1,
        )

    def yarn_vcore_usage(self, yarn_vcore_available_df, yarn_vcore_allocated_df):
        """Add yarn vcore usage graph in PDF.

        Args:
            yarn_vcore_available_df (DataFrame): Vcores available over time.
            yarn_vcore_allocated_df (DataFrame): Vcores allocation over time.
        """

        plt.figure()
        yarn_vcore_usage_plot = yarn_vcore_available_df["Mean"].plot(
            color="steelblue", label="Vcores Available"
        )
        yarn_vcore_usage_plot = yarn_vcore_allocated_df["Mean"].plot(
            color="darkorange", label="Vcores Allocated (Mean)"
        )
        yarn_vcore_usage_plot = yarn_vcore_allocated_df["Max"].plot(
            color="red", label="Vcores Allocated (Max)", linestyle="--", linewidth=1
        )
        yarn_vcore_usage_plot.legend()
        yarn_vcore_usage_plot.set_ylabel("Total Vcore Usage")
        plt.title("Yarn Vcore Usage")
        plt.savefig("yarn_vcore_usage_plot.png")
        self.pdf.image(
            "yarn_vcore_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_vcore_usage_plot.png"):
            os.remove("yarn_vcore_usage_plot.png")

    def yarn_vcore_seasonality(self, yarn_vcore_allocated_pivot_df):
        """Add yarn vcore seasonality graph in PDF.

        Args:
            yarn_vcore_allocated_pivot_df (DataFrame): Seasonality of vcores allocation over time.
        """

        plt.figure()
        yarn_vcore_usage_heatmap = sns.heatmap(
            yarn_vcore_allocated_pivot_df, cmap="OrRd"
        )
        plt.title("Yarn Vcore Usage")
        plt.savefig("yarn_vcore_usage_heatmap.png")
        self.pdf.image(
            "yarn_vcore_usage_heatmap.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_vcore_usage_heatmap.png"):
            os.remove("yarn_vcore_usage_heatmap.png")

    def yarn_memory_total(self, yarn_total_memory_count):
        """Add yarn total memory in PDF.

        Args:
            yarn_total_memory_count (float): Total memory configured to yarn.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Yarn Memory: {: .2f} GB".format(yarn_total_memory_count),
            0,
            1,
        )

    def yarn_memory_avg(self, yarn_memory_allocated_avg):
        """Add yarn average memory in PDF.

        Args:
            yarn_memory_allocated_avg (float): Average memory allocated in cluster.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Average Yarn Memory Used: {: .2f} MB".format(yarn_memory_allocated_avg),
            0,
            1,
        )

    def yarn_memory_usage(self, yarn_memory_available_df, yarn_memory_allocated_df):
        """Add yarn memory usage graph in PDF

        Args:
            yarn_memory_available_df (DataFrame): Memory available over time.
            yarn_memory_allocated_df (DataFrame): Memory allocation over time.
        """

        plt.figure()
        yarn_memory_usage_plot = yarn_memory_available_df["Mean"].plot(
            color="steelblue", label="Memory Available"
        )
        yarn_memory_usage_plot = yarn_memory_allocated_df["Mean"].plot(
            color="darkorange", label="Memory Allocated (Mean)"
        )
        yarn_memory_usage_plot = yarn_memory_allocated_df["Max"].plot(
            color="red", label="Memory Allocated (Max)", linestyle="--", linewidth=1
        )
        yarn_memory_usage_plot.legend()
        yarn_memory_usage_plot.set_ylabel("Total Yarn Memory(MB)")
        plt.title("Yarn Memory Usage")
        plt.savefig("yarn_memory_usage_plot.png")
        self.pdf.image(
            "yarn_memory_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_memory_usage_plot.png"):
            os.remove("yarn_memory_usage_plot.png")

    def yarn_memory_seasonality(self, yarn_memory_allocated_pivot_df):
        """Add yarn memory seasonality graph in PDF.

        Args:
            yarn_memory_allocated_pivot_df (DataFrame): Seasonality of memory allocation over time.
        """

        plt.figure()
        yarn_memory_usage_heatmap = sns.heatmap(
            yarn_memory_allocated_pivot_df, cmap="OrRd"
        )
        plt.title("Yarn Memory Usage")
        plt.savefig("yarn_memory_usage_heatmap.png")
        self.pdf.image(
            "yarn_memory_usage_heatmap.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_memory_usage_heatmap.png"):
            os.remove("yarn_memory_usage_heatmap.png")

    def yarn_app_count(self, app_count_df):
        """Add yarn application count table in PDF.

        Args:
            app_count_df (DataFrame): Application count in yarn.
        """

        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(60, 5, "Application Type", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Status", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Count", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(app_count_df)):
            self.pdf.cell(
                60,
                5,
                "{}".format(app_count_df["Application Type"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                50, 5, "{}".format(app_count_df["Status"].iloc[pos]), 1, 0, "C", True
            )
            self.pdf.cell(
                30, 5, "{}".format(app_count_df["Count"].iloc[pos]), 1, 1, "C", True
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def yarn_app_type_status(self, app_type_count_df, app_status_count_df):
        """Add yarn application type and status pie chart in PDF.

        Args:
            app_type_count_df (DataFrame): Application count by type in yarn.
            app_status_count_df (DataFrame): Application count by status in yarn.
        """

        x = self.pdf.get_x()
        y = self.pdf.get_y()
        plt.figure()
        app_type_count_pie_plot = app_type_count_df.plot.pie(
            y="Count",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Yarn Application by Type",
        )
        plt.savefig("app_type_count_pie_plot.png")
        self.pdf.image(
            "app_type_count_pie_plot.png", x=15, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("app_type_count_pie_plot.png"):
            os.remove("app_type_count_pie_plot.png")
        self.pdf.set_xy(x, y)
        plt.figure()
        app_status_count_pie_plot = app_status_count_df.plot.pie(
            y="Count",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Yarn Application by Status",
        )
        plt.savefig("app_status_count_pie_plot.png")
        self.pdf.image(
            "app_status_count_pie_plot.png", x=130, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("app_status_count_pie_plot.png"):
            os.remove("app_status_count_pie_plot.png")

    def streaming_jobs(self, only_streaming):
        """Add list of streaming application in PDF.

        Args:
            only_streaming (str): List of streaming application.
        """

        if not only_streaming.empty:
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(70, 5, "Streaming Applications", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(only_streaming)):
                self.pdf.cell(
                    70,
                    5,
                    "{}".format(only_streaming["ApplicationType"].iloc[pos]),
                    1,
                    1,
                    "C",
                    True,
                )
            self.pdf.cell(230, 5, "", 0, ln=1)

    def yarn_app_vcore_memory(self, app_vcore_df, app_memory_df):
        """Add yarn vcore and memory by application pie chart in PDF.

        Args:
            app_vcore_df (DataFrame): Vcores usage by applications
            app_memory_df (DataFrame): Memory usage by applications
        """

        x = self.pdf.get_x()
        y = self.pdf.get_y()
        plt.figure()
        app_vcore_plot = app_vcore_df.plot.pie(
            y="Vcore",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Yarn Application Vcore Usage",
        )
        plt.savefig("app_vcore_plot.png")
        self.pdf.image("app_vcore_plot.png", x=15, y=None, w=95, h=95, type="", link="")
        if os.path.exists("app_vcore_plot.png"):
            os.remove("app_vcore_plot.png")
        self.pdf.set_xy(x, y)
        plt.figure()
        app_memory_plot = app_memory_df.plot.pie(
            y="Memory",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Yarn Application Memory Usage",
        )
        plt.savefig("app_memory_plot.png")
        self.pdf.image(
            "app_memory_plot.png", x=130, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("app_memory_plot.png"):
            os.remove("app_memory_plot.png")

    def yarn_app_vcore_usage(self, app_vcore_df, app_vcore_usage_df):
        """Add yarn vcore usage graph in PDF.

        Args:
            app_vcore_df (DataFrame): Vcore breakdown by application
            app_vcore_usage_df (DataFrame): Vcore usage over time
        """

        plt.figure()
        for i in app_vcore_df["Application Type"].unique():
            app_vcore_df_temp = pd.DataFrame(None)
            app_vcore_df_temp = app_vcore_df[app_vcore_df["Application Type"] == i]
            app_vcore_usage_df[i] = 0
            for index, row in app_vcore_df_temp.iterrows():
                val = (row["Launch Time"], 0)
                if val not in app_vcore_usage_df["Date"]:
                    app_vcore_usage_df.loc[len(app_vcore_usage_df)] = val
                val = (row["Finished Time"], 0)
                if val not in app_vcore_usage_df["Date"]:
                    app_vcore_usage_df.loc[len(app_vcore_usage_df)] = val
                app_vcore_usage_df.loc[
                    (app_vcore_usage_df["Date"] >= row["Launch Time"])
                    & (app_vcore_usage_df["Date"] < row["Finished Time"]),
                    i,
                ] = (
                    app_vcore_usage_df.loc[
                        (app_vcore_usage_df["Date"] >= row["Launch Time"])
                        & (app_vcore_usage_df["Date"] < row["Finished Time"])
                    ][i]
                    + row["Vcore"]
                )
            app_vcore_usage_plot = app_vcore_usage_df.set_index("Date")[i].plot(label=i)
            app_vcore_usage_df = app_vcore_usage_df.drop([i], axis=1)
        app_vcore_usage_plot.legend()
        app_vcore_usage_plot.set_ylabel("Application Vcores")
        plt.title("Vcore Breakdown By Application Type")
        plt.savefig("app_vcore_usage_plot.png")
        self.pdf.image(
            "app_vcore_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("app_vcore_usage_plot.png"):
            os.remove("app_vcore_usage_plot.png")

    def yarn_app_memory_usage(self, app_memory_df, app_memory_usage_df):
        """Add yarn memory usage graph in PDF.

        Args:
            app_memory_df (DataFrame): Memory breakdown by application
            app_memory_usage_df (DataFrame): Memory usage over time
        """

        plt.figure()
        for i in app_memory_df["Application Type"].unique():
            app_memory_df_temp = pd.DataFrame(None)
            app_memory_df_temp = app_memory_df[app_memory_df["Application Type"] == i]
            app_memory_usage_df[i] = 0
            for index, row in app_memory_df_temp.iterrows():
                val = (row["Launch Time"], 0)
                if val not in app_memory_usage_df["Date"]:
                    app_memory_usage_df.loc[len(app_memory_usage_df)] = val
                val = (row["Finished Time"], 0)
                if val not in app_memory_usage_df["Date"]:
                    app_memory_usage_df.loc[len(app_memory_usage_df)] = val
                app_memory_usage_df.loc[
                    (app_memory_usage_df["Date"] >= row["Launch Time"])
                    & (app_memory_usage_df["Date"] < row["Finished Time"]),
                    i,
                ] = (
                    app_memory_usage_df.loc[
                        (app_memory_usage_df["Date"] >= row["Launch Time"])
                        & (app_memory_usage_df["Date"] < row["Finished Time"])
                    ][i]
                    + row["Memory"]
                )
            app_memory_usage_plot = app_memory_usage_df.set_index("Date")[i].plot(
                label=i
            )
            app_memory_usage_df = app_memory_usage_df.drop([i], axis=1)
        app_memory_usage_plot.legend()
        app_memory_usage_plot.set_ylabel("Application Memory")
        plt.title("Memory Breakdown By Application Type")
        plt.savefig("app_memory_usage_plot.png")
        self.pdf.image(
            "app_memory_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("app_memory_usage_plot.png"):
            os.remove("app_memory_usage_plot.png")

    def yarn_job_launch_frequency(self, job_launch_df):
        """Add details about job launch frequency of yarn application in PDF.

        Args:
            job_launch_df (DataFrame): Job launch frequency of applications.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Job Launch Frequency:", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(100, 5, "Application Name", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Application Type", 1, 0, "C", True)
        self.pdf.cell(50, 5, "Count", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(job_launch_df)):
            self.pdf.cell(
                100, 5, "{}".format(job_launch_df["Name"].iloc[pos]), 1, 0, "C", True,
            )
            self.pdf.cell(
                50,
                5,
                "{}".format(job_launch_df["ApplicationType"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                50, 5, "{}".format(job_launch_df["Count"].iloc[pos]), 1, 1, "C", True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)

    def yarn_bursty_app_time(self, bursty_app_time_df):
        """Add yarn bursty application details in PDF.

        Args:
            bursty_app_time_df (DataFrame): Time taken by bursty application.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Bursty Applications - Elapsed Time", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(110, 5, "Application Name", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Min Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Mean Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Max Time", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(bursty_app_time_df)):
            self.pdf.cell(
                110,
                5,
                "{}".format(bursty_app_time_df["Application Name"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_time_df["Min"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_time_df["Mean"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_time_df["Max"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)
        plt.figure()
        bursty_app_time_df = bursty_app_time_df.set_index("Application Name")
        bursty_app_time_plot = bursty_app_time_df.plot.barh(stacked=True).legend(
            loc="upper center", ncol=3
        )
        plt.title("Bursty Applications - Elapsed Time")
        plt.xlabel("Time(secs)")
        plt.ylabel("Applications")
        plt.tight_layout()
        plt.savefig("bursty_app_time_plot.png")
        self.pdf.image(
            "bursty_app_time_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("bursty_app_time_plot.png"):
            os.remove("bursty_app_time_plot.png")

    def yarn_bursty_app_vcore(self, bursty_app_vcore_df):
        """Add yarn bursty application vcore graph in PDF.

        Args:
            bursty_app_vcore_df (DataFrame): Vcores taken by bursty application.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Bursty Applications - Vcore Seconds", 0, ln=1)
        self.pdf.set_font("Arial", "B", 11)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(110, 5, "Application Name", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Min Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Mean Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Max Time", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(bursty_app_vcore_df)):
            self.pdf.cell(
                110,
                5,
                "{}".format(bursty_app_vcore_df["Application Name"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_vcore_df["Min"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_vcore_df["Mean"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_vcore_df["Max"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)
        plt.figure()
        bursty_app_vcore_df = bursty_app_vcore_df.set_index("Application Name")
        bursty_app_vcore_plot = bursty_app_vcore_df.plot.barh(stacked=True).legend(
            loc="upper center", ncol=3
        )
        plt.title("Bursty Applications - Vcore Seconds")
        plt.xlabel("Time(secs)")
        plt.ylabel("Applications")
        plt.tight_layout()
        plt.savefig("bursty_app_vcore_plot.png")
        self.pdf.image(
            "bursty_app_vcore_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("bursty_app_vcore_plot.png"):
            os.remove("bursty_app_vcore_plot.png")

    def yar_bursty_app_memory(self, bursty_app_mem_df):
        """Add yarn bursty application memory graph in PDF.

        Args:
            bursty_app_time_df (DataFrame): Time taken by bursty application.
            bursty_app_vcore_df (DataFrame): Vcores taken by bursty application.
            bursty_app_mem_df (DataFrame): Memory taken by bursty application.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "Bursty Applications - Memory Seconds", 0, ln=1)
        self.pdf.set_font("Arial", "B", 12)
        self.pdf.set_fill_color(r=66, g=133, b=244)
        self.pdf.set_text_color(r=255, g=255, b=255)
        self.pdf.cell(110, 5, "Application Name", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Min Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Mean Time", 1, 0, "C", True)
        self.pdf.cell(30, 5, "Max Time", 1, 1, "C", True)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.set_fill_color(r=244, g=244, b=244)
        self.pdf.set_font("Arial", "", 12)
        for pos in range(0, len(bursty_app_mem_df)):
            self.pdf.cell(
                110,
                5,
                "{}".format(bursty_app_mem_df["Application Name"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_mem_df["Min"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_mem_df["Mean"].iloc[pos]),
                1,
                0,
                "C",
                True,
            )
            self.pdf.cell(
                30,
                5,
                "{: .0f} sec".format(bursty_app_mem_df["Max"].iloc[pos]),
                1,
                1,
                "C",
                True,
            )
        self.pdf.cell(230, 5, "", 0, ln=1)
        plt.figure()
        bursty_app_mem_df = bursty_app_mem_df.set_index("Application Name")
        bursty_app_mem_plot = bursty_app_mem_df.plot.barh(stacked=True).legend(
            loc="upper center", ncol=3
        )
        plt.title("Bursty Applications - Memory Seconds")
        plt.xlabel("Memory Seconds")
        plt.ylabel("Applications")
        plt.tight_layout()
        plt.savefig("bursty_app_mem_plot.png")
        self.pdf.image(
            "bursty_app_mem_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("bursty_app_mem_plot.png"):
            os.remove("bursty_app_mem_plot.png")

    def yarn_failed_app(self, yarn_failed_app):
        """Add failed or killed yarn application in PDF.

        Args:
            yarn_failed_app (DataFrame): RCA of failed or killed application.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Run time of Failed/Killed Applications: {: .2f} seconds".format(
                yarn_failed_app["ElapsedTime"].sum()
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Vcores Seconds Used by Failed/Killed Applications: {: .2f} seconds".format(
                yarn_failed_app["MemorySeconds"].sum()
            ),
            0,
            1,
        )
        self.pdf.cell(
            230,
            8,
            "Memory Seconds Used Failed/Killed Applications: {: .2f} seconds".format(
                yarn_failed_app["VcoreSeconds"].sum()
            ),
            0,
            1,
        )
        if yarn_failed_app.size != 0:
            yarn_failed_app = yarn_failed_app.head(10)
            self.pdf.set_font("Arial", "", 12)
            self.pdf.cell(230, 3, "", 0, ln=1)
            self.pdf.cell(
                230, 8, "Top long running failed application diagnostics : ", 0, ln=1
            )
            self.pdf.set_font("Arial", "B", 12)
            self.pdf.set_fill_color(r=66, g=133, b=244)
            self.pdf.set_text_color(r=255, g=255, b=255)
            self.pdf.cell(40, 5, "App Id", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Final Status", 1, 0, "C", True)
            self.pdf.cell(30, 5, "Elapsed Time", 1, 0, "C", True)
            self.pdf.cell(130, 5, "Diagnostics", 1, 1, "C", True)
            self.pdf.set_text_color(r=1, g=1, b=1)
            self.pdf.set_fill_color(r=244, g=244, b=244)
            self.pdf.set_font("Arial", "", 12)
            for pos in range(0, len(yarn_failed_app)):
                x = self.pdf.get_x()
                y = self.pdf.get_y()
                diag = yarn_failed_app["Diagnostics"].iloc[pos][:300]
                line_width = 0
                line_width = max(
                    line_width,
                    self.pdf.get_string_width(
                        yarn_failed_app["ApplicationId"].iloc[pos]
                    ),
                )
                cell_y = line_width / 39.0
                line_width = max(
                    line_width,
                    self.pdf.get_string_width(yarn_failed_app["FinalStatus"].iloc[pos]),
                )
                cell_y = max(cell_y, line_width / 29.0)
                line_width = max(
                    line_width,
                    self.pdf.get_string_width(
                        str(yarn_failed_app["ElapsedTime"].iloc[pos])
                    ),
                )
                cell_y = max(cell_y, line_width / 29.0)
                line_width = max(line_width, self.pdf.get_string_width(diag))
                cell_y = max(cell_y, line_width / 129.0)
                cell_y = math.ceil(cell_y)
                cell_y = max(cell_y, 1)
                cell_y = cell_y * 5
                line_width = self.pdf.get_string_width(
                    yarn_failed_app["ApplicationId"].iloc[pos]
                )
                y_pos = line_width / 39.0
                y_pos = math.ceil(y_pos)
                y_pos = max(y_pos, 1)
                y_pos = cell_y / y_pos
                self.pdf.multi_cell(
                    40,
                    y_pos,
                    "{}".format(yarn_failed_app["ApplicationId"].iloc[pos]),
                    1,
                    "C",
                    fill=True,
                )
                self.pdf.set_xy(x + 40, y)
                line_width = self.pdf.get_string_width(
                    yarn_failed_app["FinalStatus"].iloc[pos]
                )
                y_pos = line_width / 29.0
                y_pos = math.ceil(y_pos)
                y_pos = max(y_pos, 1)
                y_pos = cell_y / y_pos
                self.pdf.multi_cell(
                    30,
                    y_pos,
                    "{}".format(yarn_failed_app["FinalStatus"].iloc[pos]),
                    1,
                    "C",
                    fill=True,
                )
                self.pdf.set_xy(x + 70, y)
                line_width = self.pdf.get_string_width(
                    str(yarn_failed_app["ElapsedTime"].iloc[pos])
                )
                y_pos = line_width / 29.0
                y_pos = math.ceil(y_pos)
                y_pos = max(y_pos, 1)
                y_pos = cell_y / y_pos
                self.pdf.multi_cell(
                    30,
                    y_pos,
                    "{}".format(yarn_failed_app["ElapsedTime"].iloc[pos]),
                    1,
                    "C",
                    fill=True,
                )
                self.pdf.set_xy(x + 100, y)
                line_width = self.pdf.get_string_width(diag)
                y_pos = line_width / 129.0
                y_pos = math.ceil(y_pos)
                y_pos = max(y_pos, 1)
                y_pos = cell_y / y_pos
                self.pdf.multi_cell(130, y_pos, "{}".format(diag), 1, "C", fill=True)
        self.pdf.cell(230, 5, "", 0, ln=1)

    def yarn_queue(self, yarn_queues_list):
        """Add yarn queue details in PDF.

        Args:
            yarn_queues_list (list): Yarn queue details
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)

        if yarn_queues_list["type"] == "capacityScheduler":

            def yarn_queue(yarn_queues_list, count):
                for queue in yarn_queues_list:
                    if "queues" in queue:
                        self.pdf.cell(10 * count, 8, "", 0, 0)
                        self.pdf.cell(
                            30,
                            8,
                            "|-- {} - (Absolute Capacity - {}, Max Capacity - {})".format(
                                queue["queueName"],
                                queue["absoluteCapacity"],
                                queue["absoluteMaxCapacity"],
                            ),
                            0,
                            ln=1,
                        )
                        yarn_queue(queue["queues"]["queue"], count + 1)
                    else:
                        self.pdf.cell(10 * count, 8, "", 0, 0)
                        self.pdf.cell(
                            30,
                            8,
                            "|-- {} - (Absolute Capacity - {}, Max Capacity - {})".format(
                                queue["queueName"],
                                queue["absoluteCapacity"],
                                queue["absoluteMaxCapacity"],
                            ),
                            0,
                            ln=1,
                        )

            self.pdf.cell(230, 8, "Scheduler Type: Capacity Scheduler", 0, ln=1)
            self.pdf.cell(230, 8, "Queue Structure : ", 0, ln=1)
            self.pdf.cell(
                230,
                8,
                "{} - (Absolute Capacity - {}, Max Capacity - {})".format(
                    yarn_queues_list["queueName"],
                    yarn_queues_list["capacity"],
                    yarn_queues_list["maxCapacity"],
                ),
                0,
                ln=1,
            )
            if "queues" in yarn_queues_list:
                yarn_queue(yarn_queues_list["queues"]["queue"], 1)
        elif yarn_queues_list["type"] == "fifoScheduler":
            self.pdf.cell(230, 8, "Scheduler Type: FIFO Scheduler", 0, ln=1)
            self.pdf.cell(230, 8, "Queue Structure : ", 0, ln=1)
            self.pdf.cell(
                230,
                8,
                "- (Capacity - {}, Used Capacity - {})".format(
                    yarn_queues_list["capacity"], yarn_queues_list["usedCapacity"],
                ),
                0,
                ln=1,
            )
        elif yarn_queues_list["type"] == "fairScheduler":

            def yarn_queue(yarn_queues_list, count):
                for queue in yarn_queues_list:
                    if "childQueues" in queue:
                        self.pdf.cell(10 * count, 8, "", 0, 0)
                        self.pdf.cell(
                            50,
                            8,
                            "|-- {} - (Min Resources - (Memory: {}, VCores: {}), Max Resources - Memory: {}, VCores: {})".format(
                                queue["queueName"],
                                queue["minResources"]["memory"],
                                queue["minResources"]["vCores"],
                                queue["maxResources"]["memory"],
                                queue["maxResources"]["vCores"],
                            ),
                            0,
                            ln=1,
                        )
                        yarn_queue(queue["childQueues"]["queue"], count + 1)
                    else:
                        self.pdf.cell(10 * count, 8, "", 0, 0)
                        self.pdf.cell(
                            50,
                            8,
                            "|-- {} - (Min Resources - (Memory: {}, VCores: {}), Max Resources - Memory: {}, VCores: {})".format(
                                queue["queueName"],
                                queue["minResources"]["memory"],
                                queue["minResources"]["vCores"],
                                queue["maxResources"]["memory"],
                                queue["maxResources"]["vCores"],
                            ),
                            0,
                            ln=1,
                        )

            self.pdf.cell(230, 8, "Scheduler Type: Fair Scheduler", 0, ln=1)
            self.pdf.cell(230, 8, "Queue Structure : ", 0, ln=1)
            self.pdf.cell(
                230,
                8,
                "|-- {} - (Min Resources - (Memory: {}, VCores: {}), Max Resources - Memory: {}, VCores: {})".format(
                    yarn_queues_list["rootQueue"]["queueName"],
                    yarn_queues_list["rootQueue"]["minResources"]["memory"],
                    yarn_queues_list["rootQueue"]["minResources"]["vCores"],
                    yarn_queues_list["rootQueue"]["maxResources"]["memory"],
                    yarn_queues_list["rootQueue"]["maxResources"]["vCores"],
                ),
                0,
                ln=1,
            )
            if "childQueues" in yarn_queues_list["rootQueue"]:
                yarn_queue(yarn_queues_list["rootQueue"]["childQueues"]["queue"], 1)
        self.pdf.cell(230, 5, "", 0, ln=1)

    def yarn_queue_app(self, queue_app_count_df, queue_elapsed_time_df):
        """Add yarn queued application count pie chart in PDF.

        Args:
            queue_app_count_df (DataFrame): Queued application count
            queue_elapsed_time_df (DataFrame): Queued application elapsed time
        """

        def make_autopct(values):
            def my_autopct(pct):
                total = sum(values)
                val = int(round(pct * total / 100.0))
                return "{p:.2f}%  ({v:d})".format(p=pct, v=val)

            return my_autopct

        plt.figure()
        x = self.pdf.get_x()
        y = self.pdf.get_y()
        queue_app_count_plot = queue_app_count_df.plot.pie(
            y="Application Count",
            figsize=(6, 6),
            autopct=make_autopct(queue_app_count_df["Application Count"]),
            title="Queue Application Count (Weekly)",
        )
        plt.savefig("queue_app_count_plot.png")
        self.pdf.image(
            "queue_app_count_plot.png", x=15, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("queue_app_count_plot.png"):
            os.remove("queue_app_count_plot.png")
        self.pdf.set_xy(x, y)
        plt.figure()
        queue_elapsed_time_plot = queue_elapsed_time_df.plot.pie(
            y="Elapsed Time",
            figsize=(6, 6),
            autopct="%.1f%%",
            title="Queue Elapsed Time (Weekly)",
        )
        plt.savefig("queue_elapsed_time_plot.png")
        self.pdf.image(
            "queue_elapsed_time_plot.png", x=130, y=None, w=95, h=95, type="", link=""
        )
        if os.path.exists("queue_elapsed_time_plot.png"):
            os.remove("queue_elapsed_time_plot.png")

    def yarn_queue_vcore(self, queue_vcore_df, queue_vcore_usage_df):
        """Add yarn queued application vcore graph in PDF.

        Args:
            queue_vcore_df (DataFrame): Queue vcores details
            queue_vcore_usage_df (DataFrame): Queue vcores usage over time
        """

        plt.figure()
        for i in queue_vcore_df["Queue"].unique():
            queue_vcore_df_temp = pd.DataFrame(None)
            queue_vcore_df_temp = queue_vcore_df[queue_vcore_df["Queue"] == i]
            queue_vcore_usage_df[i] = 0
            for index, row in queue_vcore_df_temp.iterrows():
                val = (row["Launch Time"], 0)
                if val not in queue_vcore_usage_df["Date"]:
                    queue_vcore_usage_df.loc[len(queue_vcore_usage_df)] = val
                val = (row["Finished Time"], 0)
                if val not in queue_vcore_usage_df["Date"]:
                    queue_vcore_usage_df.loc[len(queue_vcore_usage_df)] = val
                queue_vcore_usage_df.loc[
                    (queue_vcore_usage_df["Date"] >= row["Launch Time"])
                    & (queue_vcore_usage_df["Date"] < row["Finished Time"]),
                    i,
                ] = (
                    queue_vcore_usage_df.loc[
                        (queue_vcore_usage_df["Date"] >= row["Launch Time"])
                        & (queue_vcore_usage_df["Date"] < row["Finished Time"])
                    ][i]
                    + row["Vcore"]
                )
            queue_vcore_usage_plot = queue_vcore_usage_df.set_index("Date")[i].plot(
                label=i
            )
            queue_vcore_usage_df = queue_vcore_usage_df.drop([i], axis=1)
        queue_vcore_usage_plot.legend()
        queue_vcore_usage_plot.set_ylabel("Application Vcores")
        plt.title("Vcore Breakdown By Queue")
        plt.savefig("queue_vcore_usage_plot.png")
        self.pdf.image(
            "queue_vcore_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("queue_vcore_usage_plot.png"):
            os.remove("queue_vcore_usage_plot.png")

    def yarn_queue_memory(self, queue_memory_df, queue_memory_usage_df):
        """Add yarn queued application memory graph in PDF.

        Args:
            queue_memory_df (DataFrame): Queue memory details
            queue_memory_usage_df (DataFrame): Queue memory usage over time
        """

        plt.figure()
        for i in queue_memory_df["Queue"].unique():
            queue_memory_df_temp = pd.DataFrame(None)
            queue_memory_df_temp = queue_memory_df[queue_memory_df["Queue"] == i]
            queue_memory_usage_df[i] = 0
            for index, row in queue_memory_df_temp.iterrows():
                val = (row["Launch Time"], 0)
                if val not in queue_memory_usage_df["Date"]:
                    queue_memory_usage_df.loc[len(queue_memory_usage_df)] = val
                val = (row["Finished Time"], 0)
                if val not in queue_memory_usage_df["Date"]:
                    queue_memory_usage_df.loc[len(queue_memory_usage_df)] = val
                queue_memory_usage_df.loc[
                    (queue_memory_usage_df["Date"] >= row["Launch Time"])
                    & (queue_memory_usage_df["Date"] < row["Finished Time"]),
                    i,
                ] = (
                    queue_memory_usage_df.loc[
                        (queue_memory_usage_df["Date"] >= row["Launch Time"])
                        & (queue_memory_usage_df["Date"] < row["Finished Time"])
                    ][i]
                    + row["Memory"]
                )
            queue_memory_usage_plot = queue_memory_usage_df.set_index("Date")[i].plot(
                label=i
            )
            queue_memory_usage_df = queue_memory_usage_df.drop([i], axis=1)
        queue_memory_usage_plot.legend()
        queue_memory_usage_plot.set_ylabel("Application Memory")
        plt.title("Memory Breakdown By Queue")
        plt.savefig("queue_memory_usage_plot.png")
        self.pdf.image(
            "queue_memory_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("queue_memory_usage_plot.png"):
            os.remove("queue_memory_usage_plot.png")

    def yarn_queue_pending_app(self, app_queue_df, app_queue_usage_df):
        """Add yarn pending queued application graph in PDF.

        Args:
            app_queue_df (DataFrame): Pending queued application list
            app_queue_usage_df (DataFrame): Pending queued application usage over time.
        """

        plt.figure()
        for i in app_queue_df["Queue"].unique():
            app_queue_df_temp = pd.DataFrame(None)
            app_queue_df_temp = app_queue_df[
                (app_queue_df["Queue"] == i)
                & (app_queue_df["Wait Time"] > timedelta(minutes=5))
            ]
            app_queue_usage_df[i] = 0
            for index, row in app_queue_df_temp.iterrows():
                val = (row["Start Time"], 0)
                if val not in app_queue_usage_df["Date"]:
                    app_queue_usage_df.loc[len(app_queue_usage_df)] = val
                val = (row["Launch Time"], 0)
                if val not in app_queue_usage_df["Date"]:
                    app_queue_usage_df.loc[len(app_queue_usage_df)] = val
                app_queue_usage_df.loc[
                    (app_queue_usage_df["Date"] >= row["Start Time"])
                    & (app_queue_usage_df["Date"] < row["Launch Time"]),
                    i,
                ] = (
                    app_queue_usage_df.loc[
                        (app_queue_usage_df["Date"] >= row["Start Time"])
                        & (app_queue_usage_df["Date"] < row["Launch Time"])
                    ][i]
                    + 1
                )
            app_queue_usage_plot = app_queue_usage_df.set_index("Date")[i].plot(label=i)
            app_queue_usage_df = app_queue_usage_df.drop([i], axis=1)
        app_queue_usage_plot.legend()
        app_queue_usage_plot.set_ylabel("Application Count")
        plt.title("Application Pending by Queue")
        plt.savefig("app_queue_usage_plot.png")
        self.pdf.image(
            "app_queue_usage_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("app_queue_usage_plot.png"):
            os.remove("app_queue_usage_plot.png")

    def yarn_pending_app(self, yarn_pending_apps_df):
        """Add yarn pending application count graph in PDF.

        Args:
            yarn_pending_apps_df (DataFrame): Pending application count over time.
        """

        plt.figure()
        yarn_pending_apps_plot = yarn_pending_apps_df["Max"].plot(
            color="steelblue", label="Pending Applications"
        )
        yarn_pending_apps_plot.legend()
        yarn_pending_apps_plot.set_ylabel("Application Count")
        plt.title("Total Pending Applications Across YARN Pools")
        plt.savefig("yarn_pending_apps_plot.png")
        self.pdf.image(
            "yarn_pending_apps_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_pending_apps_plot.png"):
            os.remove("yarn_pending_apps_plot.png")

    def yarn_pending_vcore(self, yarn_pending_vcore_df):
        """Add yarn pending application vcore graph in PDF.

        Args:
            yarn_pending_vcore_df (DataFrame): Pending vcores over time.
        """

        plt.figure()
        yarn_pending_vcore_plot = yarn_pending_vcore_df["Mean"].plot(
            color="steelblue", label="Pending Vcores"
        )
        yarn_pending_vcore_plot.legend()
        yarn_pending_vcore_plot.set_ylabel("Vcores")
        plt.title("Total Pending VCores Across YARN Pools")
        plt.savefig("yarn_pending_vcore_plot.png")
        self.pdf.image(
            "yarn_pending_vcore_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_pending_vcore_plot.png"):
            os.remove("yarn_pending_vcore_plot.png")

    def yarn_pending_memory(self, yarn_pending_memory_df):
        """Add yarn pending application memory graph in PDF.

        Args:
            yarn_pending_memory_df (DataFrame): Pending memory over time.
        """

        plt.figure()
        yarn_pending_memory_plot = yarn_pending_memory_df["Mean"].plot(
            color="steelblue", label="Pending Memory"
        )
        yarn_pending_memory_plot.legend()
        yarn_pending_memory_plot.set_ylabel("Memory (MB)")
        plt.title("Total Pending Memory Across YARN Pools")
        plt.savefig("yarn_pending_memory_plot.png")
        self.pdf.image(
            "yarn_pending_memory_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_pending_memory_plot.png"):
            os.remove("yarn_pending_memory_plot.png")

    def yarn_running_app(self, yarn_running_apps_df):
        """Add yarn running application count graph in PDF.

        Args:
            yarn_running_apps_df (DataFrame): Running application count over time.
        """

        plt.figure()
        yarn_running_apps_plot = yarn_running_apps_df["Max"].plot(
            color="steelblue", label="Running Applications"
        )
        yarn_running_apps_plot.legend()
        yarn_running_apps_plot.set_ylabel("Application Count")
        plt.title("Total Running Applications Across YARN Pools")
        plt.savefig("yarn_running_apps_plot.png")
        self.pdf.image(
            "yarn_running_apps_plot.png", x=0, y=None, w=250, h=85, type="", link=""
        )
        if os.path.exists("yarn_running_apps_plot.png"):
            os.remove("yarn_running_apps_plot.png")

    def nodes_serving_hbase(self, NumNodesServing):
        """Add number of nodes serving Hbase in PDF.

        Args:
            NumNodesServing (int) : number of nodes serving Hbase
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Number of Nodes Serving HBase: {}".format(NumNodesServing), 0, 1,
        )

    def hbase_storage(self, base_size, disk_space_consumed):
        """Add HBase storage details in PDF.

        Args:
            base_size (float) : Base size of HBase
            disk_space_consumed (float) : Disk size consumed by HBase
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Base Size of Data: {: .2f} GB".format(disk_space_consumed), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Disk Space Consumed: {: .2f} GB".format(base_size), 0, 1,
        )

    def hbase_replication(self, replication):
        """Add HBase replication factor in PDF.

        Args:
            replication (str): HBase replication factor.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Is Hbase replicated to other datacenter: {}".format(replication),
            0,
            1,
        )

    def hbase_indexing(self, indexing):
        """Add HBase secondary indexing details in PDF.

        Args:
            indexing (str): HBase secondary index value.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Do you use Secondary Index on Hbase: {}".format(indexing), 0, 1,
        )

    def hBase_on_hive(self, hbasehive_var):
        """Add HBase-hive information in PDF.

        Args:
            hbasehive_var (str): HBase-hive information.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Does Hbase uses Query Engine: {}".format(hbasehive_var), 0, 1,
        )

    def phoenix_in_hbase(self, phoenixHbase):
        """Add HBase phoenix information in PDF.

        Args:
            phoenixHbase (str): HBase phoenix information.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Does Hbase use Apache Phoenix: {}".format(phoenixHbase), 0, 1,
        )

    def coprocessor_in_hbase(self, coprocessorHbase):
        """Add HBase coprocessor information in PDF.

        Args:
            coprocessorHbase (str): HBase coprocessor information
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Does Hbase use Triggers and Coprocessors: {}".format(coprocessorHbase),
            0,
            1,
        )

    def spark_version(self, spark_version):
        """Add Spark version details in PDF.

        Args:
            spark_version (str): Spark version
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Spark Version: {}".format(spark_version), 0, 1,
        )

    def spark_languages(self, languages):
        """Add list of languages used by spark programs in PDF.

        Args:
            language_list (str): List of languages separated by comma.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Programming Languages Used By Spark: {}".format(languages), 0, 1,
        )

    def spark_dynamic_allocation_and_resource_manager(
        self, dynamic_allocation, spark_resource_manager
    ):
        """Add spark config details in PDF.

        Args:
            dynamic_allocation (str): Dynamic Allocation value.
            spark_resource_manager (str): Spark resource manager value.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Spark Resource Manager: {}".format(spark_resource_manager), 0, 1,
        )
        self.pdf.cell(
            230, 8, "Dynamic Allocation: {}".format(dynamic_allocation), 0, 1,
        )

    def spark_components_used(
        self, rdd_flag, dataset_flag, sql_flag, df_flag, mllib_flag, stream_flag
    ):
        """Add components of spark used in programming in PDF.

        Args:
            rdd_flag (bool) : Use of Spark RDD
            dataset_flag (bool) : Use of Spark Dataset
            sql_flag (bool) : Use of Spark SQL
            df_flag (bool) : Use of Spark Dataframe
            mllib_flag (bool) : Use of Spark ML
            stream_flag (bool) : Use of Spark Streaming
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=66, g=133, b=244)
        self.pdf.cell(230, 8, "Spark Components:", 0, ln=1)
        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        if rdd_flag == 1:
            self.pdf.cell(
                230, 8, "Spark RDD API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark RDD API not found", 0, 1,
            )
        if dataset_flag == 1:
            self.pdf.cell(
                230, 8, "Spark SQL Dataset API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark SQL Dataset API not found", 0, 1,
            )
        if sql_flag == 1:
            self.pdf.cell(
                230, 8, "Spark SQL API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark SQL API not found", 0, 1,
            )
        if df_flag == 1:
            self.pdf.cell(
                230, 8, "Spark Dataframe API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark Dataframe API not found", 0, 1,
            )
        if stream_flag == 1:
            self.pdf.cell(
                230, 8, "Spark Streaming API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark Streaming API not found", 0, 1,
            )
        if mllib_flag == 1:
            self.pdf.cell(
                230, 8, "Spark ML Lib API found", 0, 1,
            )
        else:
            self.pdf.cell(
                230, 8, "Spark ML Lib API not found", 0, 1,
            )

    def retention_period(self, retention_period):
        """Add retention period of kafka in PDF.

        Args:
            retention_period (str): Kafka retention period
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Kafka Retention Period: {} hours".format(retention_period), 0, 1,
        )

    def num_topics(self, num_topics):
        """Add num of topics in kafka in PDF.

        Args:
            num_topics (int): Number of topics in kafka.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Number of Topics in Kafka: {}".format(num_topics), 0, 1,
        )

    def msg_size(self, sum_size):
        """Add volume of message in kafka in bytes in PDF.

        Args:
            sum_size (int): Message size of Kafka
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Total Size of Messages in Kafka: {: .2f} KB".format(sum_size),
            0,
            1,
        )

    def msg_count(self, sum_count):
        """Add count of messages in kafka topics in PDF.

        Args:
            sum_count (int): Number of messages in Kafka
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Total Number of Messages in Kafka: {}".format(sum_count), 0, 1,
        )

    def cluster_size_and_brokerSize(self, total_size, brokersize):
        """Add per cluster storage and kafka cluster storage in kafka in PDF.

        Args:
            total_size (float): Total size of kafka cluster
            brokersize (DataFrame): Size for each broker.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230, 8, "Total Storage of Kafka Cluster: {} KB".format(total_size), 0, 1,
        )
        j = 0
        for i in brokersize["size"]:
            self.pdf.cell(
                230, 5, "Size of broker {}  is  : {} KB".format(j, i), 0, ln=1
            )
            j = j + 1

    def ha_strategy(self, HA_Strategy):
        """Check High Availability of Kafka Cluster.

        Args:
           HA_Strategy (str): returns whether High availability in kafka is enabled or not
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Does High Availabiity enabled in Kafka Cluster: {}".format(HA_Strategy),
            0,
            1,
        )

    def services_used_for_ingestion(self, services):
        """Add services used for ingestion in PDF.

        Args:
            services (str): List of services.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(
            230,
            8,
            "Cloudera Services Used for Data Ingestion: {}".format(services),
            0,
            1,
        )

    def backup_and_recovery(self, br):
        """Add backup and disaster recovery information in PDF.

        Args:
            br (str): backup and disaster recovery information.
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(br), 0, ln=1)

    def impala(self, impala):
        """Add Impala information in PDF.

        Args:
            impala (str): Impala service value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(impala), 0, ln=1)

    def sentry(self, sentry):
        """Add Sentry information in PDF.

        Args:
            impala (str): Sentry service value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(sentry), 0, ln=1)

    def kudu(self, kudu):
        """Add Kudu information in PDF.

        Args:
            impala (str): Kudu service value
        """

        self.pdf.set_font("Arial", "", 12)
        self.pdf.set_text_color(r=1, g=1, b=1)
        self.pdf.cell(230, 8, "{}".format(kudu), 0, ln=1)
