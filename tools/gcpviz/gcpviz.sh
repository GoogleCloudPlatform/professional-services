#!/bin/sh

if [ ! -d /gcpviz/cai ] ; then
    echo "Missing directory /gcpviz/cai!"
    exit 1
fi

cd /gcpviz || exit 1
if [ ! -f graph.db ] ; then
    ./gcpviz -resource-inventory-file cai/resource_inventory.json -mode generate
fi

graph=$1
shift
./gcpviz -mode visualize "$@" > "cai/${graph}.gv"
dot -Kneato -Tsvg -Gdpi=60 "cai/${graph}.gv" -o "cai/${graph}.svg"
dot -Kneato -Tpng "cai/${graph}.gv" -o "cai/${graph}.png"
