# Get the script directory
script_dir=$(dirname "$0")

source ${script_dir}/build-jar.sh

## Build docker image ##
gcloud builds submit --config cloudbuild.yml .