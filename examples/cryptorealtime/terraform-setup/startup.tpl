#! /bin/bash
sudo apt-get update
sudo apt-get install openjdk-8-jdk git maven -y
sudo apt-get install google-cloud-sdk-cbt -y
sudo apt-get --only-upgrade install kubectl google-cloud-sdk google-cloud-sdk-app-engine-grpc google-cloud-sdk-app-engine-go google-cloud-sdk-cloud-build-local google-cloud-sdk-datastore-emulator google-cloud-sdk-app-engine-python google-cloud-sdk-cbt google-cloud-sdk-bigtable-emulator google-cloud-sdk-app-engine-python-extras google-cloud-sdk-datalab google-cloud-sdk-app-engine-java -y
cd ~
git clone https://github.com/galic1987/professional-services
cd professional-services/examples/cryptorealtime/
gsutil cp README.md ${bucket_name}${bucket_folder}
mvn clean install
echo "export PROJECT_ID=${project_id}" >> ~/.bashrc
echo "export REGION=${region}" >> ~/.bashrc
echo "export ZONE=${zone}" >> ~/.bashrc
echo "export BUCKET_NAME=${bucket_name}" >> ~/.bashrc
echo "export BUCKET_FOLDER=${bucket_folder}" >> ~/.bashrc
echo "export BIGTABLE_INSTANCE_NAME=${bigtable_instance_name}" >> ~/.bashrc
echo "export BIGTABLE_TABLE_NAME${bigtable_table_name}" >> ~/.bashrc
echo "export BIGTABLE_FAMILY_NAME=${bigtable_family_name}" >> ~/.bashrc
cbt -instance=cryptorealtime createtable cryptorealtime families=market






