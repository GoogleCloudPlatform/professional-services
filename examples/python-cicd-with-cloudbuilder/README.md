# Basic Python Continuous Integration (CI) With Cloud Source Repositories (CSR) and Google Cloud Build

## Overview
This repo contains example code and instructions that show you how to use CSR and 
Google Cloud Build to automatically run unit tests and pylint upon code check-in. By following this tutorial you will learn
how to build basic Python continuous integration pipelines on Google Cloud Platform (GCP).

By following along with this example you will learn how to:
1. Create a new project in CSR and clone it to your machine.
1. Create your code and unit tests.
1. Create a custom container image called a cloud builder that Google Cloud Build will use to run your Python tests.
1. Create a cloud build trigger that will tell Google Cloud Build when to run.
1. Tie it all together by creating a cloudbuild.yaml file that tells Google Cloud Build how to execute your tests
 when the cloud build trigger fires, using the custom cloud builder you created.
 
In order to follow along with this tutorial you'll need to:
* Create or have access to an existing [GCP project](https://cloud.google.com/resource-manager/docs/creating-managing-projects).
* Install and configure the [Google Cloud SDK](https://cloud.google.com/sdk).

## 1. Create a new project in Cloud Source Repositories
You'll start by creating a new repository in CSR, copying the files in this example into the CSR repository, and 
commiting them to your new repository.

1. Go to [https://source.cloud.google.com/](https://source.cloud.google.com/).
1. Click 'Add repository'.
1. Choose 'Create new repository'.
1. Specify a name, and your project name.
1. Follow the instructions to 'git clone' the empty repo to your workstation.
1. Copy the files from this example into the new repo.
1. Add the files to the new repo with the command:
    ```bash
    git add .
    ```
1. Commit and push these files in the new repo by running the commands:
    ```bash
    git commit -m 'Creating a repository for Python Cloud Build CI example.'
    git push origin master.'
    ```

You can alternatively do the same using the Google Cloud SDK:
1. Choose a name for your source repo and configure an environment variable for that name with the command:
    ```bash
    export REPO_NAME = <YOUR_REPO_NAME>
    ```
1. Create the repository by running the command:
     ```bash
     gcloud source repos create $REPO_NAME
     ```
1. Clone the new repository to your local machine by running the command: 
     ```bash
     gcloud source repos clone $REPO_NAME.
     ```
1. Copy the files from this example into the new repo.
1. Add the files to the new repo with the command:
    ```bash
    git add .
    ```
1. Commit and push these files in the new repo by running the commands:
    ```bash
    git commit -m 'Creating repository for Python Cloud Build CI example.'
    git push origin master.'
    ```

## 2. Create your code and unit tests
Creating unit tests is beyond the scope of this README, but if you review the tests in tests/ you'll quickly get the idea. 
Pytest is being used as the testing suite for this project. Before proceeding make sure you can run your tests from the 
command line by running this command from the root of the project:

```bash
python3 -m pytest 
```

Or if you want to be fancy and use the [coverage](https://pytest-cov.readthedocs.io/en/latest/readme.html) plug-in:

```bash
python3 -m pytest --cov=my_module tests/
```

If everything goes well you should expect to see output like this, showing successful tests:

```bash
$ python3 -m pytest --cov=my_module tests/
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

Now that your tests are working locally, you can configure Google Cloud Build to run them every time you push new code.

## 3. Building a Python Cloud Build Container
To run Python-based tests in Google Cloud Build you need a Python container image used as a [cloud builder](https://cloud.google.com/cloud-build/docs/cloud-builders). 
A cloud builder is just a container image with the software you need for your build steps in it. Google does not distribute a 
prebuilt Python cloud builder, so a custom cloud builder is required. The code needed to build a custom Python 3 cloud build 
container is located in '/python-cloud-builder' under the root of this project. 

Inside that folder you will find a Dockerfile and a very minimal cloud-build.yaml.

The Dockerfile specifies the software that will be inside the container image.

```Docker
FROM python:3 # Start from the public Python 3 image contained in DockerHub
RUN pip install virtualenv 
# Install virtualenv so that a virtual environment can be used to carry build steps forward.  
```

The Dockerfile is enough to build the image, however you will also need a cloud-build.yaml to tell Cloud Build how to 
build and upload the resulting image to GCP.

```yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [ 'build', '-t', 'gcr.io/$PROJECT_ID/python-cloudbuild', '.' ]
  # This step tells Google Cloud Build to use docker to build the Dockerfile.  
images:
- 'gcr.io/$PROJECT_ID/python-cloudbuild'
  # The resulting image is then named python-cloudbuild and uploaded to your projects container registry.    

```

You don't need to change either of these files to follow this tutorial. They are included here to help you understand 
the process of building custom build images. Once you're ready, run these commands from the root of the project to build
and upload your custom Python cloud builder:

```bash
cd python-cloud-builder
gcloud builds submit --config=cloudbuild.yaml .
```
This creates the custom Python cloud builder and uploads it to your GCP project's 
[container registry](https://cloud.google.com/container-registry/), which is a private
location to store container images. Your new cloud builder will be called gcr.io/$PROJECT_ID/python-cloudbuild, where 
$PROJECT_ID is the name of your GCP project.

## 4. Create a Google Cloud Build Trigger
Now that you've created a Python cloud builder to run your tests, you 
should [create a trigger](https://cloud.google.com/cloud-build/docs/running-builds/automate-builds) that tells Cloud
Build when to run those tests. To do that, follow these steps:

1. On the GCP console navigate to 'Cloud Build' > 'Triggers'.
1. Add a trigger by clicking '+ CREATE TRIGGER'.
1. Choose the cloud source repository you created in step 1. from the 'Repository' drop down.
1. Assuming you want the trigger to fire on any branch, accept the default trigger type and regex.
1. Choose the 'Cloud Build configuration file (yaml or json)' radio button  under 'Build configuration'.
1. Click 'Create trigger'.


## 5. Create a cloudbuild.yaml file that executes your tests and runs pylint
At this point you've ran some unit tests on the command line, created a new repository in CSR, 
created a Python cloud builder, and used Google Cloud Build to create build trigger that runs whenever you 
push new code. In this last step you'll tie this all together and  tell Google Cloud Build how to automatically run 
tests and run pylint to examine your code whenever a code change is pushed into CSR.

In order to tell Google Cloud Builder how to run your tests, you'll need to create a file called cloudbuild.yaml in the
root of your project. Inside that file you'll and add the steps needed to execute your unit tests. For each steps you 
will reference the cloud builder that was created in step 3, by it's location in the Google Container Registry. 

*Note: Each step specified in the cloudbuild.yaml is a separate, ephemerial run of a docker image, 
however [the /workspace/ directory is preserved between runs](https://cloud.google.com/cloud-build/docs/build-config#dir). 
One way to carry python packages forward is to use a virtualenv housed in /workspace/*


```yaml
steps:
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild' # Cloud Build automatically substitutes $PROJECT_ID for your Project ID.  
  entrypoint: '/bin/bash'
  args: ['-c','virtualenv /workspace/venv' ]
  # Creates a Python virtualenv stored in /workspace/venv that will persist across container runs.  
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/pip'
  args: ['install', '-V', '-r', 'requirements.txt']
  # Installs any dependencies listed in the project's requirements.txt.  
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/python'
  args: ['-m', 'pytest', '-v']
  # Runs pytest from the virtual environment (with all requirements)  
  # using the verbose flag so you can see each individual test.  
- name: 'gcr.io/$PROJECT_ID/python-cloudbuild'
  entrypoint: 'venv/bin/pylint'
  args: ['my_module/']
  # Runs pylint against the module my_module contained one folder under the project root.  
```

## Wrap Up
That's all there is to it! 

From here you can inspect your builds in Google Cloud Build's history.  You can also build in third-party integrations via
PubSub. You can find more documentation on how to use third party integrations
 [here](https://cloud.google.com/cloud-build/docs/configure-third-party-notifications).

If you wanted to automatically deploy this code you could add additional steps that enabled continuous delivery. 

Prebuilt cloud builders exist for gcloud, kubectl, etc. The full list can be found at [https://github.com/GoogleCloudPlatform/cloud-builders](https://github.com/GoogleCloudPlatform/cloud-builders).
Google also maintains a community repo for other cloud builders contributed by the public [here](https://github.com/GoogleCloudPlatform/cloud-builders-community).


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
