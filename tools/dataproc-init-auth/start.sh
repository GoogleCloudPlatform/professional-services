#!/usr/bin/env bash

# starts the server
export PROJECT={project}
export ZONE={zone}
export BIND_ADDR=$(hostname -i)
export AUDIENCE=http://$BIND_ADDR:8080
java -cp "$(pwd)/*" com.google.cloud.dataproc.auth.AuthService

