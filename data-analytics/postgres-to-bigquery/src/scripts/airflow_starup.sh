#! /bin/bash
apt-get update
apt-get install unzip -y
apt-get install build-essential -y
apt-get install python3-dev -y
apt-get install libsasl2-dev -y
apt-get install python3-pandas -y
apt-get install python3-pip -y
apt-get install libmysqlclient-dev -y
apt-get install python3-psycopg2 -y
apt-get install supervisor -y
pip3 install --upgrade pip
export AIRFLOW_HOME=~/airflow
pip3 install apache-airflow==1.8.2
pip3 install "airflow[g3_api]"
pip3 install google-cloud-storage
pip3 install google-cloud-bigquery
pip3 install pymysql
pip3 install mysqlclient
pip3 install crypto
pip3 install celery
sudo groupadd airflow_user
sudo useradd -m -d /home/airflow_user airflow_user -g airflow_user
mkdir -p /home/airflow_user/airflow/dags
mkdir -p /home/airflow_user/airflow/logs
mkdir -p /home/airflow_user/airflow/dw_tables
chown -R airflow_user:airflow_user /home/airflow_user/
mkdir -p /tmp/qwiklabs-dw-staging/labs_schemas/
mkdir -p /tmp/qwiklabs-dw-staging/labs_data/
mkdir -p /tmp/qwiklabs-dw-staging/bill_schemas/
mkdir -p /tmp/qwiklabs-dw-staging/bill_data/
chown -R airflow_user:airflow_user /tmp/qwiklabs-dw-staging
echo "export AIRFLOW_HOME=/home/airflow_user/airflow/" >> /home/airflow_user/.bashrc
sudo su airflow_user bash -c "export AIRFLOW_HOME=/home/airflow_user/airflow/; \
airflow initdb;gsutil cp gs://datawarehouse-pipeline/airflow_scripts/airflow.cfg /home/airflow_user/airflow/; \
exit"
sudo -u airflow_user bash -c "gsutil cp gs://datawarehouse-pipeline/airflow_scripts/cloud_sql_proxy.conf /home/airflow_user/; \
gsutil cp gs://datawarehouse-pipeline/airflow_scripts/deploy_airflow_code.sh /home/airflow_user/; \
chmod +x /home/airflow_user/deploy_airflow_code.sh;sh /home/airflow_user/deploy_airflow_code.sh;exit"
sudo -u airflow_user bash -c "wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /home/airflow_user/cloud_sql_proxy"
sudo -u airflow_user bash -c "chmod +x /home/airflow_user/cloud_sql_proxy"
sudo cp /home/airflow_user/cloud_sql_proxy.conf /etc/supervisor/conf.d/
sudo supervisorctl reread
sudo supervisorctl update
