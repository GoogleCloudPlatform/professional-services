# MLOps with Vertex AI - GIT setup

## Introduction

Clone the Google Cloud Professional services [repo](https://github.com/GoogleCloudPlatform/professional-services) to a temp directory: 
```
git clone https://github.com/GoogleCloudPlatform/professional-services.git`
cd professional-services/
```

Setup your new Github repo.

Copy the `vertex_mlops_enterprise` folder to your local folder, including the Github actions:

```
cp -R ./examples/vertex_mlops_enterprise/* ./<YOUR LOCAL FOLDER>
cp -R ./examples/vertex_mlops_enterprise/.github ./<YOUR LOCAL FOLDER>
```

Commit the files in the main branch (`main`):
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


Review the files `*.yml` files in the `.github/workflows` and modify them if needed. These files should be automatically updated when launched terraform.

Review the files `*.yaml` files in the `build` folder and modify them if needed. These files should be automatically updated when launched terraform.

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
