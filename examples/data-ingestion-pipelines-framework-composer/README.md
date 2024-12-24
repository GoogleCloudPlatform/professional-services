# Ingestion Pipelines Composer framework
Repository with Ingestion Pipelines framework prepared for Composer.

# Local Developemnt - Dependecies setup
### Create and activate virtual enviroemnt
```
python -m venv venv
source venv/bin/activate
```
### Install dependencies
```bash
pip install -r frozen-requirements.txt -r dev-requirements.txt
```

# Testing
### Setup
Before running unit-tests you need to setup Airflow.

Run this command once in your enviroment:
```bash
python -m airflow db migrate
```
Do not worry about warnings. Look for final message: `Database migrating done!`

### Running Python Unit Tests 
This command automatically discovers python files with `test_` prefix and executes them.

```
pytest . -vv
```

