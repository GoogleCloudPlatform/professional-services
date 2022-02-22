# Data Format Description Language ([DFDL](https://en.wikipedia.org/wiki/Data_Format_Description_Language)) Processor Example
This module is a example how to process a binary using a DFDL definition.
The DFDL definitions are stored in a Firestore database.

The application send a request with the binary to process to a pubsub topic.

The processor service subscribes to the topic, processes every message,
applies the definition and publishes the json result to a topic in pubsub.

## Project Structure

```
.
└── dfdl_example
 ├── examples # Contain a binary and dfdl definition to be used to run this example
 └── src
       └── main
           └── java
               └── com.example.dfdl
                   ├── DfdlDef # Embedded entiites
                   ├── DfdlDefRepository # A Firestore Reactive Repository
                   ├── DfdlService # Processes the binary using a dfdl definition and output a json
                   ├── FirestoreService # Reads dfdl definitons from a firestore database
                   ├── MessageController # Publishes message to a topic with a binary to be processed.
                   ├── ProcessorService # Initializes components, configurations and services.
                   ├── PubSubServer # Publishes and subscribes to topics using channels adapters.
                   └── README.md
 └── resources
      └── application.properties
 └── pom.xml
```

## Technology Stack
1. Cloud Firestore
2. Cloud Pubsub

## Frameworks
1. Spring Boot
2. [Spring Data Cloud Firestore](https://docs.spring.io/spring-cloud-gcp/docs/current/reference/html/firestore.html)
   * [Reactive Repository](https://docs.spring.io/spring-cloud-gcp/docs/current/reference/html/firestore.html#_reactive_repositories)

## Libraries
1. [Apache Daffodil](https://daffodil.apache.org/)

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

If you haven't already enabled billing for your project, [enable
billing][enable-billing] now.  Enabling billing allows is required to use Cloud Bigtable
and to create VM instances.

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
[application-default login](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/login) command:
   
```
    gcloud auth application-default login
```

[cloud-sdk-init]: https://cloud.google.com/sdk/docs/initializing
[application-default-credentials]: https://developers.google.com/identity/protocols/application-default-credentials

### Firestore Setup
How to create a Firestore database instance can be found [here](https://cloud.google.com/firestore/docs/quickstart-servers#create_a_in_native_mode_database) 

#### How to add data to firestore
The following doc, [Managing firestore using the console](https://cloud.google.com/firestore/docs/using-console),
can be used to add data to firestore to run the example.

This example connects to a Cloud Firestore with a collection with the
following specification.
The configuration can be changed by changing the application.properties file.
```
    Root collection
     dfdl-schemas =>
         document_id
             binary_example => {
                 'definiton':
                  "<?xml version"1.0" encoding="UTF-8"?>
                     <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
                      xmlns:dfdl="http://www.ogf.org/dfdl/dfdl-1.0/"
                      targetNamespace="http://example.com/dfdl/helloworld/">
                        <xs:include
                      schemaLocation="org/apache/daffodil/xsd/DFDLGeneralFormat.dfdl.xsd" />
                        <xs:annotation>
                           <xs:appinfo source="http://www.ogf.org/dfdl/">
                              <dfdl:format ref="GeneralFormat" />
                           </xs:appinfo>
                        </xs:annotation>
                        <xs:element name="binary_example">
                           <xs:complexType>
                              <xs:sequence>
                                 <xs:element name="w" type="xs:int">
                                    <xs:annotation>
                                       <xs:appinfo source="http://www.ogf.org/dfdl/">
                                          <dfdl:element representation="binary"
                                              binaryNumberRep="binary" byteOrder="bigEndian" lengthKind="implicit" />
                                       </xs:appinfo>
                                    </xs:annotation>
                                 </xs:element>
                                 <xs:element name="x" type="xs:int">
                                    <xs:annotation>
                                       <xs:appinfo source="http://www.ogf.org/dfdl/">
                                          <dfdl:element representation="binary"
                                                binaryNumberRep="binary" byteOrder="bigEndian" lengthKind="implicit" />
                                       </xs:appinfo>
                                    </xs:annotation>
                                 </xs:element>
                                 <xs:element name="y" type="xs:double">
                                    <xs:annotation>
                                       <xs:appinfo source="http://www.ogf.org/dfdl/">
                                          <dfdl:element representation="binary"
                                                 binaryFloatRep="ieee" byteOrder="bigEndian" lengthKind="implicit" />
                                       </xs:appinfo>
                                    </xs:annotation>
                                 </xs:element>
                                 <xs:element name="z" type="xs:float">
                                    <xs:annotation>
                                       <xs:appinfo source="http://www.ogf.org/dfdl/">
                                          <dfdl:element representation="binary"
                                                byteOrder="bigEndian" lengthKind="implicit" binaryFloatRep="ieee" />
                                       </xs:appinfo>
                                    </xs:annotation>
                                 </xs:element>
                              </xs:sequence>
                           </xs:complexType>
                        </xs:element>
                     </xs:schema>";
                  }
```
This dfdl definition example can be found in the binary_example.dfdl.xsd file.

### Pubsub Setup
The following [doc](https://cloud.google.com/pubsub/docs/quickstart-console)
can be used to set up the topics and subscriptions needed to run this example.

#### Topics
To run this example two topics need to be created:
1. A topic to publish the final json output: "data-output-json-topic"
2. A topic to publish the binary to be processed: "data-input-binary-topic"

#### Subscription
The following subscriptions need to be created:
1. A subscription to pull the binary data: data-input-binary-sub

## Usage
### Initialize the application
Reference: [Building an Application with Spring Boot](https://spring.io/guides/gs/spring-boot/)
```
      ./mvnw spring-boot:run
```
### Send a request
```
    curl --data "message=0000000500779e8c169a54dd0a1b4a3fce2946f6" localhost:8081/publish
```