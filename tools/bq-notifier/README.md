This code is a prototype and not engineered for production use. 
Error handling is incomplete or inappropriate for usage beyond 
a development sample.


## BigQuery Notifier

Tool to create org-level stackdriver export with BQ Filter for JobCompleted events

* Org wide-export for JobCompleted events -> PubSub
	* Possible uses
		* label of 'bqnemail' sends email (i.e. through sendgrid) to the job's user's email.
		* label of 'bqntopic' with a value of "sometopicname" publishes a message to the topic under the project the job ran under.
		* (***example code included***) label of 'bqnslack' with a token (with ```/```'s replaced with ```-```'s) of webhook

## Overview

The terraform scripts included will activate and use the following APIs:
* Cloud Functions
* Source Repositories
* Cloud Builder
   
The overall architecture is:
* Org-wide aggregated log sync of BigQuery JobComplete events with a pubsub topic destination
* A cloud function in Golang that triggers off the pubsub topic, who's source is a branch of a cloud repository
* A source repository with a cloud build trigger on a branch that redeploys the cloud function.

The current notifications in ```main.go``` are placeholders indented to be modified or added to with your desired notifications.

    	bqn.AddHook(func(job Job, data interface{}) error {
    		log.Printf("DEBUG: Found Job: %s from user %s with labels: %v\n", &job, job.UserEmail(), job.Labels())
    		return nil
    	})

Each method gets passed the "Job" with some specific information parsed out of the log entry, and a 'data' of the full unmarshaled log entry.

The intended way of setting this up is a single centrally managed function that implements the org-wide notification methods. Each method using information from the ```Job``` to notify the specific user/team/topic.
* As an example, a "PubSub" notification *method* that, if a label matching 'bqntopic' is found, it sends a message to the project the job ran from using the labels value as the topic name. It could pass the full set of data to the downstream topic so the subsequent subscribers could use values that didn't need to be extracted for the notification.
    * This would allow a single function and centrally managed codebase, but allow an individual team to run their own topic and specify which topic they'd like that notification to go to.
    
* Another example, say if adding labels to BQ jobs is hard since it can't be done yet through the UI, a method could be added to parse the actual query and look for a specially formatted comment, designating the topic/slack channel/email to sent the notification..

## Preflight
For our example, we'll setup terraform on the cloud-shell instance.
Please note, if you're using terraform for more than this example you'll want to follow terraform standard best practices.
* [Install Terraform](https://learn.hashicorp.com/terraform/getting-started/install.html)
    * [Download binary](https://www.terraform.io/downloads.html). For cloud console, select linux 64bit.
    * Extract binary, move somewhere on path and ```chmod +ux```
* Install/Update Google SDK (installed already cloud shell)
* Init gcloud auth (unnecessary on cloud shell)
* Setup application-default auth for terraform* (unnecessary on cloud shell)
* [Install Golang](https://golang.org/doc/install)
* Setup git config
    * git config --global user.email "you@example.com"
    * git config --global user.name "Your Name"
\* Using application-default auth for terraform isn't the best practice, but it's the easiest to setup. For Production terraform use, please follow terraform on GCP best practices.

## Setup
* Aquire code (git clone this repository and move to the directory this README is in.
* Copy ```terraform.tfvars-example``` to ```terraform.tfvars```, and modify it's contents.
* Run ```terraform init``` to install the terraform google provider.
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
