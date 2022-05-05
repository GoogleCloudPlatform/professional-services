#!/bin/bash

# get names of all nodes which are not pre-emptible (and therefore on-demand)
nodes_to_drain_arr=$(kubectl get nodes --selector='!cloud.google.com/gke-preemptible' -o=custom-columns=NAME:.metadata.name)


for node_name in nodes_to_drain_arr; do
# avoid using NAME headline as node name
  if [ "$node_name" != "NAME" ]; then 
    echo "Attempting to drain $node_name from preemptible pods"
    kubectl drain $node_name --pod-selector=app=core-init --delete-emptydir-data
    kubectl drain $node_name --pod-selector=app=core-init-failed --delete-emptydir-data
    kubectl drain $node_name --pod-selector=app=core-init-tomorrow --delete-emptydir-data
    kubectl drain $node_name --pod-selector=app=core-default --delete-emptydir-data
    kubectl drain $node_name --pod-selector=app=core-reader --delete-emptydir-data
  fi
done

for node_name in nodes_to_drain_arr; do
# avoid using NAME headline as node name
  if [ "$node_name" != "NAME" ]; then 
    echo "Uncordoning $node_name"
    kubectl uncordon $node_name
  fi
done