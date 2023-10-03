#!/bin/bash

# The script takes three arguments
# 1. (p) project_id where composer is deployed
# 2. (l) location where composer is deployed 
# 3. (e) environment id of the composer

# The script estimates the min workers and max workers based on the metrics. 
# Make sure it is valid/aplies for you installation (by deploying in lower environments))
# The script downloads the the airflow.cfg. Copies the relevant information to new environment
usage()
{
    echo "usage: terraform-generate.sh options:<p|l|e>"
}
project=''
location=''
environment=''
while getopts p:l:e: flag
do
    case "${flag}" in
        p) project=${OPTARG};;
        l) location=${OPTARG};;
        e) environment=${OPTARG};;
        *) usage
           exit;;
    esac
done

[[ $project == "" || $location == "" || $environment == ""  ]] && { usage; exit 1; }

export project_id=$project
export location=$location
export environment_name=$environment
export existing_config='composer.properties'

rm $existing_config
touch $existing_config

# Pull Time Series Data for Task Counts
envsubst < query_task_template.json > query_task.json
TOKEN=$(gcloud auth print-access-token)
curl -d @query_task.json -H "Authorization: Bearer $TOKEN" \
--header "Content-Type: application/json" -X POST \
https://monitoring.googleapis.com/v3/projects/"$project_id"/timeSeries:query | jq .timeSeriesData | jq -r ".[] | .pointData" | jq -r ".[].values[0].int64Value" > task_counts.txt
total=0

while read -r line
do
    ((total += line)) 
done < task_counts.txt

airflow_config=$(gcloud composer environments describe "$environment_name" --location "$location" --format json)

# Determine Min/Max Workers
dag_gcs_prefix=$(echo "$airflow_config" | jq .config.dagGcsPrefix | tr -d '"' | cut -d "/" -f3)
gsutil cp gs://"$dag_gcs_prefix"/airflow.cfg .
worker_concurrency=$(gsutil cat gs://"$dag_gcs_prefix"/airflow.cfg | grep worker_concurrency | cut -d "=" -f2)
min_workers=$((total/worker_concurrency))
echo "min_workers=$((total/worker_concurrency))" >> $existing_config

max_workers=$(echo "$airflow_config" | jq .config.nodeCount)

if [[ $max_workers -lt $min_workers ]]
then
max_workers=$min_workers+1
fi

echo "max_workers=$max_workers" >> $existing_config

# Collect PyPi Package List
pypi_packages=$(echo "$airflow_config" | jq -c .config.softwareConfig.pypiPackages)
echo "pypi_packages=$pypi_packages" >> $existing_config

# Determine Environment Size
environment_size='ENVIRONMENT_SIZE_SMALL'
scheduler_count=1
scheduler_cpu=0.5
scheduler_mem=2
scheduler_storage=1
trigger_count=1
trigger_cpu=0.5
trigger_mem=0.5
web_server_cpu=0.5
web_server_mem=2
web_server_storage=1
worker_cpu=0.5
worker_mem=2
worker_storage=1

number_of_dags=$(gcloud composer environments run "$environment" --location "$location" dags report | grep 'Number of DAGs:' | tr -dc '0-9')

if [ "$number_of_dags" -gt 50 ] && [ "$number_of_dags" -lt 250 ]
then
environment_size='ENVIRONMENT_SIZE_MEDIUM'
scheduler_count=2
scheduler_cpu=2
scheduler_mem=7.5
scheduler_storage=5
trigger_count=1
trigger_cpu=0.5
trigger_mem=0.5
web_server_cpu=2
web_server_mem=7.5
web_server_storage=5
worker_cpu=2
worker_mem=7.5
worker_storage=5
fi

if [ "$number_of_dags" -gt 250 ]
then
environment_size='ENVIRONMENT_SIZE_LARGE'
scheduler_count=2
scheduler_cpu=4
scheduler_mem=15
scheduler_storage=10
trigger_count=1
trigger_cpu=0.5
trigger_mem=0.5
web_server_cpu=2
web_server_mem=7.5
web_server_storage=10
worker_cpu=4
worker_mem=15
worker_storage=10
fi
echo "environment_size=$environment_size" >> $existing_config

# use environment size to determine triggerer, scheduler, worker sizes

# Get Scheduler Count
scheduler_count=$(echo "$airflow_config" | jq .config.softwareConfig.schedulerCount)
echo "schedulerCount=$scheduler_count" >> $existing_config

# Get Service Account
service_account=$(echo "$airflow_config" | jq .config.nodeConfig.serviceAccount)
echo "serviceAccount=$service_account" >> $existing_config

# Get Networking
vpc_network=$(echo "$airflow_config" | jq .config.nodeConfig.network)
echo "defaultNetwork=$vpc_network" >> $existing_config

# Build Terraform Var File
rm terraform/"$environment_name".tfvars
cp terraform/sample.tfvars terraform/"$environment_name".tfvars

sed -i '' "s|%%PROJECT_ID%%|$project_id|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%REGION%%|$location|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%ENVIRONMENT_NAME%%|$environment_name|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%ENVIRONMENT_SIZE%%|$environment_size|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%SERVICE_ACCOUNT%%|$service_account|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%VPC_NETWORK%%|$vpc_network|g" "terraform/$environment_name.tfvars"

if [ "$pypi_packages" != "null" ]; then
    sed -i '' "s|%%PYPI_PACKAGES%%|$pypi_packages|g" "terraform/$environment_name.tfvars"
else
    sed -i '' "s|%%PYPI_PACKAGES%%|{}|g" "terraform/$environment_name.tfvars"
fi

sed -i '' "s|%%WORKER_CPU%%|$worker_cpu|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%WORKER_MEM%%|$worker_mem|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%WORKER_STORAGE%%|$worker_storage|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%MIN_WORKERS%%|$min_workers|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%MAX_WORKERS%%|$max_workers|g" "terraform/$environment_name.tfvars"

sed -i '' "s|%%SCHEDULER_COUNT%%|$scheduler_count|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%SCHEDULER_CPU%%|$scheduler_cpu|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%SCHEDULER_MEM%%|$scheduler_mem|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%SCHEDULER_STORAGE%%|$scheduler_storage|g" "terraform/$environment_name.tfvars"

sed -i '' "s|%%TRIGGER_COUNT%%|$trigger_count|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%TRIGGER_CPU%%|$trigger_cpu|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%TRIGGER_MEM%%|$trigger_mem|g" "terraform/$environment_name.tfvars"

sed -i '' "s|%%WEB_SERVER_CPU%%|$web_server_cpu|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%WEB_SERVER_MEM%%|$web_server_mem|g" "terraform/$environment_name.tfvars"
sed -i '' "s|%%WEB_SERVER_STORAGE%%|$web_server_storage|g" "terraform/$environment_name.tfvars"

rm task_counts.txt query_task.json composer.properties airflow.cfg