# Webhook App Engine Tool
## Webhook App Overview
It can often be helpful to have an easy to deploy and easy to manage endpoint which load data into your Data Warehouse.  Use cases include:

- Javascript SDK data from your website for custom analytics or A/B testing
- Mobile IOS or Android SDKs to track and manage app usage
- Many SaaS offerings can supply data via webhooks to give you realtime access to important data
	- Stripe allows you to receive purchase data realtime via webhooks
	- Others include Atlassian, Segment, and many more
- Custom development is easier for your team when they only need to read data and forward it.  You can optionally use App Engine or Pub/Sub directly without breaking the pipeline.

The webhoook tool is intended to be an easy to deploy and easy to manage
application.  You can use it to recieve and process any un-authenticated http(s)
data.

## How to Deploy

- Step 1) Create a GCP Project you want the application to be deployed in
- Step 2) Edit the WEBHOOK.env file with your desired configurations and naming
- Step 3) Ensure variables are set via `make`
- Step 4) Build Webhook Application via `make build`
- Finally) Tear Down Webhook Application via `make destroy`

That's it!  All resources will be deployed via Terraform.

To tear down the setup run ./tear_down.sh
