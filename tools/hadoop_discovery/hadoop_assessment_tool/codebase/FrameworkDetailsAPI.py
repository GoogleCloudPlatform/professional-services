# ------------------------------------------------------------------------------
# This module contains all the features of the category Framework and
# software details. This module contains the actual logic built with the help
# of Cloudera Manager API, Generic API and commands.
# -------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class FrameworkDetailsAPI:
    """This Class has functions related to Frameworks and Software Details 
    category.

    Has functions which fetch different frameworks and software metrics 
    from a Hadoop cluster like Hadoop version, services version, etc.

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

    def hadoop_version(self):
        """Get Hadoop major and minor versions and Hadoop Distribution.

        Returns:
            hadoop_major (str): Hadoop major version
            hadoop_minor (str): Hadoop minor version
            distribution (str): Hadoop vendor name
        """

        try:
            hversion = subprocess.Popen(
                "hadoop version 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            hversion.wait(10)
            hversion, err = hversion.communicate()
            hadoop_major = hversion[0:12]
            subprocess.Popen(
                "hadoop version 2>/dev/null  1>./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            dt = "This command was run using "
            a = ""
            with open("data.csv", "r") as fp:
                with open("out2.csv", "w") as f1:
                    for line in fp:
                        if dt in line:
                            a = line
                            a = (
                                line.replace(
                                    "This command was run using /opt/cloudera/parcels/",
                                    "",
                                )
                                .replace(
                                    "/jars/hadoop-common-3.1.1.7.1.4.0-203.jar", ""
                                )
                                .replace("", "")
                            )
            hadoop_minor = a[0:9]
            subprocess.Popen(
                "rm -rf ./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            subprocess.Popen(
                "rm ./out2.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            ).wait(10)
            distribution = ""
            if re.search(r"\bcdh7\b", a):
                distribution = "CDH7"
            elif re.search(r"\bcdh6\b", a):
                distribution = "CDH6"
            elif re.search(r"\bcdh5\b", a):
                distribution = "CDH5"
            if self.version == 0:
                hadoop_minor, distribution = None, None
            self.logger.info("hadoop_version successful")
            return hadoop_major, hadoop_minor, distribution
        except Exception as e:
            self.logger.error("hadoop_version failed", exc_info=True)
            return None

    def version_mapping(self, cluster_name):
        """Get list of services installed in cluster with their versions.

        Args:
            cluster_name (str): Cluster name present in cloudera manager.
        Returns:
            list_services_installed_df (DataFrame): List of services installed.
            new_ref_df (DataFrame): Services mapped with their version.
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
                self.logger.error("version_mapping failed as cloudera does not exist",)
                return None
            if r.status_code == 200:
                version_related = r.json()
                version_related_count = version_related["items"]
                list_apache_services = []
                for i in version_related_count:
                    version_related_show = version_related
                    for displayname in version_related_show["items"]:
                        displyName = displayname["displayName"].lower()
                        list_apache_services.append(displyName)
                list_apache_services = list(set(list_apache_services))
                list_services_installed_df = pd.DataFrame(
                    list_apache_services, columns=["name"]
                )
                inter = subprocess.Popen(
                    "cat /opt/cloudera/parcels/CDH/meta/parcel.json 2>/dev/null",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )

                inter, err = inter.communicate()
                version_data = json.loads(inter)
                data = version_data["components"]
                df_service_version = pd.DataFrame(data)
                new_ref_df = list_services_installed_df.merge(
                    df_service_version, how="left"
                )
                new_ref_df_nan = new_ref_df[new_ref_df.isna().any(axis=1)]["name"]
                for i in new_ref_df_nan.iteritems():
                    found = df_service_version[
                        df_service_version["name"].str.contains(i[1])
                    ]
                    if found.empty:
                        pass
                    else:
                        exist = new_ref_df[new_ref_df["name"].str.contains(i[1])]
                        if exist.empty:
                            break
                        else:
                            new_ref_df = new_ref_df.append(found)
                new_ref_df = new_ref_df.drop_duplicates()
                new_ref_df.dropna(subset=["pkg_release"], inplace=True)
                new_ref_df["sub_version"] = new_ref_df.version.str[:5]
                new_ref_df = new_ref_df.drop(["version"], axis=1)
                new_ref_df = new_ref_df.reset_index(drop=True)
                self.logger.info("version_mapping successful")
                return list_services_installed_df, new_ref_df
            else:
                self.logger.error(
                    "version_mapping failed due to invalid API call. HTTP Response: ",
                    r.status_code,
                )
                return None
        except Exception as e:
            self.logger.error("version_mapping failed", exc_info=True)
            return None

    def third_party_software(self):
        """Get list of 3rd party software installed in cluster.

        Returns:
            third_party_package (DataFrame): List of rd party software.
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
            third_party_package = None
            if "centos" in os_name:
                subprocess.Popen(
                    "yum list installed | grep @epel > ./centos_third_party.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version", "package_level"]
                third_party_package = pd.read_csv(
                    "centos_third_party.csv", names=col_names, delimiter=r"\s+"
                )
                subprocess.Popen(
                    "rm ./centos_third_party.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
            elif "red hat" in os_name:
                subprocess.Popen(
                    "yum list installed | grep @epel > ./centos_third_party.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version", "package_level"]
                third_party_package = pd.read_csv(
                    "centos_third_party.csv", names=col_names, delimiter=r"\s+"
                )
                subprocess.Popen(
                    "rm ./centos_third_party.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
            self.logger.info("third_party_software successful")
            return third_party_package
        except Exception as e:
            self.logger.error("third_party_software failed", exc_info=True)
            return None

    def version_package(self):
        """Get list of software installed in cluster with their versions.

        Returns:
            package_version (DataFrame): List of software installed.
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
            package_version = None
            if "centos" in os_name:
                subprocess.Popen(
                    "yum list installed | awk '{print $1,$2}' > ./centos_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version"]
                package_version = pd.read_csv(
                    "centos_package_version.csv",
                    names=col_names,
                    delimiter=r"\s+",
                    skiprows=5,
                )
                subprocess.Popen(
                    "rm ./centos_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                package_version = package_version[1:10]
            elif "debian" in os_name:
                subprocess.Popen(
                    "dpkg-query -l  | awk '{print $2,$3}' > ./debian_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version"]
                package_version = pd.read_csv(
                    "debian_package_version.csv",
                    names=col_names,
                    delimiter=r"\s+",
                    skiprows=5,
                )
                subprocess.Popen(
                    "rm ./debian_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                package_version = package_version[1:10]
            elif "ubuntu" in os_name:
                subprocess.Popen(
                    "dpkg-query -l  | awk '{print $2,$3}' > ./ubuntu_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version"]
                package_version = pd.read_csv(
                    "ubuntu_package_version.csv",
                    names=col_names,
                    delimiter=r"\s+",
                    skiprows=5,
                )
                subprocess.Popen(
                    "rm ./ubuntu_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                package_version = package_version[1:10]
            elif "red hat" in os_name:
                subprocess.Popen(
                    "yum list installed | awk '{print $1,$2}' > ./redhat_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                col_names = ["name", "version"]
                package_version = pd.read_csv(
                    "redhat_package_version.csv",
                    names=col_names,
                    delimiter=r"\s+",
                    skiprows=5,
                )
                subprocess.Popen(
                    "rm -rf ./redhat_package_version.csv",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                ).wait(10)
                package_version = package_version[1:10]
            elif "suse" in os_name:
                pass
            self.logger.info("version_package successful")
            return package_version
        except Exception as e:
            self.logger.error("version_package failed", exc_info=True)
            return None

    def jdbcodbc_driver(self):
        """Get list of JDBC and ODBC driver in cluster.

        Returns:
            final_df (DataFrame): List of JDBC and ODBC driver.
        """

        try:
            subprocess.Popen(
                'find / -iname "*.jar" 2>/dev/null | grep -E "jdbc|odbc" > ./jdbc_odbc.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()
            df11 = pd.read_csv("jdbc_odbc.csv", delimiter=r"\s+", names=["name"])
            subprocess.Popen(
                "rm ./jdbc_odbc.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            BetweenTwoSymbols1 = df11["name"].str.split("/").str[-1]
            result1 = BetweenTwoSymbols1.drop_duplicates()
            final_df = result1.to_frame()
            self.logger.info("jdbcodbc_driver successful")
            return final_df
        except Exception as e:
            self.logger.error("jdbcodbc_driver failed", exc_info=True)
            return None

    def salesforce_sapDriver(self):
        """Get SalesForce and SAP driver in cluster.

        Returns:
            df_ngdbc (DataFrame): SAP driver.
            df_salesforce (DataFrame): SalesForce driver.
        """

        try:
            subprocess.Popen(
                'find / -iname "Salesforce" 2>/dev/null > ./salesforce.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            df_salesforce = pd.read_csv(
                "salesforce.csv", delimiter=r"\s+", names=["name"]
            )
            subprocess.Popen(
                "rm -rf ./salesforce.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()
            subprocess.Popen(
                'find / -iname "ngdbc.jar" 2>/dev/null> ./ngdbc.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            df_ngdbc = pd.read_csv("ngdbc.csv", delimiter=r"\s+", names=["name"])
            subprocess.Popen(
                "rm ./ngdbc.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
            ).wait(10)
            self.logger.info("salesfroce_sapDriver successful")
            return df_ngdbc, df_salesforce
        except Exception as e:
            self.logger.error("salesfroce_sapDriver failed", exc_info=True)
            return None

    def installed_connectors(self):
        """Get list of connectors present in cluster.

        Returns:
            connectors_present (DataFrame): List of connectors.
        """

        try:
            subprocess.Popen(
                'find / -type f -name "*connector*.jar" 2>/dev/null > ./connector.csv',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()
            connector_df = pd.read_csv("./connector.csv", names=["Connector_Name"])
            subprocess.Popen(
                "rm -rf ./connector.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            connector_details = connector_df["Connector_Name"].str.split("/").str[-1]
            connectors_present = connector_details.drop_duplicates()
            connectors_present = connectors_present.to_frame()
            self.logger.info("installed_connectors successful")
            return connectors_present
        except Exception as e:
            self.logger.error("installed_connectors failed", exc_info=True)
            return None
