#!/bin/bash

# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

print_in_green() {
	printf "\n\033[0;32m$1\n\033[0m"
}


usage() {
	echo "Example usage ./install.sh -p slots-deficits -l US"
	echo "-p denotes the project id that will run the audit log sink."
	echo "-l denotes location of the dataset."
	echo "-h display this and exit."
}

get_zone() {
  if [ "$1" == "US" ]; then
  	zone='us-central1'
  else
  	zone='europe-west1'
  fi

}
errorout_if_empty() {
	if [ -z $1 ]
	then
	      >&2 echo "ERROR: $2 is required"
	      usage
	      exit 1
	fi
}

while getopts ":d:p:o:l:h" opt; do
  case $opt in
    p)
      p=$OPTARG
      ;;
    l)
      l=$OPTARG
      ;;
    h)
      usage
      exit 1
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

create_bq_resources() {
  print_in_green "Creating dataset"
  bq mk --location=$l -d $p:slots_deficits

  print_in_green "Creating tables and views"
  bq mk -t --time_partitioning_field=time_window --time_partitioning_type=DAY slots_deficits.slots_deficits time_window:TIMESTAMP,pending_units:INTEGER,active_units:INTEGER,project_id:BYTES,job_id:BYTES,__index_level_0__:INTEGER

  myvar=$(sed -e "s/\${PROJECT_ID}/$p/" -e "s/\${DATASET}/$d/" ./templates/slots_deficits_by_project_v.sql)
  bq mk --use_legacy_sql=false --view "$myvar" slots_deficits.slots_deficits_by_project

  myvar=$(sed -e "s/\${PROJECT_ID}/$p/" -e "s/\${DATASET}/$d/" ./templates/slots_deficits_overall_v.sql)
  bq mk --use_legacy_sql=false --view "$myvar" slots_deficits.slots_deficits_by_overall

  myvar=$(sed -e "s/\${PROJECT_ID}/$p/" -e "s/\${DATASET}/$d/" ./templates/slots_deficits_minute_resolution_v.sql)
  bq mk --use_legacy_sql=false --view "$myvar" slots_deficits.slots_deficits_minute_resolution

  myvar=$(sed -e "s/\${PROJECT_ID}/$p/" -e "s/\${DATASET}/$d/" ./templates/slots_deficits_overall_minute_resolution_v.sql)
  bq mk --use_legacy_sql=false --view "$myvar" slots_deficits.slots_deficits_overall_minute_resolution

  myvar=$(sed -e "s/\${PROJECT_ID}/$p/" -e "s/\${DATASET}/$d/" ./templates/slots_deficits_by_project_minute_resolution_v.sql)
  bq mk --use_legacy_sql=false --view "$myvar" slots_deficits.slots_deficits_by_project_minute_resolution


}

errorout_if_empty "$p" "-p"
errorout_if_empty "$l" "-l"

print_in_green "Setting project"
gcloud config set project $p

create_bq_resources

print_in_green "Enabling Kubernetes Engine API"
gcloud services enable container.googleapis.com
print_in_green "Enable Resource manager API"
gcloud services enable cloudresourcemanager.googleapis.com

#serviceregistry.googleapis.com
print_in_green "Installing kubectl"
gcloud components install kubectl
print_in_green "Creating kubernetes cluster."
get_zone $l
gcloud beta container clusters create slots-deficit-cluster --project $p --region $zone --machine-type "n1-standard-2" --num-nodes "1" --image-type "COS" --service-account "slots-deficits-service4@$p.iam.gserviceaccount.com" --enable-cloud-logging --enable-cloud-monitoring --enable-autoupgrade --enable-autorepair
gcloud container clusters get-credentials slots-deficit-cluster --zone $zone

sed -e "s/\${PROJECT_ID}/$p/"  -e "s/\${DATASET}/$d/" ./kubernetes/slots_deficits_cron.yaml > ./kubernetes/slots_deficits_cron.yaml.tmp
sed -e "s/\${PROJECT_ID}/$p/"  -e "s/\${DATASET}/$d/" ./kubernetes/slots_deficits_one_time.yaml > ./kubernetes/slots_deficits_one_time.yaml.tmp

kubectl create -f ./kubernetes/slots_deficits_cron.yaml.tmp
kubectl create -f ./kubernetes/slots_deficits_one_time.yaml.tmp

rm ./kubernetes/slots_deficits_cron.yaml.tmp
rm ./kubernetes/slots_deficits_one_time.yaml.tmp


print_in_green "Installation success. Exiting"
