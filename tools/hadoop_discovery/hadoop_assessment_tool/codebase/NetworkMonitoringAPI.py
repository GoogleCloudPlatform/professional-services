# ------------------------------------------------------------------------------
# This module contains all the features of the category Network, Traffic,
# Operation and Monitoring. This module contains the actual logic built with
# the help of Cloudera Manager API, Generic API and commands.
# -------------------------------------------------------------------------------

# Importing required libraries
from imports import *


class NetworkMonitoringAPI:
    """This Class has functions related to Network, Traffic, Operation and 
    Monitoring category.

    Has functions which fetch different network, monitoring, etc metrics from 
    Hadoop cluster like bandwidth, ingress, egress, disk speed, monitoring 
    tools, etc.

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

    def max_bandwidth(self):
        """Get maximum bandwidth of cluster.

        Returns:
            max_bandwidth (str): maximum bandwidth.
        """

        try:
            subprocess.Popen(
                "awk '/MaxBandwidth/  {print $2}' /etc/vnstat.conf > MaxBandwidth.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            maxbandwidth_df = pd.read_csv("MaxBandwidth.csv", delimiter="\n")
            subprocess.Popen(
                "rm ./MaxBandwidth.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            max_bandwidth = str(maxbandwidth_df["MaxBandwidth"][0])
            self.logger.info("max_bandwidth successful")
            return max_bandwidth
        except Exception as e:
            self.logger.error("max_bandwidth failed", exc_info=True)
            return None

    def ingress_egress(self):
        """Get ingress_egress network traffic cluster.

        Returns:
            max_value_in (str) : Maximun ingress value
            min_value_in (str) : Minimun ingress value
            avg_value_in (str) : Average ingress value
            curr_value_in (str) : Current ingress value
            max_value_in (str) : Maximun egress value
            min_value_in (str) : Minimun egress value
            avg_value_in (str) : Average egress value
            curr_value_in (str) : Current egress value
        """

        try:
            subprocess.Popen(
                "sed -i 's/\r//g' ./getload.sh 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()
            subprocess.Popen(
                "bash ./getload.sh 2>/dev/null 1>parse.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()

            df = pd.read_csv(
                "./parse.csv", names=["Index", "Received", "Transfer"], header=None
            )
            subprocess.Popen(
                "rm ./parse.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8",
            ).wait(10)
            if not df.empty:
                column1 = df["Received"]
                max_value_in = (column1.max()) / 1024
                min_value_in = (column1.min()) / 1024
                avg_value_in = (column1.mean()) / 1024
                curr_value_in = (column1.iloc[0]) / 1024
                column2 = df["Transfer"]
                max_value_out = (column2.max()) / 1024
                min_value_out = (column2.min()) / 1024
                avg_value_out = (column2.mean()) / 1024
                curr_value_out = (column2.iloc[0]) / 1024
                self.logger.info("ingress_egress successful")
                return (
                    max_value_in,
                    min_value_in,
                    avg_value_in,
                    curr_value_in,
                    max_value_out,
                    min_value_out,
                    avg_value_out,
                    curr_value_out,
                )
            else:
                self.logger.error("ingress_egress failed", exc_info=True)
                return None
        except Exception as e:
            self.logger.error("ingress_egress failed", exc_info=True)
            return None

    def disk_read_write(self):
        """Get disk read and write speed of cluster.

        Returns:
            total_disk_read (str) : Disk read speed
            total_disk_write (str) : Disk write speed
        """

        try:
            subprocess.Popen(
                "iostat -d | awk 'BEGIN{OFS= \",\" ;}NR>2{print $3, $4;} ' > ./disk.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            disk_df = pd.read_csv("disk.csv", delimiter=",")
            subprocess.Popen(
                "rm ./disk.csv", shell=True, stdout=subprocess.PIPE, encoding="utf-8",
            ).wait(10)
            disk_df = disk_df.fillna(0)
            disk_df.columns = ["disk_read", "disk_write"]
            total_disk_read = 0
            for i in disk_df["disk_read"]:
                total_disk_read = total_disk_read + float(i)
            total_disk_write = 0
            for i in disk_df["disk_write"]:
                total_disk_write = total_disk_write + float(i)
            self.logger.info("disk_read_write successful")
            return total_disk_read, total_disk_write
        except Exception as e:
            self.logger.error("disk_read_write failed", exc_info=True)
            return None

    def third_party_monitor(self):
        """Get list of third party monitoring tools in cluster.

        Returns:
            softwares_installed (str): List of software installed in cluster.
            prometheus_server (str): Presence of prometheus in cluster
            grafana_server (str): Presence of grafana in cluster
            ganglia_server (str): Presence of ganglia in cluster
            check_mk_server (str): Presence of check_mk_server in cluster
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
            softwares_installed = ""
            if "centos" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                softwares_installed.wait(10)
                softwares_installed, err = softwares_installed.communicate()
            elif "debian" in os_name:
                softwares_installed = subprocess.Popen(
                    "dpkg -l", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                softwares_installed.wait(10)
                softwares_installed, err = softwares_installed.communicate()
            elif "ubuntu" in os_name:
                softwares_installed = subprocess.Popen(
                    "apt list --installed 2>/dev/null",
                    shell=True,
                    stdout=subprocess.PIPE,
                    encoding="utf-8",
                )
                softwares_installed.wait(10)
                softwares_installed, err = softwares_installed.communicate()
            elif "red hat" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                softwares_installed.wait(10)
                softwares_installed, err = softwares_installed.communicate()
            elif "suse" in os_name:
                softwares_installed = subprocess.Popen(
                    "rpm -qa", shell=True, stdout=subprocess.PIPE, encoding="utf-8"
                )
                softwares_installed.wait(10)
                softwares_installed, err = softwares_installed.communicate()
            prometheus_server = subprocess.Popen(
                "systemctl status prometheus 2>/dev/null | grep active",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            prometheus_server.wait(10)
            out, err = prometheus_server.communicate()
            if not out:
                prometheus_server = "Prometheus server is not present"
            else:
                prometheus_server = "Prometheus server is present"
            grafana_server = subprocess.Popen(
                "grafana-server -v 2>/dev/null | grep Version",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            out, err = grafana_server.communicate()
            if not out:
                grafana_server = "grafana server is not present"
            else:
                grafana_server = "grafana server is present"

            ganglia_server = subprocess.Popen(
                'find / -iname "ganglia.conf" 2>/dev/null',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            ganglia_server.wait(10)
            out, err = ganglia_server.communicate()
            if not out:
                ganglia_server = "ganglia server is not present"
            else:
                ganglia_server = "ganglia server is present"
            check_mk_server = subprocess.Popen(
                "omd version 2>/dev/null | grep Version",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            check_mk_server.wait(10)
            out, err = check_mk_server.communicate()
            if not out:
                check_mk_server = "check mk server is not present"
            else:
                check_mk_server = "check mk server is present"
            self.logger.info("third_party_monitor successful")
            return (
                softwares_installed,
                prometheus_server,
                grafana_server,
                ganglia_server,
                check_mk_server,
            )
        except Exception as e:
            self.logger.error("third_party_monitor failed", exc_info=True)
            return None

    def get_logs(self):
        """Get logs paths in cluster.

        Returns:
            logs (str): List of logs path.
        """

        try:
            subprocess.Popen(
                "ls -l /var/log > ./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            col_names = [
                "permission",
                "links",
                "owner",
                "group_owner",
                "size",
                "creation_month",
                "creation_date",
                "creation_time",
                "name",
            ]
            df11 = pd.read_csv(
                "data.csv", names=col_names, delimiter=r"\s+", skiprows=1
            )
            subprocess.Popen(
                "rm -rf ./data.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            remove_list = ["root", "chrony", "ntp"]
            logs = df11[~df11["owner"].isin(remove_list)]
            logs.reset_index(inplace=True)
            self.logger.info("get_logs successful")
            return logs
        except Exception as e:
            self.logger.error("get_logs failed", exc_info=True)
            return None

    def orchestration_tools(self):
        """Get orchestration tool details present in cluster.

        Returns:
            oozie_flag (str): Presence of oozie in cluster
            crontab_flag (str): Presence of crontab in cluster
            airflow_flag (str): Presence of airflow in cluster
        """

        try:
            orchestrate = subprocess.Popen(
                "oozie admin -status | grep mode",
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding="utf-8",
            )
            orchestrate, err = orchestrate.communicate()
            if "NORMAL" in orchestrate:
                oozie_flag = "oozie is enabled"
            else:
                oozie_flag = "oozie is not enabled"
            crontab = subprocess.Popen(
                "whereis -b crontab | cut -d' ' -f2 | xargs rpm -qf",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            crontab.wait(10)
            crontab, err = crontab.communicate()
            if crontab.find("cronie") == -1:
                crontab_flag = "crontab not installed"
            else:
                crontab_flag = "crontab is installed"
            airflow = subprocess.Popen(
                "airflow version 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            airflow.wait(10)
            airflow, err = airflow.communicate()
            if not airflow:
                airflow_flag = "airflow is not enabled"
            else:
                airflow_flag = "airflow is enabled"
            self.logger.info("orchestration_tools successful")
            return oozie_flag, crontab_flag, airflow_flag
        except Exception as e:
            self.logger.error("orchestration_tools failed", exc_info=True)
            return None

    def logging_tool(self):
        """Get logging tool details present in cluster.

        Returns:
            ddog (str): Presence of Datadog in cluster
            splunk (str): Presence of Splunk in cluster
            new_relic (str): Presence of Newrelic in cluster
            elastic_search (str): Presence of Elasticsearch in cluster
        """

        try:
            ddog = subprocess.Popen(
                "systemctl status datadog-agent 2>/dev/null | grep active",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            ddog.wait(10)
            out, err = ddog.communicate()
            if not out:
                ddog = "Datadog is not installed"
            else:
                ddog = "Datadog is installed"
            logging = subprocess.Popen(
                'find / -type f \( -iname "splunk" -o -iname "newrelic-infra.yml" -o -iname "elasticsearch.yml"\) 2>/dev/null',
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            )
            logging.wait(30)
            logging, err = logging.communicate()
            if logging.find("splunk") == -1:
                splunk = "Splunk not installed"
            else:
                splunk = "Splunk is installed"
            if logging.find("newrelic") == -1:
                new_relic = "Newrelic not installed"
            else:
                new_relic = "Newrelic is installed"
            if logging.find("elasticsearch") == -1:
                elastic_search = "Elasticsearch not installed"
            else:
                elastic_search = "Elasticsearch is installed"
            self.logger.info("logging_tool successful")
            return ddog, splunk, new_relic, elastic_search
        except Exception as e:
            self.logger.error("logging_tool failed", exc_info=True)
            return None

    def monitor_network_speed(self):
        """Get orchestration tool details present in cluster.

        Returns:
            oozie_flag (str): Presence of oozie in cluster
            crontab_flag (str): Presence of crontab in cluster
            airflow_flag (str): Presence of airflow in cluster
        """

        try:
            subprocess.Popen(
                "sed -i 's/\r//g' ./getload.sh 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()

            subprocess.Popen(
                "sh ./getload.sh 2>/dev/null 1>parse.csv",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait()
            df = pd.read_csv(
                "./parse.csv", names=["Index", "Received", "Transfer"], header=None
            )
            subprocess.Popen(
                "rm -rf ./parse.csv 2>/dev/null",
                shell=True,
                stdout=subprocess.PIPE,
                encoding="utf-8",
            ).wait(10)
            column1 = df["Received"]
            max_value_1 = (column1.max()) / 1024
            min_value_1 = (column1.min()) / 1024
            avg_value_1 = (column1.mean()) / 1024
            column2 = df["Transfer"]
            max_value_2 = (column2.max()) / 1024
            min_value_2 = (column2.min()) / 1024
            avg_value_2 = (column2.mean()) / 1024
            self.logger.info("monitor_network_speed successful")
            return (
                max_value_1,
                min_value_1,
                avg_value_1,
                max_value_2,
                min_value_2,
                avg_value_2,
            )
        except Exception as e:
            self.logger.error("monitor_network_speed failed", exc_info=True)
            return None
