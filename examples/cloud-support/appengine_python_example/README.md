# Cloud Support API (v2) Samples

## About the Support API

The [Cloud Support API](https://cloud.google.com/support/docs/reference/rest) provides programmatic access to Google Cloud's Support interface. You can use the Cloud Support API to integrate Cloud Customer Care with your organization's customer relationship management (CRM) system. The Cloud Support API enables users to complete various support tasks directly in your CRM, including:

- Create and manage support cases.
- List, create, and download attachments for cases.
- List and create comments in cases.

## Background

This repository is a single page application in Python which implements the Support API V2, which can be deployed to App Engine Standard. 

You might have seen a similar example showcased in a recent Google Cloud Blog! Please note that this is meant purely for demonstration purposes. 

## Setup

We need to set up the following before getting started:

- A Google Cloud project with an active Standard, Premium, or Enhanced support account
- Enable the Cloud Support API in the Cloud Console.
- [Create a service account](https://cloud.google.com/docs/authentication/getting-started) with the “Organization Viewer” role or any role that grants the “resourcemanager.organizations.get” permission, and Tech Support Editor. App Engine will provide authentication automatically using an access token generated from this service account when calling the Support API.

Note: Since we will specify this as the service account for App Engine to use, add any other applicable [roles needed for deploying to App Engine](https://cloud.google.com/iam/docs/understanding-roles#app-engine-roles), or simply add Project Editor role to cover the other permissions needed.


After cloning this directory, make the following changes:
 
- In ‘main.py’, set the `ORGANIZATION_ID’ variable to your own Organization ID. 
- Update the ‘app.yaml’ file with the Service Account email address created above.

## Deploy

Once the setup has been completed, open a terminal with the [gcloud CLI](https://cloud.google.com/sdk/docs/install) installed.

Then, run [the command](https://cloud.google.com/sdk/gcloud/reference/app/deploy) “gcloud app deploy” from the directory of the cloned repository. 

Once the App Engine application is deployed, you can view the application with [the command](https://cloud.google.com/sdk/gcloud/reference/app/browse) “gcloud app browse”, or by navigating to the default URL for your App Engine application. 

## Using the Application

For this example application, only the Google Meet URL is a required field. Feel free to fill out other fields, and see the application in action! 

Note: In this example, the [request body](https://cloud.google.com/support/docs/reference/rest/v2beta/cases) sent to the Create Case method has the field “testCase:True”. You should keep this while testing the API, but please note that these Support Cases will not get assigned to a Google Support Engineer. 

