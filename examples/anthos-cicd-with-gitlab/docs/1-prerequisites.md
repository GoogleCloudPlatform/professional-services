# Prerequisites

## Google Cloud Platform

This tutorial uses Anthos which is on the Google Cloud Platform (GCP). If you don’t have an account, you can [sign up](https://cloud.google.com/free/) for $300 in free credits. 

Estimated cost to run this tutorial is $9 per day.

After signing up, [create](https://cloud.google.com/resource-manager/docs/creating-managing-projects) a GCP project and [attach](https://cloud.google.com/billing/docs/how-to/modify-project) to a billing account.


## GitLab

This tutorial uses GitLab for code repository and for continuous integration & continuous delivery.

[Sign up](https://gitlab.com/users/sign_up) to create a GitLab account if you don’t already have one.

To grant your laptop access to make changes as this account, generate and add SSH keys to your account.

Generate SSH keys:


```bash
ssh-keygen
```


It is recommended to add a passphrase when generating new ssh keys, but for this demo you can proceed without setting one. 

Copy content of `id_rsa.pub`, paste in the [key textbox](https://gitlab.com/-/profile/keys) and add key.

Create a [new public group](https://gitlab.com/groups/new) and  give it a name of choice (e.g anthos-demo).  When creating a group, gitlab assigns you a URI. Take note of the URI. All repositories/projects created during this tutorial will be under this group.


## Install and Initialize the Google Cloud SDK

Follow the Google Cloud SDK [documentation](https://cloud.google.com/sdk/docs/install) to install and configure the `gcloud` command line utility.

At the time this doc was created, some tools used in this tutorial are still in beta. To be able to utilize them, install `gcloud beta`


```bash
gcloud components install beta
```


Initialize gcloud config with the project id:


```bash
gcloud init 
```


Then be sure to authorize `gcloud` to access the Cloud Platform with your Google user credentials:


```bash
gcloud auth login
```


## Install Kubectl

The `kubectl` command line utility is used to interact with the Kubernetes API Server. 

Download and install `kubectl` using `gcloud`:


```bash
gcloud components install kubectl
```


Verify installation:


```bash
kubectl version --client
```



## Install nomos

The nomos command is an optional command-line tool used to interact with the Config sync operator. 

Download nomos:


```bash
gcloud components install nomos
```


macOS and Linux clients should run this extra command to configure the binary to be executable.


```bash
chmod +x </path/to/nomos>
```


Move the command to a location your system searches for binaries, such as `/usr/local/bin`, or you can run the command by using its fully-qualified path.

**Environment variables**

The following environment variables are required for some of the commands in this guide


```bash
export PROJECT_ID="<project id you created earlier>"
export PROJECT_NUMBER="$(gcloud projects describe "${PROJECT_ID}" \
--format='value(projectNumber)')"
export USER="<user email you are using>"
export GROUP_NAME="<your gitlab group name>" # if your group name has space(s), replace with `-`
export GROUP_URI="<your gitlab group URI>"
export REGION="us-central1"
export ZONE="us-central1-c"
```


**APIs**

Enable all the APIs that are required for this guide:

 
```bash
gcloud services enable \
   anthos.googleapis.com \
   anthosgke.googleapis.com \
   anthosaudit.googleapis.com \
   binaryauthorization.googleapis.com \
   cloudbuild.googleapis.com \
   containerscanning.googleapis.com \
   cloudresourcemanager.googleapis.com \
   container.googleapis.com \
   gkeconnect.googleapis.com \
   gkehub.googleapis.com \
   serviceusage.googleapis.com \
   stackdriver.googleapis.com \
   monitoring.googleapis.com \
   logging.googleapis.com
```

Next: [Register GKE Clusters with Anthos](2-register-gke-clusters-with-anthos.md)