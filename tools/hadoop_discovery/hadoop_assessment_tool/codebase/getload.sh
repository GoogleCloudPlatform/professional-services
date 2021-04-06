#!bin/bash
cd /sys/class/net/$(route | grep default | awk '{print $NF}')/statistics/
end=$((SECONDS+10));
old_rx="$(<//sys/class/net/$(route | grep default | awk '{print $NF}')/statistics/rx_bytes)"
old_tx="$(</sys/class/net/$(route | grep default | awk '{print $NF}')/statistics/tx_bytes)"
while $(sleep 1); do
        if [ $SECONDS -lt $end ]; then
                now_rx=$(<rx_bytes);
                now_tx=$(<tx_bytes);
                echo 1,$(($(expr "${now_rx}" - "${old_rx}"))),$(($(expr "${now_tx}" - "${old_tx}")));
                old_rx=$now_rx;
                old_tx=$now_tx;
        else
                break
        fi
done