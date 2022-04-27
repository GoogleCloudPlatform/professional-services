# Cloud Composer Examples

This example demonstrates how to test Airflow DAGs using then deploy them to
Cloud Composer using with Cloud Build.

## Run build using Cloud Build

The included cloudbuild.yaml file has the following flow:
1. Build Airflow DAGs Builder: Builds a docker image with airflow dependencies included
2. Validation Test: Check that the DAGs load correctly
3. End to End Test: Backfill DAGs for a specific date with some variables set.
4. Deploy DAGs: copy DAGs to a target Cloud Composer DAGs folder in GCS

To enable this,
* Create a Cloud Build trigger, and point it at the `examples/cloud-composer-cicd/cloudbuild.yaml` file.
* Set the substitution variable `_DEPLOY_DAGS_LOCATION` to the GCS path that your cloud composer environment is using for dags eg: `gs://my-composer-env-bucket/dags/`
* Set the substitution variable `_DIRECTORY` to `examples/cloud-composer-cicd` (this allows the `cloudbuild.yaml` to be generalized for other project structures).

Now you can trigger the build.

## Running validation test locally

The file `dag_integrity_test.py` will test the DAG integrity of the available airflow environment.
To test the dags folder in this example locally, you can run:

```
pip install -r requirements.txt
export AIRFLOW_HOME=`pwd`/tmp
export AIRFLOW__CORE__LOAD_EXAMPLES=False
export AIRFLOW__CORE__DAGS_FOLDER=`pwd`/dags
airflow initdb
python -m unittest tests/dag_integrity_test.py
```

## Running build locally with cloud build emulator

Alternatively you can run these tests locally using the cloud build emulator. This requires docker to be running.

```
cloud-build-local --config=cloudbuild.yaml --dryrun=false \
  --substitutions=_DEPLOY_DAGS_LOCATION=gs://my-composer-env-bucket/dags/,_DIRECTORY=examples/cloud-composer-cicd ../../
```

You can run the full build without deploying your DAGs by directing the DAGs to /tmp
```
cloud-build-local --config=cloudbuild.yaml --dryrun=false \
  --substitutions=_DEPLOY_DAGS_LOCATION=/tmp,_DIRECTORY=examples/cloud-composer-cicd ../../
```
