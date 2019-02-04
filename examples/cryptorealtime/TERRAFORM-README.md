**Requirements:**
- Terraform v0.11.11 
- provider.google v1.20.0


**Setup:**
- ```git clone https://github.com/galic1987/professional-services/tree/master/examples/cryptorealtime ```
- ```cd terraform-setup/```
- open terraform.tfvars and fill the configuration 
- ```terraform init```
- ```terraform apply ```(ignore api enablement errors and/or rerun)
- wait 10 minutes until the machine startup script is booted
- ssh into the VM 
- ```sudo -s ```
- ```cd ~```
- ```cd cryptorealtime```



```./run.sh ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BUCKET_NAME}${BUCKET_FOLDER} ${BIGTABLE_TABLE_NAME} $BIGTABLE_FAMILY_NAME```



```echo "PROJECT_ID" $PROJECT_ID  "REGION" $REGION "ZONE" $ZONE "BUCKET_NAME" $BUCKET_NAME "BUCKET_FOLDER" $BUCKET_FOLDER "BIGTABLE_INSTANCE_NAME" $BIGTABLE_INSTANCE_NAME "BIGTABLE_TABLE_NAME" $BIGTABLE_TABLE_NAME "BIGTABLE_FAMILY_NAME" $BIGTABLE_FAMILY_NAME > verify.txt```


**Cleanup:**
- ```gcloud bigtable instances delete cryptobackend-bigtable```
- ```terraform state rm google_bigtable_instance.instance```
- ```terraform destroy```
