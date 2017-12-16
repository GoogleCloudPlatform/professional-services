## Project to Project Communication in App Engine
This sample code demonstrates communication between two App Engine projects using HttpURLConnection. This may be useful if you are developing an application that uses microservices.

### Prerequisities
Setup Java 8 and Maven on your local development environment

Setup two GCP projects

###Project 1: Go Server on Flex
The server is a go app running on Flex:

Test URL gives a human a button to click to execute return 700k of bytes: 
https://{PROJECT1_ID}.appspot.com/ 

URL to actually return the bytes:
https://{PROJECT1_ID}.appspot.com/ receiveandsend

This will serve up a file 716800 bytes in size

Command to deploy the app
```
gcloud app deploy --project {PROJECT1_ID} --version v01
```

Client app: Java 8 on Standard will do a URLFetch to the URL above and report the number of msec to get the bytes.

###Project 2 Java 8 App on Standard
Test URL gives a human a button to click to execute return 700k of bytes with a report of latency:
https://{PROJECT1_ID}.appspot.com
URL to actually do the test:
https://{PROJECT1_ID}.appspot.com/urlfetchtest

To build and deploy the app
Edit file URLFetchClient.java and set {PROJECT_ID} to your project id

To test locally, run the command
```
mvn appengine:run
```

To deploy to App Engine, run the command
```
mvn appengine:deploy
```