#Terraform template

###Get the BTC-USD realtime periscope multi exchange observer running  in less then 10 minutes

![Alt Text](https://media.giphy.com/media/238teoXcI17pu3YOSP/giphy.gif)

###Requirements:
- Terraform v0.11.11 
- provider.google v1.20.0
- git


###Setup:
- Open the Terraform Shell
- ```git clone https://github.com/galic1987/professional-services/ ```
- ```cd professional-services/examples/cryptorealtime/terraform-setup/```

- Fill out the terraform.tfvars configuration
-  `` vim terraform.tfvars ``

- Check everything is working 
- ```terraform init```
- ```terraform apply ```(ignore api enablement errors and/or rerun)

- Wait 5-10 minutes until the machine startup script is booted 
- Note: Your public IP address will be displayed here or in console 

- SSH into the VM that was [created](https://console.cloud.google.com/compute/instances)
- ```sudo -s ```
- ```cd ~```
- ```cd professional-services/examples/cryptorealtime/```


- Verify the variables from terraform are in place:
- ```echo "PROJECT_ID" $PROJECT_ID  "REGION" $REGION "ZONE" $ZONE "BUCKET_NAME" $BUCKET_NAME "BUCKET_FOLDER" $BUCKET_FOLDER "BIGTABLE_INSTANCE_NAME" $BIGTABLE_INSTANCE_NAME "BIGTABLE_TABLE_NAME" $BIGTABLE_TABLE_NAME "BIGTABLE_FAMILY_NAME" $BIGTABLE_FAMILY_NAME > verify.txt```

- ```cat verify.txt```

- Run the dataflow job to connect to exchanges
```./run.sh ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BUCKET_NAME}${BUCKET_FOLDER} ${BIGTABLE_TABLE_NAME} $BIGTABLE_FAMILY_NAME```
- Ignore any java.lang.IllegalThreadStateException


- Go to frontend script and run the frontend flask server and data visualisation
- ```cd frontend/```
- ```python app.py ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BIGTABLE_TABLE_NAME} ${BIGTABLE_FAMILY_NAME}```

- Open the VM IP on port 5000 in your browser to see the chart 


**Cleanup:**
- Navigate to the Terraform shell
- We have to delete the bigtable instances manually because there is a bug in the current Terraform provider
- ```gcloud bigtable instances delete cryptobackend-bigtable```
- ```terraform state rm google_bigtable_instance.instance```

- Delete the Dataflow jobs
`gcloud dataflow jobs cancel \
$(gcloud dataflow jobs list \
--format='value(id)' \
--filter="name:runthepipeline*")`

- Take down the infrastructure 
- ```terraform destroy```

Read [the post](https://medium.com/p/bigtable-beam-dataflow-cryptocurrencies-gcp-terraform-java-maven-4e7873811e86/edit) for addtional information:


![Terraform](https://media.giphy.com/media/sDjIG2QtbXKta/giphy.gif)
