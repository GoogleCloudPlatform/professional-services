```
Copyright 2023 Google. This software is provided as-is, without warranty or
representation for any use or purpose. Your use of it is subject to your
agreement with Google.
```

# LLM Middleware
The Service calls the Gen AI agent to get response from Large language Models over Dialogflow CX APIs.

## Library
Install the dialogflow cx library before executing the code. Follow the link https://cloud.google.com/dialogflow/cx/docs/reference/library/python for more information.

```
pip3 install google-cloud-dialogflow-cx==1.21.0
```

## Replace following parameters in ./app/config.ini to your values
```
DIALOGFLOW_CX_PROJECT_ID: gcp project id where dialogflow agent is running.
DIALOGFLOW_LOCATION_ID: gcp region of your dialogflow agent. It is generally 'global' for global serving agents.
DIALOGFLOW_CX_AGENT_ID: the unique id of the dialogflow agent.
```

## How to run the application 
From the llm-middleware/app folder run the following command
```
$ python3 app.py
```

## API Endpoint
1. \predict
Request Payload:
{
    "user_input" : "How to?",
    "session_id" : "amdm244"
}

Response Payload:
{
    "output": "I'm not sure what you mean. Can you rephrase your question?",
    "gcs_link": "https://storage.cloud.google.com/docs/sample.pdf",
    "success": true
}
```
