# ------------------------------------------------------------------------------
# pdfgeneraor module contains the logic which will generate the pdf report with
# the metrics related to the Hardware and Operating system, Framework and
# software details, Security, Application, Data, Network and traffic.
#
# pdfgenerator will take inputs from the other modules as an argument and based
# on the input it will generate tabular and labelled reports.
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *
from HardwareOSAPI import *
from FrameworkDetailsAPI import *
from DataAPI import *
from SecurityAPI import *
from ApplicationAPI import *
from PdfFunctions import *
from NetworkMonitoringAPI import *


class PdfGenerator:
    """This Class has functions for PDF generation based on different 
    Cloudera versions.

    Args:
        inputs (dict): Contains user input attributes
    """

    def __init__(self, inputs):
        """Initialize inputs"""

        self.inputs = inputs
        self.version = inputs["version"]
        self.cloudera_manager_host_ip = inputs["cloudera_manager_host_ip"]
        self.cloudera_manager_username = inputs["cloudera_manager_username"]
        self.cloudera_manager_password = inputs["cloudera_manager_password"]
        self.cluster_name = inputs["cluster_name"]
        self.logger = inputs["logger"]
        self.config_path = inputs["config_path"]
        self.ssl = inputs["ssl"]
        self.hive_username = inputs["hive_username"]
        self.hive_password = inputs["hive_password"]
        self.start_date = inputs["start_date"]
        self.end_date = inputs["end_date"]

    def run(self):
        """Generate PDF for CDH-5, CDH-6 and CDP-7"""

        pdf = FPDF(format=(250, 350))
        obj1 = HardwareOSAPI(self.inputs)
        obj2 = DataAPI(self.inputs)
        obj3 = FrameworkDetailsAPI(self.inputs)
        obj4 = SecurityAPI(self.inputs)
        obj5 = NetworkMonitoringAPI(self.inputs)
        obj_app = ApplicationAPI(self.inputs)
        obj_pdf = PdfFunctions(self.inputs, pdf)
        yarn_rm = self.inputs["yarn_rm"]
        yarn_port = self.inputs["yarn_port"]
        cluster_name = self.cluster_name

        pdf.add_page()
        pdf.set_font("Arial", "B", 26)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 12, "Hadoop Assessment Report", 0, ln=1, align="C")
        pdf.set_font("Arial", "B", 12)
        pdf.set_fill_color(r=66, g=133, b=244)
        pdf.set_text_color(r=255, g=255, b=255)
        pdf.cell(0, 10, "", 0, 1)
        pdf.cell(60, 16, "Report Date Range", 1, 0, "C", True)
        pdf.cell(40, 8, "Start Date", 1, 0, "C", True)
        pdf.cell(40, 8, "End Date", 1, 1, "C", True)
        pdf.cell(60, 8, "", 0, 0)
        pdf.set_text_color(r=1, g=1, b=1)
        pdf.set_fill_color(r=244, g=244, b=244)
        pdf.set_font("Arial", "", 12)
        pdf.cell(
            40,
            8,
            datetime.strptime(self.start_date, "%Y-%m-%dT%H:%M:%S").strftime(
                "%d-%b-%Y"
            ),
            1,
            0,
            "C",
            True,
        )
        pdf.cell(
            40,
            8,
            datetime.strptime(self.end_date, "%Y-%m-%dT%H:%M:%S").strftime("%d-%b-%Y"),
            1,
            1,
            "C",
            True,
        )
        pdf.cell(0, 8, "", 0, 1)

        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Key Metrics", 0, ln=1)

        cluster_host_items, clusterHostLen = None, None
        all_host_data = None
        temp = obj1.cluster_host_items(cluster_name)
        if type(temp) != type(None):
            cluster_host_items, clusterHostLen = temp
            all_host_data = []
            for i in cluster_host_items:
                host_data = obj1.host_data(i["hostId"])
                if host_data != None:
                    all_host_data.append(host_data)

        cluster_cpu_usage_df, cluster_cpu_usage_avg = None, None
        temp2 = obj1.cluster_cpu_usage(cluster_name)
        if type(temp2) != type(None):
            cluster_cpu_usage_df, cluster_cpu_usage_avg = temp2

        cluster_memory_usage_df, cluster_memory_usage_avg = None, None
        temp2 = obj1.cluster_memory_usage(cluster_name)
        if type(temp2) != type(None):
            cluster_memory_usage_df, cluster_memory_usage_avg = temp2

        hadoopVersionMajor, hadoopVersionMinor, distribution = None, None, None
        temp = obj3.hadoop_version()
        if type(temp) != type(None):
            hadoopVersionMajor, hadoopVersionMinor, distribution = temp

        mapped_df, total_storage = None, None
        temp = obj2.total_size_configured()
        if type(temp) != type(None):
            mapped_df, total_storage = temp

        hdfs_capacity_df, hdfs_storage_config = None, None
        hdfs_capacity_used_df, hdfs_storage_used = None, None
        temp1 = obj2.get_hdfs_capacity(cluster_name)
        temp2 = obj2.get_hdfs_capacity_used(cluster_name)
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            hdfs_capacity_df, hdfs_storage_config = temp1
            hdfs_capacity_used_df, hdfs_storage_used = temp2

        replication_factor = None
        temp = obj2.replication_factor()
        if type(temp) != type(None):
            replication_factor = temp

        mt_db_host, mt_db_name, mt_db_type, mt_db_port = None, None, None, None
        database_df = None
        size_breakdown_df = None
        table_df = None
        temp = obj2.get_hive_config_items(cluster_name)
        if type(temp) != type(None):
            mt_db_host, mt_db_name, mt_db_type, mt_db_port = temp

            if mt_db_type == "postgresql":
                database_uri = "postgres+psycopg2://{}:{}@{}:{}/{}".format(
                    self.hive_username,
                    self.hive_password,
                    mt_db_host,
                    mt_db_port,
                    mt_db_name,
                )
            if mt_db_type == "mysql":
                database_uri = "mysql+pymysql://{}:{}@{}:{}/{}".format(
                    self.hive_username,
                    self.hive_password,
                    mt_db_host,
                    mt_db_port,
                    mt_db_name,
                )

            temp1 = obj2.get_hive_database_info(database_uri, mt_db_type)
            if type(temp1) != type(None):
                database_df = temp1

            if (type(hdfs_storage_used) != type(None)) and (
                type(database_df) != type(None)
            ):

                temp = obj2.structured_vs_unstructured(hdfs_storage_used, database_df)
                if type(temp) != type(None):
                    size_breakdown_df = temp

            table_df = None
            temp1 = obj2.get_hive_metaStore(database_uri, mt_db_type)
            if type(temp1) != type(None):
                table_df = temp1

        (
            yarn_vcore_allocated_avg,
            yarn_vcore_allocated_df,
            yarn_vcore_allocated_pivot_df,
        ) = (None, None, None)
        temp2 = obj_app.get_yarn_vcore_allocated(cluster_name)
        if type(temp2) != type(None):
            (
                yarn_vcore_allocated_avg,
                yarn_vcore_allocated_df,
                yarn_vcore_allocated_pivot_df,
            ) = temp2

        (
            yarn_memory_allocated_avg,
            yarn_memory_allocated_df,
            yarn_memory_allocated_pivot_df,
        ) = (None, None, None)
        temp1 = obj_app.get_yarn_memory_available(cluster_name)
        temp2 = obj_app.get_yarn_memory_allocated(cluster_name)
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            (
                yarn_memory_allocated_avg,
                yarn_memory_allocated_df,
                yarn_memory_allocated_pivot_df,
            ) = temp2

        list_services_installed_df, new_ref_df = None, None
        temp = obj3.version_mapping(cluster_name)
        if type(temp) != type(None):
            list_services_installed_df, new_ref_df = temp

        base_size, disk_space_consumed = None, None
        temp = obj_app.get_hbase_data_size()
        if type(temp) != type(None):
            base_size, disk_space_consumed = temp

        obj_pdf.summary_table(
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
        )

        print("\n[STATUS][01/18][#.................][06%] Key Metrics added in PDF")

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Cluster Information", 0, ln=1)

        cluster_items = None
        temp = obj1.cluster_items()
        if type(temp) != type(None):
            cluster_items = temp
            obj_pdf.cluster_info(cluster_items)

        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(
            230, 10, "Listing Details for Cluster: {}".format(cluster_name), 0, ln=1
        )

        cluster_host_items, clusterHostLen = None, None
        all_host_data = None
        os_version = obj1.os_version()
        temp = obj1.cluster_host_items(cluster_name)
        if type(temp) != type(None):
            cluster_host_items, clusterHostLen = temp
            all_host_data = []
            for i in cluster_host_items:
                host_data = obj1.host_data(i["hostId"])
                if host_data != None:
                    all_host_data.append(host_data)
            if (len(all_host_data) != 0) and (os_version != None):
                obj_pdf.cluster_host_info(cluster_host_items, all_host_data, os_version)

        cluster_service_item = None
        temp = obj1.cluster_service_item(cluster_name)
        if type(temp) != type(None):
            cluster_service_item = temp
            obj_pdf.cluster_service_info(cluster_service_item)

        print(
            "[STATUS][02/18][##................][11%] Cluster Information added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Cluster Metrics", 0, ln=1)

        cluster_total_cores_df, cluster_cpu_usage_df, cluster_cpu_usage_avg = (
            None,
            None,
            None,
        )
        temp1, temp2 = (
            obj1.cluster_total_cores(cluster_name),
            obj1.cluster_cpu_usage(cluster_name),
        )
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            cluster_total_cores_df = temp1
            cluster_cpu_usage_df, cluster_cpu_usage_avg = temp2
            obj_pdf.cluster_vcore_avg(cluster_cpu_usage_avg)
            obj_pdf.cluster_vcore_plot(cluster_total_cores_df, cluster_cpu_usage_df)

        cluster_total_memory_df, cluster_memory_usage_df, cluster_memory_usage_avg = (
            None,
            None,
            None,
        )
        temp1, temp2 = (
            obj1.cluster_total_memory(cluster_name),
            obj1.cluster_memory_usage(cluster_name),
        )
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            cluster_total_memory_df = temp1
            cluster_memory_usage_df, cluster_memory_usage_avg = temp2
            obj_pdf.cluster_memory_avg(cluster_memory_usage_avg)
            obj_pdf.cluster_memory_plot(
                cluster_total_memory_df, cluster_memory_usage_df
            )

        if type(all_host_data) != type(None):
            edgenode_hostid_list = []
            for i, host in enumerate(all_host_data):
                for role in host["roleRefs"]:
                    if (
                        re.search(r"\bGATEWAY\b", role["roleName"])
                        and "hdfs" in role["serviceName"]
                    ):
                        edgenode_hostid_list.append(host["hostId"])
            if len(edgenode_hostid_list) > 0:
                temp = obj1.memory_usage_edgenode(edgenode_hostid_list)
                if type(temp) != type(None):
                    mean_df = temp
                    obj_pdf.memory_usage_edgenode(mean_df)

        print("[STATUS][03/18][###...............][17%] Cluster Metrics added in PDF")

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Hardware and OS Metrics", 0, ln=1)

        pdf.set_font("Arial", "", 12)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 8, "Types of Servers Details:", 0, ln=1)

        database_server, dns_server, web_server, ntp_server = None, None, None, None
        t1 = obj1.database_server()
        t2 = obj1.dns_server()
        t3 = obj1.web_server()
        t4 = obj1.ntp_server()

        if type(t1) != type(None):
            database_server = t1
            obj_pdf.database_server(database_server)

        if type(t2) != type(None):
            dns_server = t2
            obj_pdf.dns_server(dns_server)

        if type(t3) != type(None):
            web_server = t3
            obj_pdf.web_server(web_server)

        if type(t4) != type(None):
            ntp_server = t4
            obj_pdf.ntp_server(ntp_server)

        pdf.set_font("Arial", "", 12)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 8, "Manufacturer and Processor Details:", 0, ln=1)

        (
            manufacturer_name,
            serial_no,
            family,
            model_name,
            microcode,
            cpu_mhz,
            cpu_family,
        ) = (
            None,
            None,
            None,
            None,
            None,
            None,
            None,
        )
        t1 = obj1.manufacturer_name()
        t2 = obj1.serial_no()
        t3 = obj1.family()
        t4 = obj1.model_name()
        t5 = obj1.microcode()
        t6 = obj1.cpu_mhz()
        t7 = obj1.cpu_family()

        if type(t1) != type(None):
            manufacturer_name = t1
            obj_pdf.manufacturer_name(manufacturer_name)

        if type(t2) != type(None):
            serial_no = t2
            obj_pdf.serial_no(serial_no)

        if type(t3) != type(None):
            family = t3
            obj_pdf.family(family)

        if type(t4) != type(None):
            model_name = t4
            obj_pdf.model_name(model_name)

        if type(t5) != type(None):
            microcode = t5
            obj_pdf.microcode(microcode)

        if type(t6) != type(None):
            cpu_mhz = t6
            obj_pdf.cpu_mhz(cpu_mhz)

        if type(t7) != type(None):
            cpu_family = t7
            obj_pdf.cpu_family(cpu_family)

        nic_details = None
        temp = obj1.network_interface_details()
        if type(temp) != type(None):
            nic_details = temp
            obj_pdf.network_interface_details(nic_details)

        patch_dataframe, os_name = None, None
        temp = obj1.applied_patches()
        if type(temp) != type(None):
            patch_dataframe, os_name = temp
            obj_pdf.applied_patches(patch_dataframe, os_name)

        hadoop_native_df = None
        temp = obj1.list_hadoop_nonhadoop_libs()
        if type(temp) != type(None):
            hadoop_native_df = temp
            obj_pdf.list_hadoop_nonHadoop_libs(hadoop_native_df)

        python_flag, java_flag, scala_flag = None, None, None
        temp = obj1.check_libraries_installed()
        if type(temp) != type(None):
            python_flag, java_flag, scala_flag = temp
            obj_pdf.check_libraries_installed(python_flag, java_flag, scala_flag)

        security_software = None
        temp = obj1.security_software()
        if type(temp) != type(None):
            security_software = temp
            obj_pdf.security_software(security_software)

        gpu_status = None
        temp = obj1.speciality_hardware()
        if type(temp) != type(None):
            gpu_status = temp
            obj_pdf.speciality_hardware(gpu_status)

        print(
            "[STATUS][04/18][####..............][22%] Hardware and OS Metrics added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Frameworks and Software Details", 0, ln=1)

        hadoopVersionMajor, hadoopVersionMinor, distribution = None, None, None
        temp = obj3.hadoop_version()
        if type(temp) != type(None):
            hadoopVersionMajor, hadoopVersionMinor, distribution = temp
            obj_pdf.hadoop_version(hadoopVersionMajor, hadoopVersionMinor, distribution)

        list_services_installed_df, new_ref_df = None, None
        temp = obj3.version_mapping(cluster_name)
        if type(temp) != type(None):
            list_services_installed_df, new_ref_df = temp
            obj_pdf.service_installed(new_ref_df)

        third_party_package = None
        temp = obj3.third_party_software()
        if type(temp) != type(None):
            third_party_package = temp
            pdf.set_font("Arial", "", 12)
            pdf.set_text_color(r=66, g=133, b=244)
            pdf.cell(230, 8, "Third Party Software and Their Version:", 0, ln=1)
            obj_pdf.third_party_software(third_party_package)

        package_version = None
        temp = obj3.version_package()
        if type(temp) != type(None):
            package_version = temp
            pdf.set_font("Arial", "", 12)
            pdf.set_text_color(r=66, g=133, b=244)
            pdf.cell(230, 8, "Details of Services/Software and Their Version:", 0, ln=1)
            obj_pdf.version_package(package_version)

        pdf.set_font("Arial", "", 12)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 8, "Drivers and Connectors:", 0, ln=1)

        df_ngdbc, df_salesforce = None, None
        temp = obj3.salesforce_sapDriver()
        if type(temp) != type(None):
            df_ngdbc, df_salesforce = temp
            obj_pdf.salesforce_sapDriver(df_ngdbc, df_salesforce)

        final_df = None
        temp = obj3.jdbcodbc_driver()
        if type(temp) != type(None):
            final_df = temp
            obj_pdf.jdbcodbc_driver(final_df)

        connectors_present = None
        temp = obj3.installed_connectors()
        if type(temp) != type(None):
            connectors_present = temp
            obj_pdf.installed_connectors(connectors_present)

        print(
            "[STATUS][05/18][#####.............][28%] Framework and software details added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "HDFS Section", 0, ln=1)

        mapped_df, total_storage = None, None
        temp = obj2.total_size_configured()
        if type(temp) != type(None):
            mapped_df, total_storage = temp
            obj_pdf.total_hdfs_size(total_storage)
            obj_pdf.individual_hdfs_size(mapped_df)

        replication_factor = None
        temp = obj2.replication_factor()
        if type(temp) != type(None):
            replication_factor = temp
            obj_pdf.rep_factor(replication_factor)

        trash_flag = None
        temp = obj2.get_trash_status()
        if type(temp) != type(None):
            trash_flag = temp
            obj_pdf.trash_interval(trash_flag)

        value = None
        temp = obj2.check_compression()
        if type(temp) != type(None):
            value = temp
            obj_pdf.check_compression(value)

        hdfs_capacity_df, hdfs_storage_config = None, None
        hdfs_capacity_used_df, hdfs_storage_used = None, None
        temp1 = obj2.get_hdfs_capacity(cluster_name)
        temp2 = obj2.get_hdfs_capacity_used(cluster_name)
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            hdfs_capacity_df, hdfs_storage_config = temp1
            hdfs_capacity_used_df, hdfs_storage_used = temp2
            obj_pdf.available_hdfs_storage(hdfs_storage_config)
            obj_pdf.used_hdfs_storage(hdfs_storage_used)
            obj_pdf.hdfs_storage_plot(hdfs_capacity_df, hdfs_capacity_used_df)

        hdfs_storage_df, hdfs_flag = None, None
        temp = obj2.hdfs_storage()
        if type(temp) != type(None):
            hdfs_storage_df, hdfs_flag = temp
            obj_pdf.hdfs_storage(hdfs_storage_df, hdfs_flag)

        grpby_data, max_value, min_value, avg_value = None, None, None, None
        temp = obj2.cluster_filesize()
        if type(temp) != type(None):
            grpby_data, max_value, min_value, avg_value = temp
            obj_pdf.cluster_file_size(grpby_data, max_value, min_value, avg_value)

        hdfs_root_dir = None
        temp = obj2.get_cliresult("/")
        if type(temp) != type(None):
            hdfs_root_dir = temp
            pdf.set_font("Arial", "", 12)
            pdf.set_text_color(r=66, g=133, b=244)
            pdf.cell(230, 8, "HDFS Size Breakdown:", 0, ln=1)
            pdf.set_font("Arial", "", 12)
            pdf.set_text_color(r=1, g=1, b=1)
            for i in hdfs_root_dir.splitlines():
                hdfs_dir = i.split()
                if len(hdfs_dir) == 5:
                    hdfs_dir[0] = hdfs_dir[0] + b" " + hdfs_dir[1]
                    hdfs_dir[1] = hdfs_dir[2] + b" " + hdfs_dir[3]
                    hdfs_dir[2] = hdfs_dir[4]
                pdf.cell(
                    230,
                    8,
                    "{} - (Size = {} , Disk Space = {})".format(
                        str(hdfs_dir[2], "utf-8"),
                        str(hdfs_dir[0], "utf-8"),
                        str(hdfs_dir[1], "utf-8"),
                    ),
                    0,
                    ln=1,
                )
                hdfs_inner_dir = obj2.get_cliresult(hdfs_dir[2])
                if type(hdfs_inner_dir) == type(None):
                    for j in hdfs_inner_dir.splitlines():
                        hdfs_inner_dir = j.split()
                        if len(hdfs_inner_dir) == 5:
                            hdfs_inner_dir[0] = (
                                hdfs_inner_dir[0] + b" " + hdfs_inner_dir[1]
                            )
                            hdfs_inner_dir[1] = (
                                hdfs_inner_dir[2] + b" " + hdfs_inner_dir[3]
                            )
                            hdfs_inner_dir[2] = hdfs_inner_dir[4]
                        pdf.cell(
                            230,
                            8,
                            "    |-- {} - (Size = {} , Disk Space = {})".format(
                                str(hdfs_inner_dir[2], "utf-8"),
                                str(hdfs_inner_dir[0], "utf-8"),
                                str(hdfs_inner_dir[1], "utf-8"),
                            ),
                            0,
                            ln=1,
                        )
                    pdf.cell(230, 3, "", 0, ln=1)

        print("[STATUS][06/18][######............][33%] HDFS Metrics added in PDF")

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Hive Metrics", 0, ln=1)

        mt_db_host, mt_db_name, mt_db_type, mt_db_port = None, None, None, None
        temp = obj2.get_hive_config_items(cluster_name)
        if type(temp) != type(None):
            mt_db_host, mt_db_name, mt_db_type, mt_db_port = temp
            obj_pdf.hive_metastore_details(
                mt_db_host, mt_db_name, mt_db_type, mt_db_port
            )

            if mt_db_type == "postgresql":
                database_uri = "postgres+psycopg2://{}:{}@{}:{}/{}".format(
                    self.hive_username,
                    self.hive_password,
                    mt_db_host,
                    mt_db_port,
                    mt_db_name,
                )
            if mt_db_type == "mysql":
                database_uri = "mysql+pymysql://{}:{}@{}:{}/{}".format(
                    self.hive_username,
                    self.hive_password,
                    mt_db_host,
                    mt_db_port,
                    mt_db_name,
                )
            if mt_db_type == "mssql":
                sql_server_driver = ""
                driver_names = [
                    x for x in pyodbc.drivers() if x.endswith(" for SQL Server")
                ]
                if driver_names:
                    sql_server_driver = driver_names[0]
                    sql_server_driver = sql_server_driver.replace(" ", "+")
                    database_uri = "mssql+pyodbc://{}:{}@{}:{}/{}?driver={}".format(
                        self.hive_username,
                        self.hive_password,
                        mt_db_host,
                        mt_db_port,
                        mt_db_name,
                        sql_server_driver,
                    )
                else:
                    database_uri = "mssql+pyodbc://{}:{}@{}:{}/{}".format(
                        self.hive_username,
                        self.hive_password,
                        mt_db_host,
                        mt_db_port,
                        mt_db_name,
                    )

            (
                database_count,
                [tables_with_partition, tables_without_partition],
                [internal_tables, external_tables],
                hive_execution_engine,
                formats,
                transaction_locking_concurrency,
                hive_interactive_status,
            ) = (None, [None, None], [None, None], None, None, None, None)
            t1 = obj2.get_hive_database_count(database_uri, mt_db_type)
            t2 = obj2.get_hive_partitioned_table_count(database_uri, mt_db_type)
            t3 = obj2.get_hive_internal_external_tables(database_uri, mt_db_type)
            t4 = obj2.get_hive_execution_engine()
            t5 = obj2.get_hive_file_formats(database_uri, mt_db_type)
            t6 = obj2.get_transaction_locking_concurrency()
            t7 = obj2.interactive_queries_status()
            if (
                (type(t1) != type(None))
                and (type(t2) != type(None))
                and (type(t3) != type(None))
                and (type(t4) != type(None))
                and (type(t5) != type(None))
                and (type(t6) != type(None))
                and (type(t7) != type(None))
            ):
                (
                    database_count,
                    [tables_with_partition, tables_without_partition],
                    [internal_tables, external_tables],
                    hive_execution_engine,
                    formats,
                    transaction_locking_concurrency,
                    hive_interactive_status,
                ) = (t1, t2, t3, t4, t5, t6, t7)
                obj_pdf.hive_details(
                    database_count,
                    tables_with_partition,
                    tables_without_partition,
                    internal_tables,
                    external_tables,
                    hive_execution_engine,
                    formats,
                    transaction_locking_concurrency,
                    hive_interactive_status,
                )

            database_df = None
            temp1 = obj2.get_hive_database_info(database_uri, mt_db_type)
            if type(temp1) != type(None):
                database_df = temp1
                obj_pdf.hive_databases_size(database_df)

            if (type(hdfs_storage_used) != type(None)) and (
                type(database_df) != type(None)
            ):
                size_breakdown_df = None
                temp = obj2.structured_vs_unstructured(hdfs_storage_used, database_df)
                if type(temp) != type(None):
                    size_breakdown_df = temp
                    obj_pdf.structured_vs_unstructured(size_breakdown_df)

            table_df = None
            temp1 = obj2.get_hive_metaStore(database_uri, mt_db_type)
            if type(temp1) != type(None):
                table_df = temp1
                obj_pdf.hive_access_frequency(table_df)

            query_type_count_df = None
            temp1 = obj2.get_hive_adhoc_etl_query(yarn_rm, yarn_port)
            if type(temp1) != type(None):
                query_type_count_df = temp1
                obj_pdf.hive_adhoc_etl_query(query_type_count_df)

        print("[STATUS][07/18][#######...........][39%] Hive Metrics added in PDF")

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Security", 0, ln=1)

        kerberos = None
        temp = obj4.cluster_kerberos_info(cluster_name)
        if type(temp) != type(None):
            kerberos = temp
            obj_pdf.kerberos_info(kerberos)

        ADServer = None
        temp = obj4.ad_server_name_and_port(cluster_name)
        if type(temp) != type(None):
            ADServer = temp
            obj_pdf.ad_server_name_and_port(ADServer)

        Server_dn = None
        temp = obj4.ad_server_based_dn(cluster_name)
        if type(temp) != type(None):
            Server_dn = temp
            obj_pdf.ad_server_based_dn(Server_dn)

        luks_detect = None
        temp = obj4.check_luks()
        if type(temp) != type(None):
            luks_detect = temp
            obj_pdf.check_luks(luks_detect)

        Mr_ssl, hdfs_ssl, yarn_ssl = None, None, None
        temp = obj4.ssl_status()
        if type(temp) != type(None):
            Mr_ssl, hdfs_ssl, yarn_ssl = temp
            obj_pdf.ssl_status(Mr_ssl, hdfs_ssl, yarn_ssl)

        hue_flag, mapred_flag, hdfs_flag, yarn_flag, keytab = (
            None,
            None,
            None,
            None,
            None,
        )
        temp = obj4.kerberos_http_auth()
        if type(temp) != type(None):
            hue_flag, mapred_flag, hdfs_flag, yarn_flag, keytab = temp
            obj_pdf.kerberos_http_auth(
                hue_flag, mapred_flag, hdfs_flag, yarn_flag, keytab
            )

        port_df = None
        temp = obj4.port_used()
        if type(temp) != type(None):
            port_df = temp
            obj_pdf.port_used(port_df)

        key_list = None
        temp = obj4.key_list()
        if type(temp) != type(None):
            key_list = temp
            obj_pdf.key_list(key_list)

        enc_zoneList = None
        temp = obj4.encryption_zone()
        if type(temp) != type(None):
            enc_zoneList = temp
            obj_pdf.encryption_zone(enc_zoneList)

        print("[STATUS][08/18][########..........][44%] Security Metrics added in PDF")

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Network, Traffic and Monitoring Metrics", 0, ln=1)

        max_bandwidth = None
        temp = obj5.max_bandwidth()
        if type(temp) != type(None):
            max_bandwidth = temp
            obj_pdf.max_bandwidth(max_bandwidth)

        (
            max_value_in,
            min_value_in,
            avg_value_in,
            curr_value_in,
            max_value_out,
            min_value_out,
            avg_value_out,
            curr_value_out,
        ) = (None, None, None, None, None, None, None, None)
        temp = obj5.ingress_egress()
        if type(temp) != type(None):
            (
                max_value_in,
                min_value_in,
                avg_value_in,
                curr_value_in,
                max_value_out,
                min_value_out,
                avg_value_out,
                curr_value_out,
            ) = temp
            obj_pdf.ingress_egress(
                max_value_in,
                min_value_in,
                avg_value_in,
                curr_value_in,
                max_value_out,
                min_value_out,
                avg_value_out,
                curr_value_out,
            )

        total_disk_read, total_disk_write = None, None
        temp = obj5.disk_read_write()
        if type(temp) != type(None):
            total_disk_read, total_disk_write = temp
            obj_pdf.disk_read_write(total_disk_read, total_disk_write)

        print(
            "[STATUS][09/18][#########.........][50%] Networking Metrics added in PDF"
        )

        (
            softwares_installed,
            prometheus_server,
            grafana_server,
            ganglia_server,
            check_mk_server,
        ) = (None, None, None, None, None)
        temp = obj5.third_party_monitor()
        if type(temp) != type(None):
            (
                softwares_installed,
                prometheus_server,
                grafana_server,
                ganglia_server,
                check_mk_server,
            ) = temp
            obj_pdf.third_party_monitor(
                softwares_installed,
                prometheus_server,
                grafana_server,
                ganglia_server,
                check_mk_server,
            )

        oozie_flag, crontab_flag, airflow_flag = None, None, None
        temp = obj5.orchestration_tools()
        if type(temp) != type(None):
            oozie_flag, crontab_flag, airflow_flag = temp
            obj_pdf.orchestration_tools(oozie_flag, crontab_flag, airflow_flag)

        ddog, splunk, new_relic, elastic_search = None, None, None, None
        temp = obj5.logging_tool()
        if type(temp) != type(None):
            ddog, splunk, new_relic, elastic_search = temp
            obj_pdf.logging_tool(ddog, splunk, new_relic, elastic_search)

        # max_value_1, min_value_1, avg_value_1, max_value_2, min_value_2, avg_value_2 = (
        #     None,
        #     None,
        #     None,
        #     None,
        #     None,
        #     None,
        # )
        # temp = obj5.monitor_network_speed()
        # if type(temp) != type(None):
        #     (
        #         max_value_1,
        #         min_value_1,
        #         avg_value_1,
        #         max_value_2,
        #         min_value_2,
        #         avg_value_2,
        #     ) = temp
        #     obj_pdf.pdf_monitor_network_speed(
        #         max_value_1,
        #         min_value_1,
        #         avg_value_1,
        #         max_value_2,
        #         min_value_2,
        #         avg_value_2,
        #     )

        logs = None
        temp = obj5.get_logs()
        if type(temp) != type(None):
            logs = temp
            obj_pdf.get_logs(logs)

        print(
            "[STATUS][10/18][##########........][56%] Monitoring Metrics added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Yarn Metrics", 0, ln=1)

        resource = None
        temp = obj_app.dynamic_resouce_pool()
        if type(temp) != type(None):
            resource = temp
            obj_pdf.dynamic_resouce_pool(resource)

        zookeeper_ha, hive_ha, yarn_ha, hdfs_ha = None, None, None, None
        temp = obj_app.identify_ha()
        if type(temp) != type(None):
            zookeeper_ha, hive_ha, yarn_ha, hdfs_ha = temp
            obj_pdf.identify_ha(zookeeper_ha, hive_ha, yarn_ha, hdfs_ha)

        pdf.set_font("Arial", "", 12)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "VCore Details:", 0, ln=1)

        yarn_total_vcores_count = None
        temp = obj_app.get_yarn_total_vcore(yarn_rm, yarn_port)
        if type(temp) != type(None):
            yarn_total_vcores_count = temp
            obj_pdf.yarn_vcore_total(yarn_total_vcores_count)

        (
            yarn_vcore_available_df,
            yarn_vcore_allocated_avg,
            yarn_vcore_allocated_df,
            yarn_vcore_allocated_pivot_df,
        ) = (None, None, None, None)
        temp1 = obj_app.get_yarn_vcore_available(cluster_name)
        temp2 = obj_app.get_yarn_vcore_allocated(cluster_name)
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            (
                yarn_vcore_available_df,
                [
                    yarn_vcore_allocated_avg,
                    yarn_vcore_allocated_df,
                    yarn_vcore_allocated_pivot_df,
                ],
            ) = (temp1, temp2)
            obj_pdf.yarn_vcore_avg(yarn_vcore_allocated_avg)
            obj_pdf.yarn_vcore_usage(yarn_vcore_available_df, yarn_vcore_allocated_df)
            obj_pdf.yarn_vcore_seasonality(yarn_vcore_allocated_pivot_df)

        pdf.add_page()
        pdf.set_font("Arial", "", 12)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Memory Details:", 0, ln=1)

        yarn_total_memory_count = None
        temp = obj_app.get_yarn_total_memory(yarn_rm, yarn_port)
        if type(temp) != type(None):
            yarn_total_memory_count = temp
            obj_pdf.yarn_memory_total(yarn_total_memory_count)

        (
            yarn_memory_available_df,
            yarn_memory_allocated_avg,
            yarn_memory_allocated_df,
            yarn_memory_allocated_pivot_df,
        ) = (None, None, None, None)
        temp1 = obj_app.get_yarn_memory_available(cluster_name)
        temp2 = obj_app.get_yarn_memory_allocated(cluster_name)
        if (type(temp1) != type(None)) and (type(temp2) != type(None)):
            (
                yarn_memory_available_df,
                [
                    yarn_memory_allocated_avg,
                    yarn_memory_allocated_df,
                    yarn_memory_allocated_pivot_df,
                ],
            ) = (temp1, temp2)
            obj_pdf.yarn_memory_avg(yarn_memory_allocated_avg)
            obj_pdf.yarn_memory_usage(
                yarn_memory_available_df, yarn_memory_allocated_df
            )
            obj_pdf.yarn_memory_seasonality(yarn_memory_allocated_pivot_df)

        print(
            "[STATUS][11/18][###########.......][61%] Yarn Resources Metrics added in PDF"
        )

        yarn_application_df = None
        temp = obj_app.get_application_details(yarn_rm, yarn_port)
        if type(temp) != type(None):
            yarn_application_df = temp

            pdf.add_page()
            pdf.set_font("Arial", "B", 18)
            pdf.set_text_color(r=66, g=133, b=244)
            pdf.cell(230, 10, "Yarn Application Metrics", 0, ln=1)

            app_count_df, app_type_count_df, app_status_count_df = None, None, None
            temp1 = obj_app.get_application_type_status_count(yarn_application_df)
            if type(temp1) != type(None):
                app_count_df, app_type_count_df, app_status_count_df = temp1
                obj_pdf.yarn_app_count(app_count_df)
                obj_pdf.yarn_app_type_status(app_type_count_df, app_status_count_df)

            only_streaming = None
            temp1 = obj_app.streaming_jobs(yarn_application_df)
            if type(temp1) != type(None):
                only_streaming = temp1
                obj_pdf.streaming_jobs(only_streaming)

            app_vcore_df, app_memory_df = None, None
            temp1 = obj_app.get_application_vcore_memory_usage(yarn_application_df)
            if type(temp1) != type(None):
                app_vcore_df, app_memory_df = temp1
                obj_pdf.yarn_app_vcore_memory(app_vcore_df, app_memory_df)

            app_vcore_df, app_vcore_usage_df, app_memory_df, app_memory_usage_df = (
                None,
                None,
                None,
                None,
            )
            temp1 = obj_app.get_vcore_memory_by_application(yarn_application_df)
            if type(temp1) != type(None):
                (
                    app_vcore_df,
                    app_vcore_usage_df,
                    app_memory_df,
                    app_memory_usage_df,
                ) = temp1
                obj_pdf.yarn_app_vcore_usage(app_vcore_df, app_vcore_usage_df)
                obj_pdf.yarn_app_memory_usage(app_memory_df, app_memory_usage_df)

            job_launch_df = None
            temp1 = obj_app.get_job_launch_frequency(yarn_application_df)
            if type(temp1) != type(None):
                job_launch_df = temp1
                obj_pdf.yarn_job_launch_frequency(job_launch_df)

            print(
                "[STATUS][12/18][############......][67%] Yarn Application Metrics added in PDF"
            )

            bursty_app_time_df, bursty_app_vcore_df, bursty_app_mem_df = (
                None,
                None,
                None,
            )
            temp1 = obj_app.get_bursty_application_details(yarn_application_df)
            if type(temp1) != type(None):
                bursty_app_time_df, bursty_app_vcore_df, bursty_app_mem_df = temp1
                if bursty_app_time_df.size != 0:
                    pdf.add_page()
                    pdf.set_font("Arial", "B", 18)
                    pdf.set_text_color(r=66, g=133, b=244)
                    pdf.cell(230, 10, "Bursty Applications", 0, ln=1)
                    obj_pdf.yarn_bursty_app_time(bursty_app_time_df)
                    obj_pdf.yarn_bursty_app_vcore(bursty_app_vcore_df)
                    pdf.add_page()
                    obj_pdf.yar_bursty_app_memory(bursty_app_mem_df)

            # pdf.add_page()
            # pdf.set_font("Arial", "B", 18)
            # pdf.set_text_color(r=66, g=133, b=244)
            # pdf.cell(230, 10, "Failed Applications", 0, ln=1)

            # yarn_failed_app = None
            # temp1 = obj_app.getFailedApplicationDetails(yarn_application_df)
            # if type(temp1) != type(None):
            #     yarn_failed_app = temp1
            #     obj_pdf.yarnFailedApp(yarn_failed_app)

            pdf.add_page()
            pdf.set_font("Arial", "B", 18)
            pdf.set_text_color(r=66, g=133, b=244)
            pdf.cell(230, 10, "Yarn Queues", 0, ln=1)

            yarn_queues_list = None
            temp1 = obj_app.get_queue_details(yarn_rm, yarn_port)
            if type(temp1) != type(None):
                yarn_queues_list = temp1
                obj_pdf.yarn_queue(yarn_queues_list)

            queue_app_count_df, queue_elapsed_time_df = None, None
            temp1 = obj_app.get_queue_application(yarn_application_df)
            if type(temp1) != type(None):
                queue_app_count_df, queue_elapsed_time_df = temp1
                obj_pdf.yarn_queue_app(queue_app_count_df, queue_elapsed_time_df)

            (
                queue_vcore_df,
                queue_vcore_usage_df,
                queue_memory_df,
                queue_memory_usage_df,
            ) = (None, None, None, None)
            temp1 = obj_app.get_queue_vcore_memory(yarn_application_df)
            if type(temp1) != type(None):
                (
                    queue_vcore_df,
                    queue_vcore_usage_df,
                    queue_memory_df,
                    queue_memory_usage_df,
                ) = temp1
                obj_pdf.yarn_queue_vcore(queue_vcore_df, queue_vcore_usage_df)
                obj_pdf.yarn_queue_memory(queue_memory_df, queue_memory_usage_df)

            if (self.version == 6) or (self.version == 7):
                app_queue_df, app_queue_usage_df = None, None
                temp1 = obj_app.get_queue_pending_application(yarn_application_df)
                if type(temp1) != type(None):
                    app_queue_df, app_queue_usage_df = temp1
                    obj_pdf.yarn_queue_pending_app(app_queue_df, app_queue_usage_df)

        print(
            "[STATUS][13/18][#############.....][72%] Yarn Queue Metrics added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Yarn Pending and Running Applications", 0, ln=1)

        yarn_pending_apps_df = None
        temp = obj_app.get_pending_application(cluster_name)
        if type(temp) != type(None):
            yarn_pending_apps_df = temp
            obj_pdf.yarn_pending_app(yarn_pending_apps_df)

        yarn_pending_vcore_df = None
        temp = obj_app.get_pending_vcore(cluster_name)
        if type(temp) != type(None):
            yarn_pending_vcore_df = temp
            obj_pdf.yarn_pending_vcore(yarn_pending_vcore_df)

        yarn_pending_memory_df = None
        temp = obj_app.get_pending_memory(cluster_name)
        if type(temp) != type(None):
            yarn_pending_memory_df = temp
            obj_pdf.yarn_pending_memory(yarn_pending_memory_df)

        yarn_running_apps_df = None
        temp = obj_app.get_running_application(cluster_name)
        if type(temp) != type(None):
            yarn_running_apps_df = temp
            obj_pdf.yarn_running_app(yarn_running_apps_df)

        print(
            "[STATUS][14/18][##############....][78%] Yarn Running and Pending Application Metrics added in PDF"
        )

        pdf.add_page()
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "HBase Metrics", 0, ln=1)

        NumNodesServing = None
        temp = obj_app.nodes_serving_hbase()
        if type(temp) != type(None):
            NumNodesServing = temp
            obj_pdf.nodes_serving_hbase(NumNodesServing)

        base_size, disk_space_consumed = None, None
        temp = obj_app.get_hbase_data_size()
        if type(temp) != type(None):
            base_size, disk_space_consumed = temp
            obj_pdf.hbase_storage(base_size, disk_space_consumed)

        replication = None
        temp = obj_app.get_hbase_replication(cluster_name)
        if type(temp) != type(None):
            replication = temp
            obj_pdf.hbase_replication(replication)

        indexing = None
        temp = obj_app.get_hbase_secondary_index(cluster_name)
        if type(temp) != type(None):
            indexing = temp
            obj_pdf.hbase_indexing(indexing)

        hbasehive_var = None
        temp = obj_app.hBase_on_hive()
        if type(temp) != type(None):
            hbasehive_var = temp
            obj_pdf.hBase_on_hive(hbasehive_var)

        phoenixHbase = None
        temp = obj_app.phoenix_in_hbase()
        if type(temp) != type(None):
            phoenixHbase = temp
            obj_pdf.phoenix_in_hbase(phoenixHbase)

        coprocessorHbase = None
        temp = obj_app.coprocessor_in_hbase()
        if type(temp) != type(None):
            coprocessorHbase = temp
            obj_pdf.coprocessor_in_hbase(coprocessorHbase)

        print("[STATUS][15/18][###############...][83%] HBase Metrics added in PDF")

        pdf.cell(230, 10, "", 0, ln=1)
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Spark Metrics", 0, ln=1)

        spark_version = None
        temp = obj_app.get_spark_version()
        if type(temp) != type(None):
            spark_version = temp
            obj_pdf.spark_version(spark_version)

        languages = None
        temp = obj_app.get_spark_api_programming_languages()
        if type(temp) != type(None):
            languages = temp
            obj_pdf.spark_languages(languages)

        dynamic_allocation, spark_resource_manager = None, None
        temp = obj_app.get_dynamic_allocation_and_spark_resource_manager()
        if type(temp) != type(None):
            dynamic_allocation, spark_resource_manager = temp
            obj_pdf.spark_dynamic_allocation_and_resource_manager(
                dynamic_allocation, spark_resource_manager
            )

        rdd_flag, dataset_flag, sql_flag, df_flag, mllib_flag, stream_flag = (
            None,
            None,
            None,
            None,
            None,
            None,
        )
        temp = obj_app.spark_components_used()
        if type(temp) != type(None):
            rdd_flag, dataset_flag, sql_flag, df_flag, mllib_flag, stream_flag = temp
            obj_pdf.spark_components_used(
                rdd_flag, dataset_flag, sql_flag, df_flag, mllib_flag, stream_flag
            )

        print("[STATUS][16/18][################..][89%] Spark Metrics added in PDF")

        pdf.cell(230, 10, "", 0, ln=1)
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Kafka Metrics", 0, ln=1)

        retention_period = None
        temp = obj_app.retention_period_kafka()
        if type(temp) != type(None):
            retention_period = temp
            obj_pdf.retention_period(retention_period)

        num_topics = None
        zookeeper_conn = obj_app.zookeeper_conn()
        temp = obj_app.num_topics_kafka(zookeeper_conn)
        if type(temp) != type(None):
            num_topics = temp
            obj_pdf.num_topics(num_topics)

        sum_size = None
        temp = obj_app.msg_size_kafka(zookeeper_conn)
        if type(temp) != type(None):
            sum_size = temp
            obj_pdf.msg_size(sum_size)

        sum_count = None
        temp = obj_app.msg_count_kafka(zookeeper_conn)
        if type(temp) != type(None):
            sum_count = temp
            obj_pdf.msg_count(sum_count)

        total_size, brokersize = None, None
        temp1 = obj_app.kafka_cluster_size()
        temp2 = obj_app.broker_size_kafka()
        if (type(temp1) and type(temp2)) != type(None):
            total_size = temp1
            brokersize = temp2
            obj_pdf.cluster_size_and_brokerSize(total_size, brokersize)

        HA_Strategy = None
        temp = obj_app.ha_strategy_kafka(zookeeper_conn)
        if type(temp) != type(None):
            HA_Strategy = temp
            obj_pdf.ha_strategy(HA_Strategy)

        print("[STATUS][17/18][#################.][94%] Kafka Metrics added in PDF")

        pdf.cell(230, 10, "", 0, ln=1)
        pdf.set_font("Arial", "B", 18)
        pdf.set_text_color(r=66, g=133, b=244)
        pdf.cell(230, 10, "Cloudera Services", 0, ln=1)

        br = None
        temp = obj_app.backup_and_recovery()
        if type(temp) != type(None):
            br = temp
            obj_pdf.backup_and_recovery(br)

        services = None
        temp = obj_app.get_cloudera_services_used_for_ingestion(cluster_name)
        if type(temp) != type(None):
            services = temp
            obj_pdf.services_used_for_ingestion(services)

        impala = None
        temp = obj_app.use_of_impala()
        if type(temp) != type(None):
            impala = temp
            obj_pdf.impala(impala)

        sentry = None
        temp = obj_app.use_of_sentry()
        if type(temp) != type(None):
            sentry = temp
            obj_pdf.sentry(sentry)

        kudu = None
        temp = obj_app.use_of_kudu()
        if type(temp) != type(None):
            kudu = temp
            obj_pdf.kudu(kudu)

        print("[STATUS][18/18][##################][100%] Completed!!")

        pdf.output(
            "../../hadoop_assessment_report_{}.pdf".format(self.inputs["cur_date"]), "F"
        )

