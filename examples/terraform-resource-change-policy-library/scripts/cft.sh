#!/bin/sh

r=`tput setaf 1`
g=`tput setaf 2`
y=`tput setaf 3`
rst=`tput sgr0`
timer=0

POSITIONAL=()
while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -p|--project)
    project_id="$2"
    shift
    shift
    ;;
    -o|--organization)
    organization_id="$2"
    shift
    shift
    ;;
    -f|--folder)
    folder_id="$2"
    shift
    shift
    ;;
    -b|--bucket)
    bucket_name="$2"
    shift
    shift
    ;;
    -l|--lib)
    policy_library_path="$2"
    shift
    shift
    ;;
    -e|--export)
    export="$2"
    shift
    shift
    ;;
esac
done
set -- "${POSITIONAL[@]}" # restore positional parameters

check_args(){
  # Set policy_library_path to pwd if not passed
  if [ -z $policy_library_path ]
  then
    policy_library_path=$(pwd)
  fi

  # Set export to False if not passed
  if [ -z $export ]
  then
    export=false
  fi

  # Check required params are passed
  if [ -z $project_id ] || [ -z $bucket_name ]
  then
    if [ -z $project_id ]
    then
      echo "${r}--> Argument not set: --project_id (-p)${rst}"
    fi
    if [ -z $bucket_name ]
    then
      echo "${r}--> Argument not set: --bucket_name (-b)${rst}"
    fi
    echo "${y}Usage: ./cft.sh -p <project_id> -b <bucket_name>${rst}"
    exit 1
  fi
}

print_args(){
  echo "${g}--> Arguments:${rst}"
  echo "    - bucket_name:         ${y}${bucket_name}${rst}"
  echo "    - organization_id:     ${y}${organization_id}${rst}"
  echo "    - folder_id:           ${y}${folder_id}${rst}"
  echo "    - project_id:          ${y}${project_id}${rst}"
  echo "    - policy_library_path: ${y}${policy_library_path}${rst}"
  echo "    - export:              ${y}${export}${rst}"
}

setup_gcloud(){
  if [ ! -z "$project_id" ]
  then
    echo "${g}--> Setting up gcloud config ...${rst}"
    echo -n "    "
    export GOOGLE_PROJECT=$project_id
    gcloud config set project $project_id
  fi
}

export_cai(){
  if [[ $bucket_name == *"forseti"* ]]; then
    export_cai_forseti
  else
    export_cai_nonforseti
  fi
}

export_cai_nonforseti(){
  # Create a bucket for CAI data
  echo "${g}--> Creating bucket gs://$bucket_name ...${rst}"
  echo -n "    "
  gsutil -q mb gs://$bucket_name/

  # Export CAI data (organization)
  if [ ! -z $organization_id ]
  then
    echo "${g}--> Starting CAI export for organization '${organization_id}' ...${rst}"
    output_resource=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/resource_inventory.json \
    --organization=$organization_id \
    --content-type=resource \
    2>&1)

    output_iam=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/iam_inventory.json \
    --organization=$organization_id \
    --content-type=iam-policy \
    2>&1)

    type="organizations"

  # Export CAI data (folder)
  elif [ ! -z $folder_id]
  then
    echo "${g}--> Starting CAI export for folder '${folder_id}' ...${rst}"
    output_resource=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/resource_inventory.json \
    --folder=$folder_id \
    --content-type=resource \
    2>&1)

    output_iam=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/resource_inventory.json \
    --project=$folder_id \
    --content-type=iam-policy \
    2>&1)

    type="folders"

  # Export CAI data (project) if organization_id and folder_id aren't set
  else
    echo "${g}--> Starting CAI export for project '${project_id}' ...${rst}"
    output_resource=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/resource_inventory.json \
    --project=$project_id \
    --content-type=resource \
    2>&1)

    output_iam=$(gcloud beta asset export \
    --output-path=gs://$bucket_name/iam_inventory.json \
    --project=$project_id \
    --content-type=iam-policy \
    2>&1)

    type="projects"
  fi

  regex_resource="gcloud asset operations describe $type/[0-9]*/operations/ExportAssets/RESOURCE/[0-9a-f\-]*"
  regex_iam="gcloud asset operations describe $type/[0-9]*/operations/ExportAssets/IAM_POLICY/[0-9a-f\-]*"

  poll_resource=$(echo $output_resource | grep -oh "$regex_resource")
  poll_iam=$(echo $output_iam | grep -oh "$regex_iam")
  echo "    $poll_resource"
  echo "    $poll_iam"

  wait_for_export  # poll to completion

  # Wait until complete
  echo "${g}--> CAI export completed: ${rst}"
  echo "    - gs://$bucket_name/resource_inventory.json"
  echo "    - gs://$bucket_name/iam_inventory.json"
}

