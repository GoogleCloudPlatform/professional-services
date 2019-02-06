#!/bin/bash

#This script is used to install druid historical with its dependencies: java8, druid package, 
#and druid/hadoop extensions. This script has dependency on other configuration files which
#is pulled from the bucket defined by Terraform 

DOWNLOADDIR="/opt/druid"
readonly DRUIDVERSION="0.13.0-incubating" # Druid version
DRUIDBASEDIR="$${DOWNLOADDIR}/apache-druid-$${DRUIDVERSION}"
readonly DRUIDLOGSDIR="$${DRUIDBASEDIR}/log"
readonly DRUIDCONFIGDIR="$${DRUIDBASEDIR}/conf"
DRUIDURL="http://mirrors.estointernet.in/apache/incubator/druid/0.13.0-incubating/apache-druid-0.13.0-incubating-bin.tar.gz"
MYSQLURL="https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-java-5.1.47.zip"
MYSQLVER="5.1.47"
HADOOPVERSION="2.9.0"

#######################################
# Installs java8 from genuine oracle repository and also updates/upgrades the
# packages on system
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function install_java() {
  apt-get -y update && apt-get -y upgrade \
  && apt-get install -y default-jdk \
  && apt-get install -y unzip
}

#######################################
# Downloads the druid package, backup the common.runtime.properties file and download
# the already configured common.runtime.properties file from defined bucket by Terraform
# It is also responsible to pull the required extensions of hadoop and druid from its repository
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function get_druid() {
  mkdir -p $${DOWNLOADDIR} \
    && curl $${DRUIDURL} -o $${DRUIDBASEDIR}-bin.tar.gz \
    && cd $${DOWNLOADDIR} \
    && tar -xzf $${DRUIDBASEDIR}-bin.tar.gz 

 mv $${DRUIDCONFIGDIR}/druid/_common/common.runtime.properties $${DRUIDCONFIGDIR}/druid/_common/common.runtime.properties.backup \
    && gsutil cp gs://${bucket}/common.runtime.properties $${DRUIDCONFIGDIR}/druid/_common/

  cd $${DRUIDBASEDIR}

  java -cp "lib/*" \
      -Ddruid.extensions.directory="extensions" \
      -Ddruid.extensions.hadoopDependenciesDir="hadoop-dependencies" \
      org.apache.druid.cli.Main tools pull-deps --no-default-hadoop --clean \
      -h "org.apache.hadoop:hadoop-client:$${HADOOPVERSION}" \
      -h "org.apache.hadoop:hadoop-hdfs:$${HADOOPVERSION}" \
      -c "org.apache.druid.extensions:druid-hdfs-storage:$${DRUIDVERSION}" \
      -c "org.apache.druid.extensions:druid-kafka-eight:$${DRUIDVERSION}" \
      -c "org.apache.druid.extensions:mysql-metadata-storage:$${DRUIDVERSION}" \
      -c "org.apache.druid.extensions.contrib:druid-google-extensions:$${DRUIDVERSION}" \
      -c "org.apache.druid.extensions.contrib:druid-distinctcount:$${DRUIDVERSION}"

  curl -L $${MYSQLURL} -o mysql-$${MYSQLVER}.zip \
  && unzip mysql-$${MYSQLVER}.zip \
  && mv mysql-connector-java-$${MYSQLVER}/mysql-connector-java-$${MYSQLVER}.jar $${DRUIDBASEDIR}/extensions/mysql-metadata-storage
}

#######################################
# Downloads the configuration files and gcs-connector-hadoop2 jar file of DataProc 
# from bucket defined by Terraform to the target druid node
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function get_dataproc_files(){
  gsutil cp gs://${bucket}/config/core-site.xml  $${DRUIDCONFIGDIR}/druid/_common \
    && gsutil cp gs://${bucket}/config/hdfs-site.xml $${DRUIDCONFIGDIR}/druid/_common \
    && gsutil cp gs://${bucket}/config/mapred-site.xml $${DRUIDCONFIGDIR}/druid/_common \
    && gsutil cp gs://${bucket}/config/yarn-site.xml $${DRUIDCONFIGDIR}/druid/_common \
    && gsutil cp gs://${bucket}/config/gcs-connector-hadoop2* $${DRUIDBASEDIR}/extensions/druid-google-extensions \
    && gsutil cp gs://${bucket}/config/gcs-connector-hadoop2* $${DRUIDBASEDIR}/lib
}

#######################################
# Create the log directory for logging and change the number of threads in runtime.properties file
# of historical and middleManager to be able to run on desired machine configuration.
# It also defines the bucket in which logs must be stored in middleManager/runtime.properties and 
# run the historical service
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################


function configure_run_druid() {
  mkdir -p $${DRUIDLOGSDIR}
  mkdir -p $${DRUIDCONFIGDIR}/druid/router
  mkdir /var/tmp

  cat > $${DRUIDCONFIGDIR}/druid/router/jvm.config << EOF
-server
-Xmx13g
-Xms13g
-XX:NewSize=256m
-XX:MaxNewSize=256m
-XX:+UseConcMarkSweepGC
-XX:+PrintGCDetails
-XX:+PrintGCTimeStamps
-XX:+UseLargePages
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/tmp/galaxy/deploy/current/
-Duser.timezone=UTC
-Dfile.encoding=UTF-8
-Djava.io.tmpdir=/var/tmp

-Dcom.sun.management.jmxremote.port=17071
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
EOF


  cat > $${DRUIDCONFIGDIR}/druid/router/runtime.properties << EOF
druid.plaintextPort=8080
druid.service=druid/router

druid.router.tierToBrokerMap={"_default_tier":"druid/broker"}
druid.router.http.numConnections=50
druid.router.http.readTimeout=PT5M

# Number of threads used by the router proxy http client
druid.router.http.numMaxThreads=100
druid.server.http.numThreads=100
EOF

cd $${DRUIDBASEDIR} 

java $(cat $${DRUIDCONFIGDIR}/druid/router/jvm.config | xargs) -cp "$${DRUIDCONFIGDIR}/druid/_common:$${DRUIDCONFIGDIR}/druid/router:lib/*:$${DRUIDBASEDIR}/hadoop-dependencies/hadoop-client/$${HADOOPVERSION}/*" org.apache.druid.cli.Main server router > $${DRUIDLOGSDIR}/router.log 2>&1 &

}

main(){
if [[ ! -f ~/startup-flag ]]; then #startup-flag file used as a flag to run only once as initialization script
  install_java
  get_druid
  get_dataproc_files
  configure_run_druid
  
  touch ~/startup-flag
fi
}

main
