#!/bin/bash

zone=$(gcloud compute instances list --filter="name=$(hostname)" --format "get(zone)" | awk -F/ '{print $NF}')
user_pre=$(gcloud compute instances describe "$(hostname)" --zone="$zone" --flatten="metadata[proxy-user-mail]")
# shellcheck disable=SC2206
user_pre=(${user_pre//;/ })
user="${user_pre[1]}"

bucket_pre=$(gcloud compute instances describe "$(hostname)" --zone="$zone" --flatten="metadata[templates_bucket_name]")
bucket_pre=(${bucket_pre//;/ })
bucket="${bucket_pre[1]}"

templatesrc_pre=$(gcloud compute instances describe "$(hostname)" --zone="$zone" --flatten="metadata[master_templates_path_name]")
templatesrc_pre=(${templatesrc_pre//;/ })
templatesrc="${templatesrc_pre[1]}"

templatedest_pre=$(gcloud compute instances describe "$(hostname)" --zone="$zone" --flatten="metadata[generated_templates_path_name]")
templatedest_pre=(${templatedest_pre//;/ })
templatedest="${templatedest_pre[1]}"

yamlname_pre=$(gcloud compute instances describe "$(hostname)" --zone="$zone" --flatten="metadata[dataproc_yaml_template_file_name]")
yamlname_pre=(${yamlname_pre//;/ })
yamlname="${yamlname_pre[1]}"

yaml_path=gs://$bucket/$templatesrc/$yamlname

gsutil cp "$yaml_path" .
file_contents=$(<"$yamlname")
echo "${file_contents//REPLACEME_USER_NAME/$user}" > prefile.yaml

file_contents2=$(<prefile.yaml)
echo "${file_contents2//REPLACEME_BUCKET_NAME/$bucket}" > "$user".yaml
gsutil cp "$user".yaml gs://"$bucket"/"$templatedest"/
