#!/bin/bash

  #
  # use a ServicePrincipal generated with:  'az ad sp create-for-rbac --skip-assignment'
  # SERVICE_PRINCIPAL - servicePrincipal (eg: http://azure-cli-2019-05-30-02-32-45)
  # PRINCIPAL_PASSWORD - password (servicePrincipal generated password eg: mysuper-strong-password )
  # TENANT_ID - tenant (eg: 0346f366-9764-45a9-567e4-4389347808)
  #


if [[ $(kubectl config current-context 2> /dev/null) == "" ]]; then
  az login --service-principal -u $SERVICE_PRINCIPAL -p $PRINCIPAL_PASSWORD --tenant $TENANT_ID

  az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME

  ##kubectl config use-context $CLUSTER_NAME
fi

echo "Running: kubectl $@" >&2
exec kubectl "$@"
