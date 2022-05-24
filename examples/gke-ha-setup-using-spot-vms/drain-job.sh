#!/bin/bash

# get names of all nodes which are not pre-spot (and therefore on-demand)
nodes_to_drain_arr=$(kubectl get nodes --selector='!cloud.google.com/gke-spot' -o=custom-columns=NAME:.metadata.name


for node_name in $nodes_to_drain_arr; do
# avoid using NAME headline as node name
  if [ "$node_name" != "NAME" ]; then 
    echo "Attempting to drain $node_name from spot pods"
    kubectl drain "$node_name" --pod-selector=run=my-app --delete-emptydir-data
  fi
done

for node_name in $nodes_to_drain_arr; do
# avoid using NAME headline as node name
  if [ "$node_name" != "NAME" ]; then 
    echo "Uncordoning $node_name"
    kubectl uncordon "$node_name"
  fi
done