# State Tool

[State Tool] allows you to install Language Runtime Environments from the [ActiveState Platform].
For [State Tool] usage reference the ActiveState Platform [Documentation].

This document details the runtime usage, meaning you will deploy the language runtime environment 
as a step in the cloud build process.

Alternatively you can deploy the language runtime environment when you build the Docker image, which
should significantly increase your cloud build performance. To do this follow the instructions inside
the Dockerfile instead.

## Usage

Minimal usage example to deploy a language runtime environment at runtime:

```yaml
steps:
- name: gcr.io/$PROJECT_ID/state
  args: 
  - state
  - deploy
  - owner/projectName
  - --path=/workspace/.state
```

Replace `owner/projectName` by your project namespace as detailed in the [Documentation].

 - **Note** - For faster performance you can do this at Docker build time. Read the Dockerfile for more information 
   on how to do this.

### Private Projects and State Secrets

To use private projects or [State Tool Secrets] you'll need to create two Application Secrets using the 
[Google Secret Manager].

 - **ACTIVESTATE_API_KEY** - obtained by running `state export new-api-key gcloud`
 - **ACTIVESTATE_PRIVATE_KEY** - obtained by running `state export private-key` (*only required if you intend to use secrets*)
 
Once created ensure that you add `cloudbuild.gserviceaccount.com` as a `Viewer` under the permission 
settings for these secrets.


   [State Tool]: https://www.activestate.com/products/platform/state-tool/
   [ActiveState Platform]: https://www.activestate.com/products/platform/
   [Documentation]: http://docs.activestate.com/platform/state/#usage
   [State Tool Secrets]: http://docs.activestate.com/platform/state/start.html#secrets
   [Google Secret Manager]: https://console.cloud.google.com/security/secret-manager