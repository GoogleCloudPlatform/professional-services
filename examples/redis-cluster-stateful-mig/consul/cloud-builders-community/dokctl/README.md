## Dokctl - Digital Ocean Kubectl

This will help digital ocean kubernetes users for their CI/CD integration with Google CloudBuild. 

## Using this builder with Digital Ocean Kubernetes Cluster

Example cloudbuild.yaml is available in examples/pods-list directory

## Dependencies 

This tool uses following dependencies 
* [Kubectl](https://github.com/kubernetes/kubectl) (Kubernetes cli tool)
* [Doctl](https://github.com/digitalocean/doctl) (DigitalOcean cli tool)

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml
