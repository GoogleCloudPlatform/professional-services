#!/bin/bash

az login --service-principal -u $SERVICE_PRINCIPAL -p $PRINCIPAL_PASSWORD --tenant $TENANT_ID

echo "Running: az $@" >&2
exec az "$@"
