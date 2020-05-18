#!/usr/bin/env bash

#IP of authtest(server)
export AUDIENCE="http://10.1.0.3:8080"

# Obtain a token from compute engine instance metadata server
tokenenc=$(curl -H "Metadata-Flavor: Google" "http://metadata/computeMetadata/v1/instance/service-accounts/
           default/identity?audience=${AUDIENCE}&format=full" 2>/dev/null)

echo $tokenenc

curl --data "$tokenenc" $AUDIENCE/secret


