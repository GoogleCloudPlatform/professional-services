# BigQuery Remote Function bridge for Claude API

This sample solution automates the creation of a GCP Cloud Function that can be registered as a remote function for BQ to interact with Claude API. The cloud function code can be configured with multiple ClaudeAPI keys to be able to scale the throughput of requests from the BigQueruy executions.

To have all the necessary pieces together terraform is used to provision the infrastructure. Among the components this solution implements we can find:
* [Micronaut](https://micronaut.io) based implementation for the logic of the CloudFunction
* GCP Storage buckets to stage all the cloud function resources
* IAM permissions to grant the needed access for the cloud function and the BigQuery service account in charge to call the deployed cloud function
* BigQuery connection and the routing that wraps the cloud function remote call

## Deployment

The simplest environment to quickly test this solution would be to use the `cloudshell` functionality on GCP. The `cloudshell` can be accessed directly from the GCP project UI and it already contains the requirements for this solution, terraform and Java installed, only a few tweaks are needed.

First step implies opening the `cloudshell` terminal and checkout this code:
```bash
> git clone https://github.com/anniexudan/bqtoclaude.git
...
> cd bqtoclaude/bq_remotefunction_claudeapi_sample
```

Then we need to gather the Claude API keys that will be used by this solution. By creating a file named `terraform.tfvars` under the infra folder we are instructing terraform to use those values as part of the infrastructure provisioning. See the next example for the file's content:

```
claude_tokens = [
	"KEY1",
  "KEY2",
  ...
]
```

Many variables can be configured for terraform to use, particularly variables with default values:
* `region` which controls the GCP region where the Cloud function will be deployed
* `max_batching_rows` the number of BigQuery rows that will be batched when calling the remote function
* `max_tokens` the max number of tokens that we want returned from Claude API interactions
* `system_prompt` the prompt that the Claude API will use

Once the variables are set, and given the cloud function code is implemented using Java version 21, we need to setup the right version for code compilation.

```bash
> export $JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
```

This will inform the provided maven executable which version of java to use.

We recommend to set up the `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` environment variable to a service account having the right permissions to run terraform in the GCP project. Not setting this variable will indicate terraform to use the current user, which may not have the right permissions to create the needed resources.

To fully deploy the solution run the `setup.sh` script, which will first compile the cloud function code and then configure terraform to provision the needed resources. The script will ask for a GCP project id, a bucket to stage the terraform state and a BigQuery dataset used to create the remote function routine.

## Example BigQuery usage

After the cloud function deployment is completed and the routine was created in the provided dataset, using it is pretty simple:

``` SQL
-- "functions" dataset was provided as parameter in the setup for this BigQuery routine.
select msg, functions.claude_messages(msg) as response
from
  UNNEST([
    'describe what a color is',
    'summarize the events happening in the movie Interstellar'
  ]) as msg
```

The cloud function logic will be able to deal with API token resouce exhaustion and handle the needed backoffs to complete the task. Bear in mind that there is no real progress tracking, and full result set resolution will take time. For example, the basic tier for Claude API supports 5 requests per minute, so sending more than 10 rows to process implies several retries to complete the full request (this can take more than 2 minutes given all the default limits). In case of needing more throughput, setting up more than one Token Key (from different billing accounts) with a higher request per minute limit would be the way to go.

## Infrastructure Cleanup

In case of needed to cleanup the resources used to setup this example remote function on BigQuery, running the `destroy.sh` script will take care of tearing down those resources created by `terraform`.