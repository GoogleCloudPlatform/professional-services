import functions_framework
from anthropic import AnthropicVertex
#from flask import jsonify, Flask, request, Response
import os
import json
import flask


LOCATION="europe-west1" # or "us-east5"


client = AnthropicVertex(region=LOCATION, project_id="[yourprojectid]")


@functions_framework.http
def claude_http(request: flask.Request) -> flask.Response:
   """HTTP Cloud Function.
   Args:
       request (flask.Request): The request object.
       <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
   Returns:
       The response text, or any set of values that can be turned into a
       Response object using `make_response`
       <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
   """
   request_json = request.get_json()
   calls=request_json['calls']


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
  
   # Return a JSON object with all results
   return flask.make_response(flask.jsonify({"replies": result}))
   #return result


