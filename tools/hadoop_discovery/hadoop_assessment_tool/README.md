# Hadoop Assessment Tool

This tool is developed to enable detailed Assessment and automated assessment of Hadoop clusters. It helps measure the migration efforts from the current Hadoop cluster. It generates a PDF report with information related to the complete cluster according to different categories.

Following are the specific categories: 

1. Hardware & OS Footprint
2. Framework & Software Details
3. Data & Security
4. Network & Traffic
5. Operations & Monitoring
6. Application

## Tool Functionality

The Hadoop Assessment tool is built to analyze the on-premise Hadoop environment based on various factors/metrics. 

![Alt text](architectural_diagram.png?raw=true)


1. This python-based tool will use Cloudera API, Generic - YARN API, and OS based CLI request to retrieve information from the Hadoop cluster
2. Information from the APIs will come in the form of JSON files
3. Information from CLI command request will be outputs stored in variables
4. With the help of Python parsing methods, required insights about the features will be retrieved
5. As an output of tool execution, a PDF report will be generated which will contain information about all the features
6. Script will also generate a log file, which will contain execution information & errors (if any)

## Prerequisites
1. The tool runs only on one of the **master nodes**
2. This tool supports the following **Python versions**
   1. python 3.6
   2. python 3.7
   3. python 3.8
3. This tool supports the following Cloudera versions:
   1. CDH 5.16.2 and above
   2. CDH 6.x
   3. CDH 7.x
4. This tool runs on the following Linux flavours:
   1. Centos 7 and above
   2. Redhat 7 and above
   3. Debian 9 and above
   4. Ubuntu 16 and above
   5. Sles 12sp5 and above
5. This tool requires pip installed.
6. This tool requires an updated command line package manager before running the script. This will update the package list for the packages to be upgraded, from the operating system’s central repository. The package manager can be upgraded with the help of the below respective OS commands:
    1. Redhat/Centos:
       ```bash
        yum -y update && upgrade
       ```
    2. Ubuntu/Debian:
       ```bash
        sudo apt-get update
       ```
    3. Open Suse:
       ```bash
         sudo zypper update
       ```
7. Cloudera manager user should have one of the following roles:
   
   | Hadoop Version | Roles |
   |-----------------|:-------------|
   | CDH 5.16.2 | Dashboard User, User Administrator, Full Administrator, Operator, BDR Administrator, Cluster Administrator, Limited Operator, Configurator, Read-Only, Auditor, Key Administrator, Navigator Administrator |
   | CDH 6.x | Dashboard User, User Administrator, Full Administrator, Operator, BDR Administrator, Cluster Administrator, Limited Operator, Configurator, Read-Only, Auditor, Key Administrator, Navigator Administrator |
   | CDH 7.x | Auditor, Cluster Administrator, Configurator, Dashboard User, Full Administrator, Key Administrator, Limited Cluster Administrator, Limited Operator, Navigator Administrator, Operator, Read Only, Replication Administrator, User Administrator |

8. Following OS packages will be installed to generate metrics: 
   1. Tool checks if each package is already installed
   2. If the package is not already installed, it will install from a local repo
   3. If it is not present in the local repo, then it will download it from the internet

   | Package | Package Description |
   |-----------------|:-------------|
   | Python-dev | package contains the header files and dependent packages which need to fabricate python augmentations. Hence, those files and packages need to be on the system in such a way that they can be found while running the script |
   | Gcc gcc-c++ | The package is used in python pandas functions which are used to build data frames in the script. |
   | unixODBC-devel | The package is used to define a database-neutral interface to connect relational databases. |
   | cyrus-sasl-devel | The package is used to connect with the hive metastore which helps in the retrieval of features related to the hive. |
   | Nload | The package is a third-party monitoring tool used for the system monitoring and checking ingress-egress-related information. |
   | Vnstat | A package is a third-party tool, used to check network utilization over a period of time. |
   | Iostat | The package is used for monitoring system input/output statistics for devices and partitions. |
   | Libsasl2-dev (ubuntu specific) | To install python3-venv in Ubuntu, libsasl2-dev packages will be installed as ubuntu does not provide venv inside a python package. |
