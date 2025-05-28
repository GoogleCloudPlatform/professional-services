# Development

This document describes the guidelines for running this application on your
local environment.

## Getting Started

To set up the local environment for the first time, run the following commands
in the terminal to create a virtual environment (if it is not already created by
your IDE), and install the necessary dev packages.

```shell
# Create virtual environment
python -m venv venv

# Activate the virtual environment
source ./venv/bin/activate

# Install application packages
pip install -r requirements.txt

# Install dev packages for local development purposes
pip install -r requirements-dev.txt

# Install pre-commit hooks into the local .git folder
pre-commit install
```

## Pre-commit Hooks

The file `.pre-commit-config.yaml` can be updated to enable, disable, or
configure the git pre-commit hooks. A `git commit` command will trigger the
execution of the pre-commit hooks automatically.

A list of default pre-commit hooks have been configured in this project
template:

- check-ast (verify Python syntax)
- check-case-conflict (check names conflict on a case-insensitive filesystem)
- check-json (verify JSON file format)
- check-yaml (verify YAML file format)
- detect-private-key (check existence of private keys)
- end-of-file-fixer (fix files end with a newline and only a newline)
- fix-byte-order-marker (remove UTF-8 byte order marker)
- trailing-whitespace (trim trailing whitespace)
- mixed-line-ending (fix mixed line ending)
- isort (sort import statements)
- flake8 (PEP8 code style checks)
- pylint (Python linting)

Some pre-commit hooks will actively fix the issues by updating the files for
you. For example, sort the import statements, remove extra end-of-file
blank lines...etc. If that happens, the files will be updated, and they need
to be added to staging area again via the `git add` command.

Some other pre-commit hooks (e.g. pylint, flake8) will fail the commit process.
In that case, the pre-commit process will show where the errors are.

For details of the pre-commit hooks, please refer
to [pre-commit.com](https://pre-commit.com/), or the corresponding plugin
websites.

### Manual Pre-Commit Check

To trigger pre-commit hooks manually, run one of the commands:

```shell
# invoke all pre-commit hooks for git staging files
pre-commit

# invoke all pre-commit hooks for all git files
pre-commit run --all-files

# invoke only the pylint pre-commit hook
pre-commit run pylint
```

## Linting

In this template, linting is included in the pre-commit hooks by default. One
can configure the linting options by modifying the `.pylintrc` file.

Alternate ways to run linting manually:

```shell
# run linting via pre-commit hook
pre-commit run pylint

# or directly invoke the pylint command on all git files
pylint --jobs=0 $(git ls-files '*.py')
```

## Git Best Practices

### Branch Naming Conventions

If there are multiple engineers working on the same project, it would be good
to set up some simple git branch naming conventions at the very beginning.
A good naming convention makes it easier to locate the changes and provides
clarify about the work of individuals.

For reference, one can start with the following branch naming conventions:

* Feature branches with prefix `feature/`, e.g. `feature/my-awesome-model`
* Bugfix branches with prefix `bugfix/`, e.g. `bugfix/incorrect-model-response`
* Hotfix branches with prefix `hotfix/`. This is usually related to the fixing
  of critical bugs in a production-like application
* Release branches with prefix `release/`. This should be used to mark changes
  related to a specific UAT/production release
* Documentation branches with prefix `docs/`. This should be used for
  documentation tasks

### Pull Requests

One should always create a Pull Request (PR) for others to review, before
merging in the `main` branch.

**NEVER** commit to a `main` branch directly, because it will:

* Create a lot of code conflicts if there are multiple developers
* Make it difficult to code review and test a new feature
* Make it difficult to roll back to a previous state if anything goes wrong

Some source repository products support the concept of "Protected Branches". As
a rule of thumb, one should always protect the `main` branch if possible.

Every PR should have a reasonable size for code review. Even experienced
developers may not be able to review tens of files efficiently. Note that a PR
should address **just one thing**. One should not mix different features or
fixes in a branch, as that makes it difficult to review.

## Unit Testing

A sample python module `src/demo/llm.py` and its corresponding unit tests
`tests/test_llm.py` have been added as an example.

Note that the unit testing is not included in the pre-commit hooks, as one may
not want to slow down the commit process normally. It can, however, be added
to a CI/CD pipeline (e.g. CloudBuild) if necessary.

### Best Practices

For unit testing, it needs to be run quickly, without impacting production data
or incurring unexpected costs. Therefore, it should not use real GCP
resources (e.g. BigQuery table, Vertex AI online predictions...etc) for unit
testing (integration or end-to-end testing is another story).

There are different unit testing strategies. The most common one is to use
mocking libraries or frameworks to create mock objects that simulate the
behavior of GCP services. This allows you to isolate your code under test and
focus on specific functionality without relying on external dependencies.

The example in the project template shows how to use `unittest.mock` library
to simulate the response of an LLM model in different scenarios.

### Run Unit Tests

To run unit tests locally, use any of the following options:

```shell
# To run unit tests only
pytest

# To run unit tests with test coverage
pytest --cov=src

# To run unit tests with test coverage and missing details
pytest --cov=src --cov-report=term-missing

# To run unit tests with test coverage reported in HTML (`htmlcov/index.html`)
pytest --cov=src --cov-report=html
```

For different `pytest` commandline options, please refer to
the [pytest](https://docs.pytest.org/en/)
and [pytest-cov](https://pytest-cov.readthedocs.io/en/latest/).

### Test Coverage

Test coverage helps identify areas of your code that haven't been tested,
indicating potential vulnerabilities, bugs, or unexpected behavior. High test
coverage generally correlates with higher software quality and reliability.

A general guidelines about test coverage:

* Baseline: 50-70%
* High-risk or production-like projects: 80%

### Demo Deployment
### Local Development Setting
1. Create virtual python environment following [Python Virtual Env guide](https://python.land/virtual-environments/virtualenv)
2. After creating venv, activate it with the command `.venv/Scripts/activate`
3. Install pip packages
`pip3 install -r requirements.txt`
4. Run App locally
`python3 app.py`
4. Install gcloud CLI following this guide [Install gcloud](https://cloud.google.com/sdk/docs/install)
5. Run cloud run locally (This requires docker install in advance) [Guide Document](https://cloud.google.com/run/docs/testing/local#gcloud-cli)
`gcloud beta code dev --dockerfile=Dockerfile --application-default-credential`

### Deploy to Cloud Run
1. Customer has organization policy for VPCSC(VPC Service Control) which blocks Service account to access Google Cloud Storage from local environment. The access should be allowed in advance
 - Service Account : `61790362463-compute@developer.gserviceaccount.com`

2. Cloud run Deploy [gcloud run deploy reference](https://cloud.google.com/sdk/gcloud/reference/run/deploy)
 - Set min-instances to 1 to avoid cord start
 - Set CPU and Memory to multiprocess image generation and store temp image files  
`gcloud run deploy pasta-poc --min-instances=1 --cpu=4000m --memory=4Gi --source . --region=asia-northeast3`