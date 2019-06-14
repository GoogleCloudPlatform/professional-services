# Basic Python Continuous Integration (CI) With Cloud Source Repositories (CSR) and Cloud Build

## Overview
This repo contains example code and instructions that show you how to use CSR and 
Cloud Build to automatically run unit tests and pylint upon code check-in. By following this tutorial you will learn
how to build basic Python continuous integration pipelines on Google Cloud Platform (GCP).

By following along with this example you will learn how to:
1. Create a new project in CSR and clone it to your machine.
2. Create your code and unit tests.
3. Create a custom container called a cloud builder that Cloud Build will use to run your Python tests.
4. Create a cloud build trigger that will tell Cloud Build when to run.
5. Tie it all together by creating a cloudbuild.yaml file that tells Cloud Build how to execute your tests
 when the cloud build trigger fires, using the custom cloud builder you created.

## 1. Create a new project in Cloud Source Repositories
You'll start by creating a new repository in CSR, copying the files in this example into the CSR repository, and 
commiting them to your new repository.

* Go to https://source.cloud.google.com/.
* Click 'Add repository.'
* Choose 'Create new repository.'
* Specify a name, and your project name.
* Follow the instructions to 'git clone' the empty repo to your workstation.
* Copy the files from this example into the new repo.
* Add the files to the new repo with 'git add .'
* Commit and push these files in the new repo with the commands 'git commit -m 'inital commit' and 'git push origin master.'


You can alternatively do the same using the Google Cloud SDK:
* Create the repository by running the command 'gcloud source repos create <REPO_NAME>.'
* Clone the new repository to your local machine by running the command 'gcloud source repos clone <REPO_NAME>.'
* Copy the files from this example into the new repo.
* Add the files to the new repo with 'git add .'
* Commit and push these files in the new repo with the commands 'git commit -m 'inital commit' and 'git push origin master.'

## 2. Create your code and unit tests
Creating unit tests is beyond the scope of this README, but if you review the tests in tests/ you'll quickly get the idea. 
I'm using pytest as the testing suite for this project. Before proceeding make sure you can run your tests from the 
command line

```
python -m pytest 

```

Or if you want to be fancy and use the coverage plug-in

```
python -m pytest --cov=my_module tests/

```

If everything goes well you should expect to see output like this, showing successful tests:

```
$ python -m pytest --cov=my_module tests/
============================================================================= test session starts ==============================================================================
platform darwin -- Python 3.7.3, pytest-4.6.2, py-1.8.0, pluggy-0.12.0
rootdir: /Users/mikebernico/dev/basic-cicd-cloudbuild
plugins: cov-2.7.1
collected 6 items

tests/test_my_module.py ......                                                                                                                                           [100%]

---------- coverage: platform darwin, python 3.7.3-final-0 -----------
Name                     Stmts   Miss  Cover
--------------------------------------------
my_module/__init__.py        1      0   100%
my_module/my_module.py       4      0   100%
--------------------------------------------
TOTAL                        5      0   100%


```

Now that our tests are working locally, we want to configure GCP to run them every time we push new code.

## 3. Building a Python Cloud Builder
In order to execute python based tests in cloud builder you need a python cloud builder. 
A cloud builder is just a docker container with the stuff you need in it. Google doesn't distribute a 
python cloud builder, so we have to build one ourselves. I've created one in '/python-cloud-builder.' All you need to do 
is run this:

```
cd python-cloud-builder
gcloud builds submit --config=cloudbuild.yaml .

```

This creates a custom cloud builder in your container registry called gcr.io/$PROJECT_ID/python-cloudbuild that you can
use to run tests with.

## 4. Create a Cloud Build Trigger
* On the GCP console navigate to 'Cloud Build' > 'Triggers.'
* Add a trigger.
* Choose cloud source repository.
* Pick the repo you created in step 1.
* Assuming you want the trigger to fire on any branch, accept the default trigger type and regex.
* Choose 'cloud build configuration file' from 'build configuration.'
* Click create trigger.


## 5. Create a cloudbuild.yaml file that executes your tests and runs pylint
Create a file called cloudbuild.yaml in the root of your project and add the steps needed to execute your unit tests, 
using the cloud builder we created in step 3. 

*Note: Each cloudbuilder step is a separate, ephemerial run of a docker container, however the /workspace/ directory is
preserved between runs. One way to carry python packages forward is to use a virtualenv housed in /workspace/*


```
steps:
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: '/bin/bash'
  args: ['-c','virtualenv /workspace/venv' ]
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/pip'
  args: ['install', '-V', '-r', 'requirements.txt']
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/python'
  args: ['-m', 'pytest', '-rA']
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/pylint'
  args: ['my_module/']
```

## Wrap Up
That's all there is to it! 

From here you can inspect your builds in Cloud Builder's history.  You can also build in third-party integrations via
PubSub. There's some documentation on how [here.](https://cloud.google.com/cloud-build/docs/configure-third-party-notifications)

If we wanted to automatically deploy this code we could add another step that enabled continuous delivery too. Prebuilt cloud builders
exist for gcloud, kubectl, etc. The full list can be found at [https://github.com/GoogleCloudPlatform/cloud-builders.](https://github.com/GoogleCloudPlatform/cloud-builders)
Google also maintains a community repo for other cloud builders contributed by the public [here.](https://github.com/GoogleCloudPlatform/cloud-builders-community)


## License
   Copyright 2019 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
