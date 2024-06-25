# The Azure CLI Builder

The az builder step can execute an azure CLI command using the specified ServicePrincipal on a remote AzureCloud tenant.

Three environment variables are necessary to complete the 'az login'.

* SERVICE_PRINCIPAL
* PRINCIPAL_PASSWORD
* TENANT_ID

One can create a service principal using the following commands;

az ad sp create-for-rbac --name ServicePrincipalName

Ensure you grant the required Roles to the servicePrincipal so that it can complete the task during the build.

The displayed JSON contains the values needed for the environment variables;

"name": "http://azure-cli-2019-06-01-18-04-35" is the SERVICE_PRINCIPAL
"password": "86466-34556f3-174a-8745-35e896c45" is the PRINCIPAL_PASSWORD
"tenant": "0835686-7345-9005-a567-92223645f" is the TENANT_ID


