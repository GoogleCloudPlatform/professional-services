# GCP Data Stream Example
This is an example app provided by the Google Cloud SCE team to demonstrate pushing data to PubSub.  There are 5 main pieces to this Java framework.
1. **data-broker-json-schema** - The artifact in which Json schemas are placed.
2. **data-broker-json-validator** - The Json validator library that can be used either client side or server side.
3. **data-broker-sdk** - The client side ingestion component.
4. **client** - Contains example invocations of the *data-broker-sdk*.
5. **server** - An example of a server side data broker.

## Build the App
1. In your terminal, navigate to the **aurinko/java/** folder.
2. Execute the following
```terminal
mvn clean install
```

## Running the Examples
In the **client/cli-example** subfolder, you can find another README.md explaining how to execute the cli-example.

