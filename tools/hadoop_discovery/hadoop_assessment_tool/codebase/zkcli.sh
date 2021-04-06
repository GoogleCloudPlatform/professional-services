#!/bin/bash
$(find / -path '*/zookeeper/bin/zkCli.sh' 2>/dev/null)  -server  $(grep 'zookeeper.connect'  /etc/kafka/conf/kafka-client.conf | cut -d=   -f2)  ls /brokers/ids