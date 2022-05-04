#!/bin/sh

# get names of all nodes which are not spot (and therefore on-demand)
echo "Starting drain script (every 15 mins)"
nodes_to_drain_arr=$(kubectl get nodes --selector='!cloud.google.com/gke-spot' -o=custom-columns=NAME:.metadata.name);


for node_name in $${nodes_to_drain_arr[@]}; do
    # avoid using NAME headline as node name
    if [ "$node_name" != "NAME" ]; then 
        echo "Attempting to drain $node_name from app pods"
        kubectl drain $node_name --pod-selector=my-app-1 --delete-emptydir-data
        kubectl drain $node_name --pod-selector=my-app-2 --delete-emptydir-data
        kubectl drain $node_name --pod-selector=my-app-n --delete-emptydir-data
    fi
done

# make drained nodes available for use again
for node_name in $${nodes_to_drain_arr[@]}; do
    # avoid using NAME headline as node name
    if [ "$node_name" != "NAME" ]; then 
        echo "Uncordoning $node_name"
        kubectl uncordon $node_name
    fi
done