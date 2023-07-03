Copyright 2023 Google. This software is provided as-is, without warranty or
representation for any use or purpose. Your use of it is subject to your
agreement with Google.

# Twilio Conversation Integration with a Virtual Agent using Dialogflow

This is an example how to integrate a Twilio Conversation Services with Virtual 
Agent using Dialogflow.

## Project Structure

```
.
└── twilio
   └── src
   └── main
           └── java
               └── com.middleware.controller
                   ├── cache # redis initialization and mapping of conversations
                   ├── dialogflow # handler of a conversation with dialogflow
                   ├── rest # entry point and request handler
                   ├── twilio # marketplace and twilio conversation services set up and initialization
                   ├── util # utility to inittialize a twilio conversation to test the integration  
                   └── webhook # classes to process new message and new participant    
          └── resources
              └── application.properties
          └── proto
              └── dialogflow.proto # dialogflow conversation information holder
   ├── pom.xml
   └── README.md
```

## Components

- Dialogflow
- Google Cloud MemoryStore (Redis)
- Twilio with Flex

## How mapping between Twilio Conversation and Dialogflow Conversation is implemented

We use a mapping between the Twilio Conversation SID and the Dialogflow Conversation ID
to maintain the conversation context. This mapping is stored in the [Redis
cache.](https://cloud.google.com/memorystore/docs/redis/redis-overview) and it works as followed:

1. If there is no active conversation available in
   the Redis cache, we create a new Dialogflow conversation and store the
   mapping in the Redis cache.
2. If there is an active conversation available in the Redis cache, we use
   the same Dialogflow conversation to send the message to the Dialogflow
   agent.
3. If the user is not already present in the conversation, we add them to the
   conversation.
4. On each message, we send the message to the Dialogflow agent and get the
   response
   using [AnalyzeContent API](https://developers.google.com/resources/api-libraries/documentation/dialogflow/v2beta1/java/latest/index.html?com/google/api/services/dialogflow/v2beta1/Dialogflow.Projects.Conversations.Participants.AnalyzeContent.html)
5. Reply message is sent to the user using the Twilio Conversations API.
6. At the time of handoff, we send the conversation context to the Flex UI
   using the [Interaction API](https://www.twilio.com/docs/flex/developer/conversations/interactions-api/interactions).
7. If the Agent Assist feature is enabled, we won't close the conversation in
   Dialogflow. Otherwise, we will close the conversation in Dialogflow if
   agent-handoff or end-of-conversation is detected.
9. If the conversation is closed in Dialogflow, we delete the mapping from
   the Redis cache.

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

### Local Development Set Up

This is a Spring Boot application designed to run on port 8080. Upon launch, the
application will initialize and bind to port 8080, making it accessible for
incoming connections.

#### Set of environment variables:

The following environmental variables need to be set up in the localhost:

```
REDIS_HOST :
   IP address of the Redis instance

REDIS_PORT :
   Port of the Redis instance (Default: 6379)
```

```
TWILIO_ADD_ON_CONVERSATION_PROFILE_ID : 
   Dialogflow Conversation Profile ID (Provided by Twilio Integration)

TWILIO_ADD_ON_PROJECT_ID :
   GCP Project ID where the Dialogflow Agent is deployed (Provided
   by Twilio Integration)

TWILIO_ADD_ON_AGENT_LOCATION(Optional):
   Dialogflow Agent Location (Provided by Twilio Integration). Default: global
```   

```
TWILIO_ACCOUNT_SID :
   Twilio Account SID

TWILIO_AUTH_TOKEN :
   OAuth Token for the Twilio Account

TWILIO_WORKSPACE_SID :
   Flex Workspace SID, (Used for interaction task creation)
   
TWILIO_WORKFLOW_SID :
   Flex Workflow SID, (Used for interaction task creation)   
```

#### Redis Set Up

##### Install a Redis Emulator

Please refer to this [doc](https://redis.io/docs/getting-started/) to install a
redis emulator in your localhost

For Linux:
[Install Redis on Linux](https://redis.io/docs/getting-started/installation/install-redis-on-linux/)

##### Initialized the server

```
   $ redis-server
```

##### Basic commands to access the data

List all the keys

```
  $ redis-cli
   127.0.0.1:6379> KEYS *
   (empty array)
```

Delete a key

```
   127.0.0.1:6379> DEL "<key>"
```

Get a key

```
  127.0.0.1:6379> GET "<key>"
```

## Usage

### Endpoints

> POST /handleConversations

Events Handled

1. **onParticipantAdded** : Expected Variables from the request
    - ConversationSid
2. **onMessageAdded** : Expected Variables from the request
    - ConversationSid
    - Body
    - Source


### Initialize the application

Reference: [Building an Application with Spring Boot](https://spring.io/guides/gs/spring-boot/)

```
   ./mvnw spring-boot:run
```

### Send a request

```
 curl --location --request POST 'localhost:8080/handleConversations' \
 --header 'Content-Type: application/x-www-form-urlencoded' \
 --data-urlencode 'Body=Talk to agent' \
 --data-urlencode 'EventType=onMessageAdded' \
 --data-urlencode 'Source=whatsapp' \
 --data-urlencode 'ConversationSid=XXXXXX' \
```

## How to get the dialogflow conversation profile id

Dialogflow Conversation Profile ID also known as Integration ID is a unique
text which is used for the interaction of Dialogflow with 3rd party applications
like Twilio.

> [Create/Edit a Dialogflow Conversation Profile](https://cloud.google.com/agent-assist/docs/conversation-profile#create_and_edit_a_conversation_profile)

You can also create a conversation profile using Twilio One Click Integration
from the Dialogflow Console.

> Dialogflow Console > Corresponding Agent > Manage > Integrations >
> Twilio > One Click Integration > Connect

Once the conversation profile is created, you can find the conversation profile
id in the following ways:

> Open [Agent Assist](https://agentassist.cloud.google.com/), then Conversation
> Profiles on the left bottom


## How to create a Twilio conversation

1. Create a Conversation programmatically using the
   Twilio [Conversations API](https://www.twilio.com/docs/conversations/api/conversation-resource?code-sample=code-create-conversation&code-language=curl&code-sdk-version=json)
2. Add the customer chat participant to the conversation. Use the SID of the
   conversation that you created in the previous
   step. [Reference](https://www.twilio.com/docs/conversations/api/conversation-participant-resource?code-sample=code-create-conversation-participant-chat&code-language=curl&code-sdk-version=json)
3. Add a [scoped webhook](https://www.twilio.com/docs/conversations/api/conversation-scoped-webhook-resource?code-sample=code-create-attach-a-new-conversation-scoped-webhook&code-language=curl&code-sdk-version=json)
   with "webhook" as the target using the Conversations Webhook endpoint. With a [scoped webhook](https://www.twilio.com/docs/conversations/api/conversation-scoped-webhook-resource?code-sample=code-create-attach-a-new-conversation-scoped-webhook&code-language=curl&code-sdk-version=json)
   set to your endpoint and the configuration filter set to "onMessageAdded", any message that is added to the conversation will invoke the configured webhook URL.
4) Simulate a new customer message by using the Message endpoint.
   Remember to set Author to the identity you set in step 2 and to add the
   header “X-Twilio-Webhook-Enabled” to the request so our webhook gets invoked
5) Use the Twilio [Interaction API](https://www.twilio.com/docs/flex/developer/conversations/interactions-api)
   to invoke a handoff to the Flex UI

   
## How to run the initializer to programmatically create a Twilio conversation 

> [ConversationInitializer](./src/main/java/com/middleware/controller/util/ConversationInitializer.java)

```
mvn -DskipTests package exec:java 
        -Dexec.mainClass=com.middleware.controller.util.ConversationInitializer 
        -Dexec.args="add"
        
mvn -DskipTests package exec:java 
        -Dexec.mainClass=com.middleware.controller.util.ConversationInitializer 
        -Dexec.args="delete <conversation sid>"
```

# Deployment

JIB is used to build the docker image and push it to the GCR.

```bash
 mvn compile jib:build
```

# References

1.[Twilio Conversations Fundamentals](https://www.twilio.com/docs/conversations/fundamentals)
2.[Dialogflow](https://cloud.google.com/dialogflow/es/docs)

