```
Copyright 2023 Google. This software is provided as-is, without warranty or
representation for any use or purpose. Your use of it is subject to your
agreement with Google.
```
## Technology Stack
- Google Cloud Run
- Google Artifact Registry
- Google Cloud Storage
- Google Speech to Text
- Vertex AI Conversation
- Dialogflow CX
- Dialogflow CX Agent
- Google Data Store
- Google Secret Manager
- Gradio

## GCP Project Setup

### Creating a Project in the Google Cloud Platform Console

If you haven't already created a project, create one now. Projects enable you to
manage all Google Cloud Platform resources for your app, including deployment,
access control, billing, and services.

1. Open the [Cloud Platform Console][cloud-console].
2. In the drop-down menu at the top, select **NEW PROJECT**.
3. Give your project a name.
4. Make a note of the project ID, which might be different from the project
   name. The project ID is used in commands and in configurations.

[cloud-console]: https://console.cloud.google.com/

### Enabling billing for your project.

If you haven't already enabled billing for your project, [enable
billing][enable-billing] now. Enabling billing allows is required to use Cloud
Bigtable and to create VM instances.

[enable-billing]: https://console.cloud.google.com/project/_/settings

### Install the Google Cloud SDK.

If you haven't already installed the Google Cloud SDK, [install the Google
Cloud SDK][cloud-sdk] now. The SDK contains tools and libraries that enable you
to create and manage resources on Google Cloud Platform.

[cloud-sdk]: https://cloud.google.com/sdk/

### Setting Google Application Default Credentials

Set your [Google Application Default
Credentials][application-default-credentials] by [initializing the Google Cloud
SDK][cloud-sdk-init] with the command:

```
   gcloud init
```

Generate a credentials file by running the
[application-default login](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login)
command:

```
    gcloud auth application-default login
```

[cloud-sdk-init]: https://cloud.google.com/sdk/docs/initializing

[application-default-credentials]: https://developers.google.com/identity/protocols/application-default-credentials

## Upload your data to a Cloud Storage bucket
Follow these [instructions][instructions] to upload your pdf documents 
or pdf manuals to be used in this example

[instructions]:https://cloud.google.com/storage/docs/uploading-objects
 
## Create a Generative AI Agent
Follow the instructions at this [link][link] and perform the following:
1. Create Data Stores: Select information that you would like the Vertex AI Search and Conversation to query
2. Create an Agent: Create the Dialogflow CX agent that queries the Data Store
3. Test the agent in the simulator
4. Take note of you agent link by going to [Dialogflow CX Console][Dialogflow CX Console] and see the information about the agent you created

[link]: https://cloud.google.com/generative-ai-app-builder/docs/a
[Dialogflow CX Console]:https://cloud.google.com/dialogflow/cx/docs/concept/console#agent

### Dialogflow CX Agent Data Stores
Data Stores are used to find answers for end-user's questions. 
Data Stores are a collection documents, each of which reference your data.

For this particular example data store will consist of the following characteristics:
1. Your organizational documents or manuals.  
2. The data store type will be unstructured in a pdf format
3. The data is uploaded without metadata for simplicity.
Only need to point the import to the gcp bucket folder where the pdf files are. 
Their extension will decide their type.

When an end-user asks the agent a question, the agent searches for an answer from the 
given source content and summarizes the findings into a coherent agent response. 
It also provides supporting links to the sources of the response for the end-user to learn more. 