wait_for_export(){
  echo "${g}--> Polling CAI operations (retry $timer) ...${rst}"

  if [ ! -z $organization_id ]
  then
    poll_args=""
  elif [ ! -z $folder_id ]
  then
    poll_args=" --folder=$folder_id"
  else
    poll_args=" --project=$project_id"
  fi

  echo -n "    $poll_resource"
  ret_resource=$($poll_resource $poll_args | grep "done: true" 2>&1 >/dev/null)
  ret_resource_code=$?
  echo " --> $ret_resource_code"

  echo -n "    $poll_iam"
  ret_iam=$($poll_iam $poll_args | grep "done: true" 2>&1 >/dev/null)
  ret_iam_code=$?
  echo " --> $ret_iam_code"

  if [ $ret_resource_code -ne 0 ] || [ $ret_iam_code -ne 0 ]; then
    timer=$((timer+1))
    sleep 5
    wait_for_export
  fi
}

export_cai_forseti(){
  echo "${g}--> Forseti bucket detected: '${bucket_name}' ...${rst}"

  # Download last 2 dumps from Forseti CAI bucket
  echo "${g}--> Downloading last 2 dump files from Forseti bucket ...${rst}"
  output=$(gsutil ls -l gs://$bucket_name | sort -k 2 | tail -n 3 | head -2 | awk '{print $3}')
  files=($output)
  sort_array
  echo "    - ${files[0]}"
  echo "    - ${files[1]}"

  # Copy resource dump to appropriate name
  gsutil cp ${files[0]} gs://$bucket_name/iam_inventory.json

  # Copy IAM dump to appropriate name
  gsutil cp ${files[1]} gs://$bucket_name/resource_inventory.json

  echo "${g}"
  echo "--> Renamed last 2 dump files: "
  echo "    - gs://$bucket_name/${files[0]} --> gs://$bucket_name/iam_inventory.json"
  echo "    - gs://$bucket_name/${files[1]} --> gs://$bucket_name/resource_inventory.json"
  echo "${rst}"
}

download_cft(){
  # OS X
  if [[ "$OSTYPE" == "darwin"* ]]; then
    bin_name="cft-darwin-amd64"
  # Linux
  else
    bin_name="cft-linux-amd64"
  fi
  if ! [ -f cft ]; then
    echo "${r}--> CFT Binary not found, downloading ...${rst}"
    curl -o cft https://storage.googleapis.com/cft-scorecard/v0.2.0/${bin_name}
    chmod +x cft
    echo "${g}--> CFT Binary downloaded to ./cft !${rst}"
  fi
}

sort_array(){
  # https://stackoverflow.com/questions/7442417/how-to-sort-an-array-in-bash
  IFS=$'\n' sorted=($(sort <<<"${files[*]}")); unset IFS
  files=$sorted
}

run_cft(){
  cmd="./cft scorecard --policy-path=${policy_library_path} --project=${project_id} --bucket=${bucket_name}"
  echo "${g}--> Running CFT Scorecard ...${rst}"
  echo "    $cmd"
  eval $cmd
}

check_args
print_args
setup_gcloud
if $export; then
  export_cai
fi
download_cft
run_cft