9. This tool comes with below python packages and will be locally installed in ephemeral python virtual environment:
   
   | Python packages in tool | Python packages in tool | Python packages in tool |
   |-----------------|:-------------|:-------------|
   |certifi==2020.12.5|chardet==4.0.0|cycler==0.10.0|
   |DateTime==4.3|fpdf==1.7.2|greenlet==1.0.0|
   |idna==2.10|importlib-metadata==3.7.3|kiwisolver==1.3.1|
   |matplotlib==3.3.4|numpy==1.19.5|pandas==1.1.5|
   |Pillow==8.1.2|psycopg2-binary==2.8.6|PyMySQL==1.0.2|
   |pyodbc==4.0.30|pyparsing==2.4.7|python-dateutil==2.8.1|
   |pytz==2021.1|requests==2.25.1|scipy==1.5.4|
   |seaborn==0.11.1|six==1.15.0|SQLAlchemy==1.3.22|
   |tqdm==4.59.0|typing-extensions==3.7.4.3|urllib3==1.26.4|
   |virtualenv==15.1.04|zipp==3.4.1|zope.interface==5.2.0|
   |wheel=0.36.2|pip=21.0.1|cffi=1.14.5|
   |cryptography==3.4.7|pycparser=2.20||

10. Detail execution information will be logged in the log file, which will be present at location:
`./hadoop_assessment_tool_{YYYY-MM-DD_HH:MM:SS}.log`
11. After a successful tool execution, a PDF report will be generated at the location:
` ./hadoop_assessment_report_{YYYY-MM-DD_HH-MM-SS}.pdf`

