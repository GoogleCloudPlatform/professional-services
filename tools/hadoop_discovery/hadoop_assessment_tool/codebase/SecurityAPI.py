# ------------------------------------------------------------------------------
# This module will use the cloudera API and CLI commands for the retrieval of
# Security related features. This module will spot the other third party tools
# whichever is integrated with the Hadoop cluster to enhanced security.
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class SecurityAPI:
    """This Class has functions related to the Security category.

    Has functions which fetch different security metrics from Hadoop
    cluster like kerberos details, AD server details, etc.

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

    def cluster_kerberos_info(self, cluster_name):
        """Get Kerberos details in a cluster.
       
        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            cluster_kerberos_info (str): Kerberos information of cluster.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/clusters/{}/kerberosInfo".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/kerberosInfo".format(
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
                    "{}://{}:{}/api/v19/clusters/{}/kerberosInfo".format(
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
            if r.status_code == 200:
                cluster_kerberos_info = r.json()
                kerberized_status = str(cluster_kerberos_info["kerberized"])
                if kerberized_status == "True":
                    cluster_kerberos_info = "Cluster is kerberized"
                else:
                    cluster_kerberos_info = "Cluster is not kerberized"
                self.logger.info("cluster_kerberos_info successful")
                return cluster_kerberos_info
            else:
                self.logger.error(
                    "cluster_kerberos_info failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("cluster_kerberos_info failed", exc_info=True)
            return None

    def ad_server_name_and_port(self, cluster_name):
        """Get AD server details for a cluster.
       
        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            ADServer (str): Url and port of AD server.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/cm/deployment".format(
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
                    "{}://{}:{}/api/v19/cm/deployment".format(
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
                    "{}://{}:{}/api/v19/cm/deployment".format(
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
            if r.status_code == 200:
                ad_server = r.json()
                ADServer = "LDAP server not present"
                ad_server = ad_server["managerSettings"]
                for i in ad_server["items"]:
                    if i["name"] == "LDAP_URL":
                        ADServer = i["value"]
                self.logger.info("ad_server_name_and_port successful")
                return ADServer
            else:
                self.logger.error(
                    "ad_server_name_and_port failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("ad_server_name_and_port failed", exc_info=True)
            return None

    def ad_server_based_dn(self, cluster_name):
        """Get AD server details based on domain name.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            Server_dn (str): Domain name of LDAP bind parameter.
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/cm/deployment".format(
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
                    "{}://{}:{}/api/v19/cm/deployment".format(
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
                    "{}://{}:{}/api/v19/cm/deployment".format(
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
            if r.status_code == 200:
                ad_server = r.json()
                Server_dn = None
                ad_server = ad_server["managerSettings"]
                for i in ad_server["items"]:
                    if i["name"] == "LDAP_BIND_DN":
                        Server_dn = i["value"]
                self.logger.info("ad_server_based_dn successful")
                return Server_dn
            else:
                self.logger.error(
                    "ad_server_based_dn failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("ad_server_based_dn failed", exc_info=True)
            return None

    def ssl_status(self):
        """Get SSL staus of various services.

        Returns:
            Mr_ssl (str): MapReduce SSL status
            hdfs_ssl (str): HDFS SSL status
            yarn_ssl (str): Yarn SSL status
        """

        try:
            path_status = path.exists("{}".format(self.config_path["hdfs"]))
            if path_status == True:
                xml_data = subprocess.Popen(
                    "cat {} | grep HTTPS_ONLY".format(self.config_path["hdfs"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                out, err = xml_data.communicate()
                if out.find("HTTPS_ONLY") == -1:
                    hdfs_ssl = "SSL on HDFS is not enabled"
                else:
                    hdfs_ssl = "SSL on HDFS is enabled"
            else:
                hdfs_ssl = None
            path_status = path.exists("{}".format(self.config_path["yarn"]))
            if path_status == True:
                xml_data = subprocess.Popen(
                    "cat {} | grep HTTPS_ONLY".format(self.config_path["yarn"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                out, err = xml_data.communicate()
                if out.find("HTTPS_ONLY") == -1:
                    yarn_ssl = "SSL on Yarn is not enabled"
                else:
                    yarn_ssl = "SSL on Yarn is enabled"
            else:
                yarn_ssl = None
            path_status = path.exists("{}".format(self.config_path["mapred"]))
            if path_status == True:
                xml_data = subprocess.Popen(
                    "cat {} | grep HTTPS_ONLY".format(self.config_path["mapred"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                out, err = xml_data.communicate()
                if out.find("HTTPS_ONLY") == -1:
                    Mr_ssl = "SSL on Mapreduce is not enabled"
                else:
                    Mr_ssl = "SSL on Mapreduce is enabled"
            else:
                Mr_ssl = None
            self.logger.info("ssl_status successful")
            return Mr_ssl, hdfs_ssl, yarn_ssl
        except Exception as e:
            self.logger.error("ssl_status failed", exc_info=True)
            return None

    def kerberos_http_auth(self):
        """Get kerberos status of various services.

        Returns:
            hue_flag (str): Hue kerberos status
            mapred_flag (str): MapReduce kerberos status
            hdfs_flag (str): HDFS kerberos status
            yarn_flag (str): Yarn kerberos status
            keytab (str): Presence of keytab files
        """

        try:
            r = None
            if self.version == 7:
                r = requests.get(
                    "{}://{}:{}/api/v40/cm/kerberosPrincipals".format(
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
                    "{}://{}:{}/api/v19/cm/kerberosPrincipals".format(
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
                    "{}://{}:{}/api/v19/cm/kerberosPrincipals".format(
                        self.http,
                        self.cloudera_manager_host_ip,
                        self.cloudera_manager_port,
                    ),
                    auth=HTTPBasicAuth(
                        self.cloudera_manager_username, self.cloudera_manager_password
                    ),
                    verify=False,
                )
            if r.status_code == 200:
                keytab1 = r.json()
                if len(keytab1["items"]) > 0:
                    keytab = "keytab exist"
                else:
                    keytab = "keytab not exist"
                keytab1 = keytab1["items"]
                new_list = []
                for i in range(0, len(keytab1)):
                    dt = keytab1[i].split("/", 1)
                    neww_list = new_list.append(dt[0])
                new_list = [x.lower() for x in new_list]

                if "hue" in new_list:
                    hue_flag = "Kerberos on hue is enabled"
                else:
                    hue_flag = "Kerberos on hue is not enabled"

                if "yarn" in new_list:
                    yarn_flag = "Kerberos on yarn is enabled"
                else:
                    yarn_flag = "Kerberos on yarn is not enabled"

                if "mapred" in new_list:
                    mapred_flag = "Kerberos on mapreduce is enabled"
                else:
                    mapred_flag = "Kerberos on mapreduce is not enabled"

                if "hdfs" in new_list:
                    hdfs_flag = "Kerberos on HDFS is enabled"
                else:
                    hdfs_flag = "Kerberos on HDFS is not enabled"

                self.logger.info("kerberos_http_auth successful")
                return hue_flag, mapred_flag, hdfs_flag, yarn_flag, keytab
            else:
                self.logger.error(
                    "kerberos_http_auth failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
        except Exception as e:
            self.logger.error("kerberos_http_auth failed", exc_info=True)
            return None

    def check_luks(self):
        """Get LUKS information in cluster.

        Returns:
            luks_detect (str): LUKS information.
        """

        try:
            subprocess.Popen(
                "blkid > ./block.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            columns = [
                "block",
                "section",
                "UUID",
                "TYPE",
                "part1",
                "part2",
                "part3",
                "part4",
            ]
            luks_detect = pd.read_csv(
                "block.csv", names=columns, delimiter=r"\s+", header=None
            )
            subprocess.Popen(
                "rm ./block.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            ).wait(10)
            luks_detect.drop(
                columns=["UUID", "part1", "part2", "part3", "part4"], inplace=True
            )
            luks_detect["TYPE_LOWER"] = luks_detect["TYPE"].str.lower()
            self.logger.info("check_luks successful")
            return luks_detect
        except Exception as e:
            self.logger.error("check_luks failed", exc_info=True)
            return None

    def port_used(self):
        """Get port number for different services.

        Returns:
            port_df (DataGrame): port number for different services.
        """

        try:
            port_df = pd.DataFrame(columns=["service", "port"])
            subprocess.Popen(
                "find / -iname oozie-site.xml 2>/dev/null > oozie_port.csv ",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            xml_oozie = ""
            with open("oozie_port.csv", "r") as fp:
                for line in fp:
                    if "-oozie-OOZIE_SERVER/oozie-site.xml" in line:
                        xml_oozie = line
            subprocess.Popen(
                "rm ./oozie_port.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            if xml_oozie != "":
                dt_xml = subprocess.Popen(
                    "cat " + xml_oozie,
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                dt_xml.wait(10)
                dt_xml, err = dt_xml.communicate()
                myxml = fromstring(dt_xml)
                for val in myxml.findall("property"):
                    name = val.find("name").text
                    if "oozie.base.url" not in name:
                        myxml.remove(val)
                value = myxml[0][1].text
                value = " ".join(value.split(":", 2)[2:])
                value = " ".join(value.split("/", 1)[:1])
                if line == "":
                    line = pd.NaT
                    df_port = {"service": "Oozie Port", "port": pd.NaT}
                else:
                    line = line
                    df_port = {"service": "Oozie Port", "port": value}
            else:
                line = pd.NaT
                df_port = {"service": "Oozie Port", "port": pd.NaT}
            port_df = port_df.append(df_port, ignore_index=True)
            hdfs_line = ""
            path_status = path.exists("{}".format(self.config_path["core"]))
            if path_status == True:
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
                    if "fs.defaultFS" not in name:
                        root.remove(val)
                value = root[0][1].text
                value = " ".join(value.split(":", 2)[2:])
                if value == "":
                    line = pd.NaT
                    df_port = {"service": "HDFS Port", "port": pd.NaT}
                else:
                    line = hdfs_line
                    df_port = {"service": "HDFS Port", "port": value}
                port_df = port_df.append(df_port, ignore_index=True)
            yarn_line = ""
            path_status = path.exists("{}".format(self.config_path["yarn"]))
            if path_status == True:
                xml_data = subprocess.Popen(
                    "cat {}".format(self.config_path["yarn"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                xml_data.wait(10)
                xml_data, err = xml_data.communicate()
                root = ET.fromstring(xml_data)
                for val in root.findall("property"):
                    name = val.find("name").text
                    if "yarn.resourcemanager.address" not in name:
                        root.remove(val)
                value = root[0][1].text
                value = " ".join(value.split(":", 2)[1:])
                if value == "":
                    line = pd.NaT
                    df_port = {"service": "Yarn Port", "port": pd.NaT}
                else:
                    line = yarn_line
                    df_port = {"service": "Yarn Port", "port": value}
                port_df = port_df.append(df_port, ignore_index=True)
            mapred_line = ""
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
                    if "mapreduce.jobhistory.address" not in name:
                        root.remove(val)
                value = root[0][1].text
                value = " ".join(value.split(":", 2)[1:])
                if value == "":
                    line = pd.NaT
                    df_port = {"service": "Mapreduce Port", "port": pd.NaT}
                else:
                    line = mapred_line
                    df_port = {"service": "Mapreduce Port", "port": value}
                port_df = port_df.append(df_port, ignore_index=True)
            kafka_line = ""
            path_status = path.exists("{}".format(self.config_path["kafka"]))
            if path_status == True:
                subprocess.Popen(
                    "cat {} > kafka_port.csv".format(self.config_path["kafka"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                with open("kafka_port.csv") as fp:
                    for kafka_line in fp:
                        if "listeners=PLAINTEXT://" in kafka_line:
                            break
                subprocess.Popen(
                    "rm ./kafka_port.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                kafka_line = kafka_line.split(",")
                kafka_line = kafka_line[0]
                kafka_line = kafka_line.replace(":", ",")
                kafka_line = kafka_line.split(",")
                kafka_line = kafka_line[1]
                if kafka_line == "":
                    line = pd.NaT
                    df_port = {"service": "Kafka Port", "port": pd.NaT}
                else:
                    line = kafka_line
                    df_port = {"service": "Kafka Port", "port": line}
                port_df = port_df.append(df_port, ignore_index=True)
            spark_line = ""
            path_status = path.exists("{}".format(self.config_path["spark"]))
            if path_status == True:
                subprocess.Popen(
                    "cat {} > spark_data.csv".format(self.config_path["spark"]),
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                with open("spark_data.csv") as fp:
                    for spark_line in fp:
                        if "spark.shuffle.service.port" in spark_line:
                            break
                subprocess.Popen(
                    "rm -rf ./spark_data.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                spark_line = " ".join(spark_line.split("=", 1)[1:])
                if spark_line == "":
                    line = pd.NaT
                    df_port = {"service": "Spark Port", "port": pd.NaT}
                else:
                    line = spark_line
                    df_port = {"service": "Spark Port", "port": line.rstrip()}
                port_df = port_df.append(df_port, ignore_index=True)
            kerberos_line = ""
            path_status = path.exists("/var/kerberos/krb5kdc/kdc.conf")
            if path_status == True:
                subprocess.Popen(
                    "cat /var/kerberos/krb5kdc/kdc.conf > ./spark_data.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                with open("spark_data.csv") as fp:
                    for kerberos_line in fp:
                        if "kdc_tcp_ports" in kerberos_line:
                            break
                subprocess.Popen(
                    "rm ./spark_data.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                kerberos_line = " ".join(kerberos_line.split("=", 1)[1:])
                if kerberos_line == "":
                    line = pd.NaT
                    df_port = {"service": "Kerberos Port", "port": pd.NaT}
                else:
                    line = kerberos_line
                    df_port = {"service": "Kerberos Port", "port": line.rstrip()}
                port_df = port_df.append(df_port, ignore_index=True)
            zookeeper_line = ""
            dt = subprocess.Popen(
                'find / -name "zoo.cfg" 2>/dev/null',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            dt.wait(10)
            dt, err = dt.communicate()
            res_list = dt.splitlines()
            for i in res_list:
                if "/etc/zookeeper/conf.dist/zoo.cfg" in i:
                    intermediate_list = subprocess.Popen(
                        "cat " + i, shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                    )
                    intermediate_list, err = intermediate_list.communicate()
                    new_res_list = intermediate_list.splitlines()
                    res = [string for string in new_res_list if "clientPort=" in string]
                    listToStr = " ".join([str(elem) for elem in res])
                    zookeeper_line = " ".join(listToStr.split("=", 1)[1:])
            if line == "":
                line = pd.NaT
                df_port = {"service": "Zookeeper Port", "port": pd.NaT}
            else:
                line = zookeeper_line
                df_port = {"service": "Zookeeper Port", "port": line.rstrip()}
            port_df = port_df.append(df_port, ignore_index=True)
            port_df = port_df.dropna()
            self.logger.info("port_used successful")
            return port_df
        except Exception as e:
            self.logger.error("port_used failed", exc_info=True)
            return None

    def key_list(self):
        """Get list of keys in cluster.

        Returns:
            key_list (str): list of keys.
        """

        try:
            key_list = subprocess.Popen(
                "hadoop key list", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            )
            key_list.wait(10)
            out, err = key_list.communicate()
            out = out.splitlines()
            out1 = str(out)
            substring = "no valid (non-transient) providers"
            substring_in_list = any(substring in out1 for string in out)
            if substring_in_list == True:
                key_list = None
            else:
                out = out[1:]
                key_list = out
                key_list = ", ".join(key_list)
            self.logger.info("key_list successful")
            return key_list
        except Exception as e:
            self.logger.error("ey_list failed", exc_info=True)
            return None

    def encryption_zone(self):
        """Get list of encryption zone in cluster.

        Returns:
            enc_zoneList (DataGrame): list of encryption zone.
        """

        try:
            enc_zoneList = pd.DataFrame()
            xml_data = subprocess.Popen(
                "sudo hdfs crypto -listZones",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            xml_data.wait(10)
            out, err = xml_data.communicate()
            if not out.strip():
                enc_zoneList = None
            else:
                intermediate_out = out.splitlines()
                intermediate_out.pop(-1)
                splitted_search = [x.split("\n") for x in intermediate_out]
                enc_zoneList = pd.DataFrame(splitted_search, columns=["data"])
                enc_zoneList["data"] = enc_zoneList["data"].str.split(
                    " ", n=1, expand=True
                )
            self.logger.info("encryption_zone successful")
            return enc_zoneList
        except Exception as e:
            self.logger.error("encryption_zone failed", exc_info=True)
            return None
