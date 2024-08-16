Copyright 2024 Google. This software is provided as-is, without warranty or
representation for any use or purpose. Your use of it is subject to your
agreement with Google.

# Five9 Voicestream Integration with Agent Assist

This is a PoC to integrate Five9 Voicestream with Agent Assist.

## Project Structure

```
.
├── assets
│   └── FAQ.csv
├── client
│   ├── audio
│   │   ├── END_USER.wav
│   │   └── HUMAN_AGENT.wav
│   └── client_voicestream.py
├── .env
├── proto
│   ├── voice_pb2_grpc.py
│   ├── voice_pb2.py
│   └── voice.proto
├── README.md
├── requirements.txt
└── server
    ├── server.py
    ├── services
    │   └── get_suggestions.py
    └── utils
        ├── conversation_management.py
        └── participant_management.py
```

## Components
- Agent Assist
- Five9 with VoiceStream

## Setup Instructions

### GCP Project Setup

#### Creating a Project in the Google Cloud Platform Console

If you haven't already created a project, create one now. Projects enable you to
manage all Google Cloud Platform resources for your app, including deployment,
access control, billing, and services.

1. Open the [Cloud Platform Console][cloud-console].
1. In the drop-down menu at the top, select **Create a project**.
1. Give your project a name.
1. Make a note of the project ID, which might be different from the project
   name. The project ID is used in commands and in configurations.

[cloud-console]: https://console.cloud.google.com/

#### Enabling billing for your project.

If you haven't already enabled billing for your project, [enable
billing][enable-billing] now. Enabling billing allows is required to use Cloud
Bigtable and to create VM instances.

[enable-billing]: https://console.cloud.google.com/project/_/settings

#### Install the Google Cloud SDK.

If you haven't already installed the Google Cloud SDK, [install the Google
Cloud SDK][cloud-sdk] now. The SDK contains tools and libraries that enable you
to create and manage resources on Google Cloud Platform.

[cloud-sdk]: https://cloud.google.com/sdk/

#### Setting Google Application Default Credentials

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

#### Create a Knowledge Base

Agent Assist follows a conversation between a human agent and an end-user and provide the human agent with relevant document suggestions. These suggestions are based on knowledge bases, namely, collections of documents that you upload to Agent Assist. These documents are called knowledge documents and can be either articles (for use with Article Suggestion) or FAQ documents (for use with FAQ Assist).

In this specific implementation, a CSV sheet with FAQ will be used as knowledge document.
> [FAQ CSV file](./assets/FAQ.csv)
> [Create a Knowledge Base](https://cloud.google.com/agent-assist/docs/knowledge-base)

#### Create a Conversation Profile

A conversation profile configures a set of parameters that control the suggestions made to an agent.

> [Create/Edit an Agent Assist Conversation Profile](https://cloud.google.com/agent-assist/docs/conversation-profile#create_and_edit_a_conversation_profile)

While creating the the conversation profile, check the FAQs box. In the "Knowledge bases" input box, select the recently created Knowledge Base. The other values in the section should be set as default.

Once the conversation profile is created, you can find the CONVERSATION_PROFILE_ID (Integration ID) in the following ways:

> Open [Agent Assist](https://agentassist.cloud.google.com/), then Conversation
> Profiles on the left bottom

### Usage Pre-requisites

- FAQs Suggestions should be enabled in the Agent Assist Conversation Profile
- Agent Assist will only give you suggestions to conversations with Human Agents. It will not
  give suggestions if the conversation is being guided by virtual agents.


### Local Development Set Up

This application is designed to run on port 8080. Upon launch, the
application will initialize and bind to port 8080, making it accessible for
incoming connections. This can be changed in the .env file.

#### Protocol Buffer Compiler:

This implementation leverages from Buffer compilers for service definitions and data serialization. In this case, protoc is used to compile Five9's protofile.

 ```
NOTE: The compilation of the Five9's Voicestream protofile was already made, therefore this step can be skipped. But if an update of the protofile is needed, please follow these steps to properly output the required python files.
 ```

> [Protocol Buffer Compiler Installation](https://grpc.io/docs/protoc-installation/)
> [Five9's Voicestream protofile](./proto/voice.proto)

To compile the protofile:
> Open a terminal window
> Go to the root where your proto folder is
> Run the following command:
   ```
   python3 -m grpc_tools.protoc -I proto --python_out=proto --grpc_python_out=proto proto/voice.proto
   ```
> Two python files will be generated inside the proto folder.
   > [voice_pb2_grpc.py](./proto/voice_pb2_grpc.py)
   > [voice_pb2.py](./proto/voice_pb2.py)


#### Set of variables:

The following variables need to be set up in the .env file inside the root folder

```
SERVER_ADDRESS : 
   Target server address

PORT :
   Connection Port
   
PROJECT_ID :
   GCP Project ID where the Agent Assist Conversation Profile is deployed.

CONVERSATION_PROFILE_ID : 
   Agent Assist Conversation Profile ID

CHUNK_SIZE :
   Number of bytes of audio to be sent each time

RESTART_TIMEOUT :
   Timeout of one stream

MAX_LOOKBACK : 
   Lookback for unprocessed audio data
   
```

### Steps to follow

## Start gRPC Server

Start the gRPC Server controller. This will start a server on port 8080, where the voicestream client will send the data.

> [Server Controller](./server/server.py)

Inside the server folder, run the following command:

```
python server.py
```

## Start gRPC Client 

According to Five9's Self Service Developer Guide:

```
VoiceStream does not support multi-channel streaming. VoiceStream
transmits each distinct audio stream over a separate gRPC session: one
for audio from the agent, and one for audio to the agent.
```

In order to simulate this behaviour using our local environment, the same script should be run simultaneously. One that sends the customer audio (END_USER) and one that sends the agent audio (HUMAN_AGENT)

> [Five9 Voicestream Client](./client/client_voicestream.py)

Inside the client folder, run the following command to send the human agent audio:

```
python client_voicestream.py --role=HUMAN_AGENT --call_id=<CALL_ID>

```
In another terminal, run the following command to send the customer audio:
```
python client_voicestream.py --role=END_USER --call_id=<CALL_ID>

```

In order for both streams to be associated to the same conversation it is fundamental to specify a destination CONVERSATION_ID. For this to happen, the CALL_ID specified in the initial configuration sent by Five9 will be passed to the Agent Assist as the internal CONVERSATION_ID. In this implementation, we are manually defining this CALL_ID for testing purposes.


# References
1.[Agent Assist Documentation](https://cloud.google.com/agent-assist/docs)
2.[Dialogflow](https://cloud.google.com/dialogflow/docs)
3.[Five9 VoiceStream](https://www.five9.com/news/news-releases/five9-announces-five9-voicestream)
4,[Five9 VoiceStream Release Notes](https://releasenotes.five9.com/space/RNA/23143057870/VoiceStream)