## User Input Requirements
1. The tool needs the below permissions to run the code and generate the PDF report:
    1. Sudo permission on the node.
    2. Cloudera Manager(User should have one of the roles mentioned in 3.1.7)
        1. Host IP
        2. Port Number
        3. User Name
        4. Password
        5. Cluster Name
    3. Hive Metastore
        1. User Name
        2. Password
    4. Kafka
        1. Number of brokers
        2. Host Name of each broker
        3. IP of each broker
        4. Port number of each broker
        5. Log directory path of each broker
    5. SSL is enabled or not(conditional input - if automatic detection doesn't work it will be prompted)
    6. Yarn (conditional input - if automatic detection doesn't work it will be prompted)
        1. Resource managers hostname or IP address
        2. Port Number

## Installation Steps

1. **Step 1**: Upload the Tarball  in the MasterNode of the cluster. It can be uploaded in multiple ways, one of them being with the help of SCP command between the local machine and node or by using tools like Winscp if the local system is windows.

2. **Step 2**: Go to the Tarball location (the location where it was uploaded in Step 1)

3. **Step 3**: Extract the Tarball **hadoop_assessment_tool.tar**

```bash
tar -xvf hadoop_assessment_tool.tar
```

4. **Step 4**: Go to the **hadoop_assessment_tool** directory

```bash
cd hadoop_assessment_tool
```
5. **Step 5**: Give **execute** permission to the scripts 

```bash
chmod +x build.sh
chmod +x run.sh
chmod +x os_package_installer.py
chmod +x python_package_installer.py
```
6. **Step 6**: Run the first script called **build.sh** for building the environment, using the following command
```bash
sudo bash build.sh
```
**Step success message: Hadoop Assessment tool deployed successfully**

7. **Step 7**: Run the second script to run the python script, using the command
```bash
sudo bash run.sh
```
**Step success criteria: Hadoop Assessment Tool has been successfully completed and the report is available at the following location**

8. **Step 8**: Following details would be required for further execution of the script:
    1. **Step 8.1(Conditional step) - SSL:**  If the tool is unable to automatically detect SSL enabled on the cluster, it would display the following message
       ```bash
       Do you have SSL enabled for your cluster? [y/n]
       ```
       1. **Step 8.1.1:** If you select **'y'**, continue to Step 8.2 -
          ```bash
           As SSL is enabled, enter the details accordingly
          ```
       2. **Step 8.1.2:** If you select **'n'**, continue to Step 8.2 -
          ```bash
           As SSL is disabled, enter the details accordingly
          ```
    2. **Step 8.2 - Cloudera Manager credentials:** the prompt would ask you if you want to provide the Cloudera Manager credentials, you would have to select **'y'** or **'n'**
       1. **Step 8.2.1:** If you select **'y'**, continue to Step 8.2.1.1 -
          ```bash
           A major number of metrics generation would require Cloudera manager credentials Therefore, would you be able to provide your Cloudera Manager credentials? [y/n]: 
          ```
          1. **Step 8.2.1.1:** Enter Cloudera Manager Host IP
             ```bash
             Enter Cloudera Manager Host IP:
             ```
          2. **Step 8.2.1.2:** Cloudera Manager Port - the prompt would ask you if your  Cloudera Manager Port is 7180. If true select **'y'** else select **'n'**

             ```bash
             Enter Cloudera Manager Host IP:
             ```
             1. **Step 8.2.1.2.1:** If you select **'y'**, continue to Step 8.2.1.3
                ```bash
                Is your Cloudera Manager Port number 7180? [y/n]: 
                ```
             2. **Step 8.2.1.2.2:** If you select **'n'**, continue to Step 8.2.1.2.2
                ```bash
                Is your Cloudera Manager Port number 7180? [y/n]: 
                ```
             3. **Step 8.2.1.2.3:** Since the port number is not 7180, enter your Cloudera Manager Port number
                ```bash
                Enter your Cloudera Manager Port number: 
                ```
          3. **Step 8.2.1.3:** Cloudera Manager username
             ```bash
             Enter Cloudera Manager username:
             ```
          4. **Step 8.2.1.4:** Cloudera Manager password 
             ```bash
             Enter Cloudera Manager password:
             ```
          5. **Step 8.2.1.5:** Select the Cluster
             ```bash
             Select the cluster from the list below:
             1] Cluster 1
             2] Cluster 2
              .
              .
             n] Cluster n
             Enter the serial number (1/2/../n) for the selected cluster name:
             ```
       2. **Step 8.2.2:** If you select **'n'**, continue to Step 8.4
          ```bash
           A major number of metrics generation would require Cloudera manager credentials Therefore, would you be able to provide your Cloudera Manager credentials? [y/n]: 
          ```
    3. **Step 8.3: Hive Metastore credentials** - This would only be prompted if  Cloudera Manager credentials were provided in the previous step. The prompt would ask you if you want to provide Hive Metastore credentials, you would have to select **'y'** or **'n'**
       1. **Step 8.3.1:** If you select **'y'**, continue to Step 8.3.1.1
          ```bash
           To view hive-related metrics, would you be able to enter Hive credentials?[y/n]: 
          ```
          1. **Step 8.3.1.1:** Hive Metastore username - the prompt would ask you to enter your Hive Metastore username
             ```bash
              Enter Hive Metastore username: hive
             ```
          2. **Step 8.3.1.2:** Hive Metastore password - the prompt would ask you to enter your Hive Metastore password
             ```bash
               Enter Hive Metastore password:
             ```
       2. **Step 8.3.2:** If you select ‘n’, continue to the next step
          ```bash
           To view hive-related metrics, would you be able to enter Hive credentials?[y/n]: 
          ```
    4. **Step 8.4 (Conditional step) - YARN Configurations:** If the tool is unable to automatically detect YARN configurations, it would prompt you to enter Yarn credentials,  you would have to select **'y'** or **'n'**
       1. **Step 8.4.1:** If you select **'y'**, continue to Step 8.4.1.1 
          ```bash
           To view yarn-related metrics, would you be able to enter Yarn credentials?[y/n]:
          ```
          1. **Step 8.4.1.1:** Enter Yarn Resource Manager Host IP or Hostname:
             ```bash
              Enter Yarn Resource Manager Host IP or Hostname:
             ```
          2. **Step 8.4.1.2:** Enter Yarn Resource Manager Port:
             ```bash
              Enter Yarn Resource Manager Port:
             ```
       2. **Step 8.4.2:** If you select **'n'**, continue to Step 8.5
          ```bash
           To view yarn-related metrics, would you be able to enter Yarn credentials?[y/n]:
          ```
    5. **Step 8.5: Kafka credentials -** the prompt would ask you whether you want to enter your Kafka credentials; you would have to select **'y'** or **'n'**
    <br>WARNING: If a user enters wrong inputs, the tool doesn’t prompt for invalid user inputs. 
       1. **8.5.1:** If you select **'y'**, continue to Step 8.5.1.1
          ```bash
           To view Kafka-related metrics, would you be able to provide Kafka credentials?[y/n]: 
          ```
          1. **Step 8.5.1.1:** Number of brokers in Kafka
             ```bash
              Enter the number of Kafka brokers:
             ```
          2. **Step 8.5.1.2:** Enter the hostname and port name of each broker
(n times) - iterated for the number of brokers present
              1. **Step 8.5.1.2.1:** Hostname or IP of Broker n1
                 ```bash
                 Enter the hostname or IP of broker n1:
                 ```
              2. **Step 8.5.1.2.2:** Port Number of Broker- the prompt would ask you if the broker has the port number 9092. If it is 9092, select **'y'** else select **'n'** 
                 ```bash
                 Enter the hostname or IP of broker n1:
                 ```
                 1. **Step 8.5.1.2.2.1:** If you select **'y'**, continue to Step 8.5.1.2.3
                    ```bash
                    Is your broker hosted on <broker_name> have port number 9092? [y/n]:
                    ```
                 2. **Step 8.5.1.2.2.2:** If you select **'n'**, continue to next step
                    ```bash
                    Is your broker hosted on <broker_name> have port number 9092? [y/n]:
                    ```
                 3. **Step 8.5.1.2.2.3:** Since the port number is not 9092, enter the port number of broker n1, enter a valid port number
                    ```bash
                    Please enter the port number of broker hosted on <broker_name>
                    ```
             3. **Step 8.5.1.2.3:** Confirm the log directory path of the broker - the prompt would ask you if the broker is on a certain log directory path, you will have to confirm the path. If the given path is correct, select **'y'** or **'n'**
                 1. **Step 8.5.1.2.3.1:** If you select **'y'** and there are more brokers left, steps from 8.5.1.2 would be repeated
                    ```bash
                    Does the broker hosted on  <broker_name> have the following path to the log directory path/var/local/kafka/data/?[y/n]: 
                    ```
                 2. **Step 8.5.1.2.3.2:** If you select **'n'**, continue to the next step
                    ```bash
                    Does the broker hosted on <broker_name> have the following path to the log directory path/var/local/kafka/data/?[y/n]:
                    ```
                 3. **Step 8.5.1.2.3.3:** Since the port number path was different
                    ```bash
                    Enter the log directory path of broker hosted on <broker_name>:
                    ```
             1. **Step 8.5.2:** If you select **'n'**, continue to Step 8.6
                ```bash
                To view kafka-related metrics, would you be able to enter Kafka credentials?[y/n]: 
                 ```
   6. **Step 8.6:** Date range for the Assessment report - Select one of the below options for a date range to generate the report for this time period
      ```bash
      Select the time range of the PDF Assessment report from the options below:
      [1] Week: generates the report from today to 7 days prior
      [2] Month: generates the report from today to 30 days prior
      [3] Custom: generates the report for a custom time period
      Enter the serial number [1/2/3] as required:
      ```
      1. If you select 1 and 2, the report automatically gets generated based on the selected range as per the description.
      2. If you select 3, here’s the prompt that appears, Important note: Please enter the timing details according to the timezone of the tool hosting node:
         ```bash
         Enter start date: [YYYY-MM-DD HH:MM]
         2021-03-15 00:00
         Enter end date: [YYYY-MM-DD HH:MM]
         2021-03-30 00:00
         ```
9. **Step 9:** PDF Report - A PDF report will be generated at the end of successful execution, which can be downloaded with the help of the same SCP client or WinSCP tool with the help of which we uploaded the tar in Step1.

## Contributing



## License