# MLOps with Vertex AI - GIT setup

## Introduction

Clone the Google Cloud Professional services [repo](https://github.com/pbalm/professional-services/tree/vertex-mlops/examples/vertex_mlops_enterprise) to a temp directory and select the `jgpuga/mlops` branch: 
```
git clone https://github.com/pbalm/professional-services.git`
cd professional-services/
git checkout jgpuga/mlops
```

Setup your new Github repo.

Copy the `vertex_mlops_enterprise` folder to your local folder
```
cp -R ./examples/vertex_mlops_enterprise/* ./<YOUR LOCAL FOLDER>
```

Commit the files in the dev branch (`main`):
```
git init
git add *
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<ORG>/<REPO>.git
git push -u origin main
```

## Branches
Create the additional branches in Github (`dev`, `staging`, `prod`). This can be also done from the UI (`Create branch: dev from main`).

Pull the remote repo with `git pull`.

Checkout the staging branch with `git checkout dev`.

Rename the `*.yml.TEMPLATE` files in the `.github/workflows` to `*.yml` and edit the files (env section) to set up correctly the references to the related project in GCP (PROJECT_ID and PROJECT_NUMBER).

Edit the yaml files in the `build` folder to set up correctly the references to the related project in GCP and Github repo, updating the following parameters: `PROJECT_ID`, `GITHUB_ORG` and `GITHUB_REPO`.

## Accessing GitHub from Cloud Build via SSH keys
Follow this procedure to create a private SSH key to be used for Github access from Cloud Build:
https://cloud.google.com/build/docs/access-github-from-build

```
mkdir workingdir
cd workingdir
ssh-keygen -t rsa -b 4096 -N '' -f id_github -C <GITHUB_EMAIL>
ssh-keyscan -t rsa github.com > known_hosts.github
zip known_hosts.github.zip known_hosts.github
```

Add the public SSH key to your private repository's deploy keys.

Store the private SSH key in Secret Manager, in the `github-key` secret.
