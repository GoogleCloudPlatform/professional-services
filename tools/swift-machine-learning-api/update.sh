# Updates the trainer folder in google cloud storage
#!/bin/bash
sed -e 's/:[^:\/\/]/="/g;s/$/"/g;s/ *=/=/g' config/config_file.yaml > config.sh

source config.sh

TRAINER_PACKAGE='trainer-0.0.tar.gz'

cd codes/
python setup.py sdist
export GOOGLE_APPLICATION_CREDENTIALS=$service_account_json_key
gsutil cp -r dist/$TRAINER_PACKAGE $bucket_name/$TRAINER_PACKAGE

echo "INFO: Please make sure that train.yaml and config.yaml have same name for trainer file"
