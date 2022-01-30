# Composer clone
A utility enables you to automate backup and restore operations on cloud composer environments running on Google Cloud Platform.

## How it works
The tool performs two main operations: Backup and recovery on a given composer environment following several steps, as summarized below:

### Backup
#### Usage
```
python src backup \
           --composer_env="composer-env-name" \
           --project_id="composer-project-id" \
           --composer_env_location="composer-env-location" \
           --destination_bucket="composer-backup-bucket"
```
#### Steps performed
- Lookup the GKE cluster related to the target composer environment to backup and updates the local `kubeconfig` with the appropriate credentials and endpoint information to point the local `kubectl` at the specific Composer GKE cluster.
- Identify and extract all details related to the target backup environment:
    - Composer namespace name
    - Airflow worker pod name
    - Airflow worker pod ENV vars
    - Airflow worker pod secrets (DB fernet encryption key, DB connection details)
    - CloudSQL proxy IP
- Create a full dump of the postgres Airflow DB by connecting to the CloudSQL proxy
- Generate a backup sql file for the latest starting values of auto increment fields (sequence) based on the the postgres INFORMATION_SCHEMA of the Airflow DB
- Create a backup directory (based on the backup timestamp) on the Google Cloud Storage bucket
- Copy into the backup directory:
  - `dags` folder
  - `plugins` folder
  - Postgres DB dump SQL file
  - Field sequences SQL file
  - A serialized snapshot of the composer environment object

### Recovery
#### Usage
```
python src restore \
           --composer_env="target-composer-env-name" \
           --project_id="target-composer-project-id" \
           --composer_env_location="target-composer-env-location" \
           --source_bucket="source-composer-backup-bucket" \
           --source_folder="source-composer-backup-path"
```
#### Steps performed
- Lookup the GKE cluster related to the target composer environment to import into and update kubeconfig with the approproiate credentials
- Extract the backup environment details from GCS bucket
- Import GCS dag and plugins folders to the target composer environment GCS
- Apply an import on the target postgres DB by importing the backup sql dump
- Apply an import on the postgres sequence file on the target
- Rotate the fernet key of the target environment against the backup fernet key

## Install
### Prerequisites
- Python 3.7+
- Apache Airflow 2
- Cloud Composer 1

### OS Dependencies
Before installing the tool, the following dependencies need to be available on the machine issue the backup and recovery commands.

Kubectl 
```
sudo apt-get install kubectl
```

Python build dependencies
```
sudo apt-get install build-essential autoconf libtool pkg-config python3.7-dev libpq-dev
```

Postgres Client
```
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/pgdg.list
sudo apt-get update
sudo apt-get install -y postgresql-client-13
```

Note: You will need to make sure that the postgres client installed on the machine is the same version as that of the Postgres CloudSQL instance running. Make sure to specify the version as per the example above.

### Install Python dependencies
```
pip3 install --upgrade pip
python3 -m pip install --upgrade setuptools
pip3 install -r requirements.txt
```
## Usage
### Airflow versions and backups
Restore operations need to happen on composer environments with exactly the same Airflow version. This limitation is mainly due to the fact that, even with minor Airflow versions there can be differences in the DB schema.

## Contributing
See ["CONTRIBUTING.md"](docs/contributing.md) for details.

## License
Apache 2.0; see ["LICENSE"](LICENSE) for details.

## Disclaimer
This project is not an official Google project. It is not supported by
Google and Google specifically disclaims all warranties as to its quality,
merchantability, or fitness for a particular purpose.