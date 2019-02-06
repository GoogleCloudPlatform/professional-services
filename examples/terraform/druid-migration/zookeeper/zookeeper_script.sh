# Downloads Zookeeper from provided URL, extracts, configures it with cluster name address,
# and runs

ZOOKEEPER_VER=3.4.10
ZOOKEEPER_BASEDIR="/opt/zookeeper/zookeeper-$${ZOOKEEPER_VER}"
ZOOKEEPER_CONFIGDIR="$${ZOOKEEPER_BASEDIR}/conf"
ZOOKEEPER_URL="http://www.gtlib.gatech.edu/pub/apache/zookeeper/zookeeper-3.4.10/zookeeper-3.4.10.tar.gz"

function get_java() {
  apt-get -y update && apt-get -y upgrade \
  && apt-get install -y default-jdk
}

function get_zookeeper() {
  sudo mkdir -p $${ZOOKEEPER_BASEDIR}/data/zookeeper \
    && sudo curl $${ZOOKEEPER_URL} -o /opt/zookeeper-$${ZOOKEEPER_VER}.tar.gz \
    && sudo tar -xzf /opt/zookeeper-3.4.10.tar.gz --directory /opt/zookeeper
}

#######################################
# Configures zoo.cfg file with zookeeper cluster ip address provided by Terraform
# Creates $${ZOOKEEPER_BASEDIR}/data/zookeeper/myid with the provided by Terraform
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################

function conf_run_zookeeper() {
  sudo cp $${ZOOKEEPER_CONFIGDIR}/zoo_sample.cfg $${ZOOKEEPER_CONFIGDIR}/zoo.cfg \
    && sudo bash -c "cat /usr/share/zookeeper.id > $${ZOOKEEPER_BASEDIR}/data/zookeeper/myid" \
    && sudo sed -i "s|/tmp|$${ZOOKEEPER_BASEDIR}/data|g" $${ZOOKEEPER_CONFIGDIR}/zoo.cfg \
    && echo "server.1=${zookeeper0}:2888:3888" >> $${ZOOKEEPER_CONFIGDIR}/zoo.cfg \
    && echo "server.2=${zookeeper1}:2888:3888" >> $${ZOOKEEPER_CONFIGDIR}/zoo.cfg \
    && echo "server.3=${zookeeper2}:2888:3888" >> $${ZOOKEEPER_CONFIGDIR}/zoo.cfg \
    && $${ZOOKEEPER_BASEDIR}/bin/./zkServer.sh start
}

#######################################
# Removes downloaded Zookeeper tar file
# Globals:
#   None
# Arguments:
#   None
# Returns:
#   None
#######################################


function cleanup() {
 sudo rm -rf /opt/zookeeper-$${ZOOKEEPER_VER}.tar.gz
}

main() {
if [[ ! -f ~/startup-flag ]]; then #startup-flag file used as a flag to run only once as initialization script
  get_java
  get_zookeeper
  conf_run_zookeeper
  cleanup

  touch ~/startup-flag
fi
}

main
