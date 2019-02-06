# Downloads Kafka from provided URL, extracts, configures with Zookeeper IP
# and runs

KAFKA_VER="2.11-0.10.2.0"
KAFKA_BASEDIR="/opt/kafka/kafka_$${KAFKA_VER}"
KAFKA_CONFIGDIR="$${KAFKA_BASEDIR}/config"
KAFKA_URL="https://archive.apache.org/dist/kafka/0.10.2.0/kafka_2.11-0.10.2.0.tgz"

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

function get_java() {
  apt-get -y update && apt-get -y upgrade \
  && apt-get install -y default-jdk
}

#######################################
# Downloads kafka packages and extracts on the system
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function get_kafka() {
  mkdir -p $${KAFKA_BASEDIR} \
    && curl $${KAFKA_URL} -o /opt/kafka_$${KAFKA_VER}.tgz \
    && tar -xzf /opt/kafka_$${KAFKA_VER}.tgz --directory /opt/kafka
}

#######################################
# Configures server.properties file with zookeeper cluster ip address provided by Terraform
# Creates a random broker id between 0-50, starts the service, and logs in /var/log.kafka.log 
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function conf_run_kafka() {
  sed -i 's|zookeeper.connect=localhost:2181||g' $${KAFKA_CONFIGDIR}/server.properties \
    && echo 'zookeeper.connect=${zookeeper0}:2181,${zookeeper1}:2181,${zookeeper2}:2181' \
        >> $${KAFKA_CONFIGDIR}/server.properties \
    && broker=$(shuf -i 0-50 -n 1) \
    &&  sed -i "s/broker.id=0/broker.id=$broker/" \
        $${KAFKA_CONFIGDIR}/server.properties \
    && $${KAFKA_BASEDIR}/bin/kafka-server-start.sh \
        $${KAFKA_CONFIGDIR}/server.properties > /var/log/kafka.log 2>&1 &
}


#######################################
# Removes downloaded Kafka tar file
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function cleanup() {
 sudo rm -rf /opt/kafka/kafka_$${KAFKA_VER}.tar.gz
}

main(){
if [[ ! -f ~/startup-flag ]]; then #startup-flag file used as a flag to run only once as initialization script
  get_java
  get_kafka
  conf_run_kafka
  cleanup

  touch ~/startup-flag
fi
}

main
