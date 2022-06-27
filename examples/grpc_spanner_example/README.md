# gRPC Example

This example creates a gRCP server that connect to spanner to find the name of
user for a given user id.

## Application Project Structure

 ```
    .
    └── grpc_example
        └── src
            └── main
                ├── java
                        └── com.example.grpc
                            ├── client
                                └── ConnectClient # Example Client
                            ├── server
                                └── ConnectServer # Initializes gRPC Server
                            └── service
                                └── ConnectService # Implementation of rpc services in the proto
                └── proto
                    └── connect_service.proto # Proto definition of the server
       ├── pom.xml
       └── README.md
```

## Technology Stack

1. gRPC
2. Spanner

## Setup Instructions

### Project Setup

#### Creating a Project in the Google Cloud Platform Console

If you haven't already created a project, create one now. Projects enable you to
manage all Google Cloud Platform resources for your app, including deployment,
access control, billing, and services.

1. Open the [Cloud Platform Console][cloud-console].
1. In the drop-down menu at the top, select **Create a project**.
1. Give your project a name = my-dfdl-project
1. Make a note of the project ID, which might be different from the project
   name. The project ID is used in commands and in configurations.

[cloud-console]: https://console.cloud.google.com/

#### Enabling billing for your project.

If you haven't already enabled billing for your
project, [enable billing][enable-billing] now. Enabling billing allows is
required to use Cloud Bigtable and to create VM instances.

[enable-billing]: https://console.cloud.google.com/project/_/settings

#### Install the Google Cloud SDK.

If you haven't already installed the Google Cloud
SDK, [install the Google Cloud SDK][cloud-sdk] now. The SDK contains tools and
libraries that enable you to create and manage resources on Google Cloud
Platform.

[cloud-sdk]: https://cloud.google.com/sdk/

#### Setting Google Application Default Credentials

Set
your [Google Application Default Credentials][application-default-credentials]
by [initializing the Google Cloud SDK][cloud-sdk-init] with the command:

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

### Spanner Setup from the Console

1. Create an instance called grpc-example
2. Create a database called grpc_example_db
3. Create a table named Users using the following Database Definition Language (
   DDL) statement for the database

```
  CREATE TABLE Users (
  user_id INT64 NOT NULL,
  name STRING(MAX),
) PRIMARY KEY(user_id);
```

3. Insert the following record into the table Users

```
INSERT INTO
  Users (user_id,
    name)
VALUES
  (1234, -- type: INT64
    "MyName" -- type: STRING(MAX)
    );
```

## Usage

### Initialize the server

```
$ mvn -DskipTests package exec:java 
    -Dexec.mainClass=com.example.grpc.server.ConnectServer

```

### Run the Client

```
$ mvn -DskipTests package exec:java 
      -Dexec.mainClass=com.example.grpc.client.ConnectClient
```