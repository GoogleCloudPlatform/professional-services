# Cloud Support API (v2) Samples


The [Cloud Support API](https://cloud.google.com/support/docs/reference/rest) provides programmatic access to Google Cloud's Support interface. You can use the Cloud Support API to integrate Cloud Customer Care with your organization's customer relationship management (CRM) system. The Cloud Support API enables users to complete various support tasks directly in your CRM, including:

- Create and manage support cases.
- List, create, and download attachments for cases.
- List and create comments in cases.

## Setup

We need to set up the following before getting started:

- A Google Cloud project with an active Premium or Enhanced support account
- Enable the Cloud Support API
- [Create a service account](https://cloud.google.com/docs/authentication/getting-started) with the “Organization Viewer” role or any role that grants the “resourcemanager.organizations.get” permission
- Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to the downloaded credentials JSON file.

## Running

To run a specific sample, edit any variables under the `TODO(developer):` in the
function at the top of each sample, and then execute the function as convenient.

For example, if using the command line you might use the following (replacing 
`<CLASS_NAME>` with the name of the sample):
```bash
mvn exec:java -Dexec.mainClass="com.example.gcpsupport.<CLASS_NAME>"
```

You can start with the Starter.java code to see how to initialize and get started with the Cloud Support API (v2). Other provided Java classes show the main functionalities of the Cloud Support API (v2).

## Testing

### Setup
- Ensure that `GOOGLE_APPLICATION_CREDENTIALS` points to authorized service account credentials file.
- Set the `PARENT_RESOURCE` environment variable to the GCP project you're working with. This should be in the form of "projects/<---project id--->"

### Run
Run all tests:
```
   mvn clean verify
```