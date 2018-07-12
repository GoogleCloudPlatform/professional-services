# CLI Example
## Initial Setup

### Build the App
If you haven't already built the app execute the following in the terminal from this dirctory.
```terminal
pushd ../../; mvn clean install; popd
```
### Set Environment Variable
If you built the reference architecture with the included Terraform templates, you should find the key
for the message publisher at {PROJECT_ROOT}/terraform/target/classes/publisher-key.json.
```terminal
export GOOGLE_APPLICATION_CREDENTIALS={PROJECT_ROOT}/terraform/target/classes/publisher-key.json
```
### Create a Subscription
In the Google Cloud Console, create a subscription for the **default-topic** PubSub topic.
### Run the App
In your terminal navigate to the {PROJECT_ROOT}/java and execute the following.
```terminal
java -jar client/cli-example/target/cli-example-1.0-SNAPSHOT.jar -f data-broker-json-schema/src/test/resources/person-right-test.json
```
### View the Result
In the Google Cloud Shell, execute the following.
```terminal
gcloud pubsub subscriptions pull SUBSCRIPTION_ID --auto-ack
```