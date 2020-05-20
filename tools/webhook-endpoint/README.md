# Webhook App Engine Tool
## Webhook App Overview
The webhoook tool is intended to be an easy to deploy and easy to manage
application.  You can use it to recieve and process any un-authenticated http(s)
data.

## How to Deploy

- Step 1) Create a GCP Project you want the application to be deployed in
- Step 2) Edit the WEBHOOK.env file with your desired configurations and naming
- Step 3) Run ./build.sh

That's it!  All resources will be deployed via Terraform.

To tear down the setup run ./tear_down.sh

