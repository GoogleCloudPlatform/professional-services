## BigQuery Notifier

This code is a prototype and not engineered for production use. 
Error handling is incomplete or inappropriate for usage beyond 
a development sample.

Tool to create org-level stackdriver export with BQ Filter for JobCompleted events

* Org wide-export for JobCompleted events -> PubSub
	* Possible uses
		* label of 'bqnemail' sends email (i.e. through sendgrid) to the job's user's email.
		* label of 'bqntopic' with a value of "sometopicname" publishes a message to the topic under the project the job ran under.
		* (***example code included***) label of 'bqnslack' with a token (with ```/```'s replaced with ```-```'s) of webhook
	

## Preflight
For our example, we'll setup terraform on the cloud-shell instance.
Please note, if you're using terraform for more than this example you'll want to follow terraform standard best practices.
* [Install Terraform](https://learn.hashicorp.com/terraform/getting-started/install.html)
    * [Download binary](https://www.terraform.io/downloads.html). For cloud console, select linux 64bit.
    * Extract binary, move somewhere on path and ```chmod +ux```
* Install/Update Google SDK (installed already cloud shell)
* Init gcloud auth (unnecessary on cloud shell)
* Setup application-default auth for terraform*
* [Install Golang](https://golang.org/doc/install)
* Setup git config
    * git config --global user.email "you@example.com"
    * git config --global user.name "Your Name"
\* Using application-default auth for terraform isn't the best practice, but it's the easiest to setup. For Production terraform use, please follow terraform on GCP best practices.

## Setup
* Aquire code (git clone this repository and move to the directory this README is in.
* Copy ```terraform.tfvars-example``` to ```terraform.tfvars```, and modify it's contents.
* Run ```terraform init``` to install google provider.
* Run ```terraform plan```

### Note:
When you run this next command, it will make changes to your google cloud platform, which may incur charges.

* Run ```terraform apply```

## Workflow

* Perform the following, pulling the variables you configured in ``terraform.tfvars```

    gcloud source repos clone ```repo_name``` --project ```project_id```
    cd ```repo_name```
    git checkout --track origin/```branch_id```
    make the changes, test, etc
    git push
