# Binary Authorization Pipeline Blueprint

The following blueprint shows to how to create a CI and a CD pipeline in Cloud Build for the deployment of an application to a private GKE cluster with unrestricted access to a public endpoint. The blueprint enables a Binary Authorization policy in the project so only images that have been attested can be deployed to the cluster. The attestations are created using a cryptographic key pair that has been provisioned in KMS.

The diagram below depicts the architecture used in the blueprint.

![Architecture](diagram.png)

The CI and CD pipelines are implemented as Cloud Build triggers that run with a user-specified service account. 

The CI pipeline does the following:

* Builds and pushes the image to Artifact registry
* Creates an attestation for the image.

The CD pipeline deploys the application to the cluster.

## Running the blueprint

Clone this repository or [open it in cloud shell](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fterraform-google-modules%2Fcloud-foundation-fabric&cloudshell_print=cloud-shell-readme.txt&cloudshell_working_dir=blueprints%2Fcloud-operations%2Fbinauthz), then go through the following steps to create resources:

* `terraform init`
* `terraform apply -var project_id=my-project-id`

WARNING: The blueprint requires the activation of the Binary Authorization API. That API does not support authentication with user credentials. A service account will need to be used to run the blueprint

## Testing the blueprint

Once the resources have been created, do the following to verify that everything works as expected.

1. Fetch the cluster credentials

        gcloud container clusters get-credentials cluster --project <PROJECT_ID>
    
2. Apply the manifest tenant-setup.yaml available in your work directory.

        kubectl apply -f tenant-setup.yaml

   By applying that manifest thw following is created:

    * A namespace called "apis". This is the namespace where the application will be deployed. 
    * A Role and a RoleBinding in previously created namespace so the service account that has been configured for the CD pipeline trigger in Cloud Build is able to deploy the kubernetes application to that namespace.

3. Change to the image subdirectory in your work directory

        cd <WORK_DIR>/image 

4. Run the following commands:

        git init
        git remote add origin ssh://<USER>:2022/p/<PROJECT_ID>/r/image
        git push -u origin main

4. In the Cloud Build > History section in the Google Cloud console you should see a job running. That job is build the image, pushing to Artifact Registry and creating an attestation.

    Once the job finishes copy the digest of the image that is displayed in the Cloud Build job output.

5. Change to the app subdirectory in your working directory.

        cd <WORK_DIR>/app

6. Edit the app.yaml file and replace the string DIGEST with the value you copied before.

7. Run the following commands:

        git init
        git remote add origin ssh://<USER>:2022/p/<PROJECT_ID>/r/app
        git push -u origin main

8. In the Cloud Build > History section in the Google Cloud console you should see a job running. The job will deploy the application to the cluster.

9. Go to the Kubernetes Engine > Workloads section to check that the deployment was successful and that the Binary Authorization admissions controller webhook did not block the deployment.

10. Change to the working directory and try to deploy an image that has not been attested.

        cat <<EOF | kubectl apply -f -
        apiVersion: apps/v1
        kind: Deployment
        metadata:
        name: nginx-deployment
        spec:
        selector:
            matchLabels:
            app: nginx
        replicas: 2 
        template:
            metadata:
            labels:
                app: nginx
            spec:
            containers:
            - name: nginx
                image: gcr.io/google-containers/nginx:latest
                ports:
                - containerPort: 80
        EOF


9. Go to the Kubernetes Engine > Workloads section to check that that the Binary Authorization admissions controller webhook did not block the deployment.

The application deployed to the cluster is an RESTful API that enables managing Google Cloud storage buckets in the project. Workload identity is used so the app can interact with the Google Cloud Storage API.

Once done testing, you can clean up resources by running `terraform destroy`.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L26) | Project ID. | <code>string</code> | ✓ |  |
| [master_cidr_block](variables.tf#L49) | Master CIDR block. | <code>string</code> |  | <code>&#34;10.0.0.0&#47;28&#34;</code> |
| [pods_cidr_block](variables.tf#L37) | Pods CIDR block. | <code>string</code> |  | <code>&#34;172.16.0.0&#47;20&#34;</code> |
| [prefix](variables.tf#L31) | Prefix for resources created. | <code>string</code> |  | <code>null</code> |
| [project_create](variables.tf#L17) | Parameters for the creation of the new project. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [region](variables.tf#L61) | Region. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [services_cidr_block](variables.tf#L43) | Services CIDR block. | <code>string</code> |  | <code>&#34;192.168.0.0&#47;24&#34;</code> |
| [subnet_cidr_block](variables.tf#L55) | Subnet CIDR block. | <code>string</code> |  | <code>&#34;10.0.1.0&#47;24&#34;</code> |
| [zone](variables.tf#L67) | Zone. | <code>string</code> |  | <code>&#34;europe-west1-c&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [app_repo_url](outputs.tf#L22) | App source repository url. |  |
| [image_repo_url](outputs.tf#L17) | Image source repository url. |  |

<!-- END TFDOC -->
