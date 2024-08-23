# BigQuery Remote Function with Anthropic

This README provides instructions for setting up a BigQuery Remote Function that uses Anthropic's Claude 3.5 Sonnet model via Google Cloud Functions.

## References
- [BQ Remote function Doc](https://cloud.google.com/bigquery/docs/remote-functions)
- [Create Cloud Function Doc](https://cloud.google.com/functions/docs/create)

# Required Access
1. Developer needs to have the following roles:
   - Cloud Run Developer
   - Vertex AI User
   - BigQuery User
2. Grant Service Accounts IDs access between different services (see Step 2)

## Step 1: Enable Vertex AI API and Enable Claude Models on Vertex AI 
You can follow this documentation: [Link to Claude On Vertex AI Doc](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#before_you_begin_)

## Step 2: Create Cloud Function using the [Create Cloud Function Doc](https://cloud.google.com/functions/docs/create)
You can use the provided Sample Code below or in the /CloudFunction folder in this folder
### requirements.txt
```
functions-framework==3.*
anthropic[vertex]
gunicorn==22.0.0
python-dotenv==1.0.1
Flask==3.0.3
```

### main.py
```python
import functions_framework
from anthropic import AnthropicVertex
import os
import json
import flask

LOCATION = "europe-west1"  # or "us-east5"

client = AnthropicVertex(region=LOCATION, project_id="[yourprojectid]")

@functions_framework.http
def claude_http(request: flask.Request) -> flask.Response:
    request_json = request.get_json()
    calls = request_json['calls']

    result = []
    for call in calls:
        message = client.messages.create(
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": str(call),
                }
            ],
            model="claude-3-5-sonnet@20240620",
        )
        content_text = message.content[0].text if message.content else ""
        result.append(content_text)
    
    return flask.make_response(flask.jsonify({"replies": result}))
```

### Test the function with sample event
```json
{
 "calls": [
   "What is the capital of France?",
   "Explain the concept of photosynthesis in simple terms.",
   "Write a haiku about artificial intelligence."
 ]
}
```

## Step 3: Create BQ Remote Function Connection
Follow the [documentation](https://cloud.google.com/bigquery/docs/remote-functions#create_a_connection) to create a BigQuery Remote Function Connection and set up proper IAM access. Additionally, grant Cloud Run access to the Vertex AI user role.

## Step 4: Create BQ Remote Function
```sql
CREATE OR REPLACE FUNCTION
 `[yourproject].[yourdataset].claude35Sonnet`(prompt STRING) RETURNS STRING
REMOTE WITH CONNECTION `[yourproject].us.llm_connection`
OPTIONS (endpoint = 'https://[YOUR Function URI....]', max_batching_rows = 1);
```

## Step 5: Query the Function
```sql
SELECT
  title,
  `[yourproject].[yourdataset]`.claude35Sonnet(CONCAT("translate this into English and only return the translated result:", title)) AS translated_title
FROM [yourprojectid].[your table]
WHERE title IS NOT NULL 
LIMIT 1;
```

This README provides a step-by-step guide to set up and use a BigQuery Remote Function with Anthropic's Claude model.

