#!/bin/bash

zone=$(gcloud compute instances list --filter="name=$(hostname)" --format "get(zone)" | awk -F/ '{print $NF}')
user_pre=$(gcloud compute instances describe $(hostname) --zone=$zone --flatten="metadata[proxy-user-mail]")
user=$(echo $user_pre | cut -c5-1000)
bucket_pre=$(gcloud compute instances describe $(hostname) --zone=$zone --flatten="metadata[templates_bucket_name]")
bucket=$(echo $bucket_pre | cut -c5-1000)
templatesrc_pre=$(gcloud compute instances describe $(hostname) --zone=$zone --flatten="metadata[master_templates_path_name]")
templatesrc=$(echo $templatesrc_pre | cut -c5-1000)
templatedest_pre=$(gcloud compute instances describe $(hostname) --zone=$zone --flatten="metadata[generated_templates_path_name]")
templatedest=$(echo $templatedest_pre | cut -c5-1000)
yamlname_pre=$(gcloud compute instances describe $(hostname) --zone=$zone --flatten="metadata[dataproc_yaml_template_file_name]")
yamlname=$(echo $yamlname_pre | cut -c5-1000)

gsutil cp gs://$bucket/$templatesrc/$yamlname .
file_contents=$(<$yamlname)
echo "${file_contents//REPLACEME_USER_NAME/$user}" > prefile.yaml

file_contents2=$(<prefile.yaml)
echo "${file_contents2//REPLACEME_BUCKET_NAME/$bucket}" > $user.yaml
gsutil cp $user.yaml gs://$bucket/$templatedest/