# Secret Manager String Helpers

This repository contains a library that makes it easy to use
[Secret Manager](https://cloud.google.com/secret-manager) to replace templated strings in Java code.

# Build

```bash
# Tests use Secret Manager's API. Set your project ID so that
# the tests can run.
export PROJECT_ID=your-project-id
mvn clean package
```

# com.google.cloud.secrethelper.SecretLookup

The `com.google.cloud.secrethelper.SecretLookup` class provides an implementation of
[org.apache.commons.text.lookup.StringLookup](https://commons.apache.org/proper/commons-text/apidocs/org/apache/commons/text/lookup/StringLookup.html).

## Usage
Assuming that `projects/project-id/secrets/secret-id/versions/1` contains a secret `theSecret`:

```java
public class SecretLookupExample {
    public void secretLookupExample(SecretManagerServiceClient client) {
        String secretName = "projects/project-id/secrets/secret-id/versions/1";
        SecretLookup secretLookup = new SecretLookup(client);
        String secretValue = secretLookup.lookup(secretVersionName);
    }
}
```
`secretValue` will contain the `theSecret`.
# com.google.cloud.secrethelper.SecretLookupToFile
`com.google.cloud.secrethelper.SecretLookupToFile` has the same behavior as 
`com.google.cloud.secrethelper.SecretLookup`, except that the secret payload 
gets written to a temporary file.
[File.createTempFile](https://docs.oracle.com/javase/9/docs/api/java/io/File.html)
 generates the filename.

## Usage

```java
public class SecretLookupToFileExample {
  public void secretLookupToFileExample(SecretManagerServiceClient client) {
    String secretName = "projects/project-id/secrets/secret-id/versions/1";
    SecretLookupToFile secretLookupToFile = new SecretLookupToFile(client);
    String pathToFileContainingSecret = secretLookupToFile.lookup(secretVersionName);
  }
}

```

`pathToFileContainingSecret` contains the path to a file which contains the secret payload.

# com.google.cloud.secrethelper.SecretManagerStringSubstitutor

`com.google.cloud.secrethelper.SecretManagerStringSubstitutor` implements
[org.apache.commons.text.StringSubstitutor](https://commons.apache.org/proper/commons-text/apidocs/org/apache/commons/text/StringSubstitutor.html)
and interpolates strings prefixed with `secretManager` (returning the secret itself) or
`secretManagerToFilePath` (returning the path to a file containing the secret payload).

## Usage

```java
public class SecretManagerStringSubstitutorExample {
  public void secretManagerStringSubstitutorExample(SecretManagerServiceClient client) {
    SecretManagerStringSubstitutor secretManagerStringSubst = new SecretManagerStringSubstitutor();
    String template = "The secret is '${secretManager:projects/project-id/secrets/secret-id/versions/1}'");
    String replacedString = secretManagerStringSubst.replace(template);
  }
}
```

`replacedString` will contain `"The secret is 'theSecret'"`.

# Using SecretManagerStringSubstitutor with properties files

This library can also be used to replace templated strings in files, such as
Java properties files. You can do this by creating an instance of
`StringSubstitutorReader` with an instance of `SecretManagerStringSubstitutor`
as follows (an actual class with this implementation exists at [src/main/java/com/google/cloud/secrethelper/SecretManagerPropertiesExample.java](src/main/java/com/google/cloud/secrethelper/SecretManagerPropertiesExample.java)):

```java
public class SecretManagerPropertiesExample {

  private static final Logger LOG = LoggerFactory.getLogger(SecretManagerPropertiesExample.class);

  public static void main(String[] args) throws IOException {
    Properties properties = new Properties();
    SecretManagerServiceClient client = SecretManagerServiceClient.create();
    StringSubstitutor secretSubstitutor = new SecretManagerStringSubstitutor(client);

    Reader propertiesFileReader = Files
        .newReader(new File("kafka.properties"), Charset.defaultCharset());
    properties.load(new StringSubstitutorReader(propertiesFileReader, secretSubstitutor));
    LOG.info(properties.toString());
  }
}
```

Assuming you have a `kafka.properties` that looks like this (notice the
values that contain strings of the form `${secretManager: ...}`:

```properties
# Required connection configs for Kafka producer, consumer, and admin
bootstrap.servers=bootstrap-server:9092
security.protocol=SASL_SSL
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required \
    username='${secretManager:projects/685964841825/secrets/confluent-cloud-kafka-api-key/versions/1}' \
    password='${secretManager:projects/685964841825/secrets/confluent-cloud-kafka-secret/versions/1}';
sasl.mechanism=PLAIN
# Required for correctness in Apache Kafka clients prior to 2.6
client.dns.lookup=use_all_dns_ips
# Best practice for Kafka producer to prevent data loss
acks=all
# Required connection configs for Confluent Cloud Schema Registry
schema.registry.url=https://schema-registry
basic.auth.credentials.source=USER_INFO
basic.auth.user.info=${secretManager:projects/685964841825/secrets/confluent-cloud-kafka-api-key/versions/1}:${secretManager:projects/685964841825/secrets/confluent-cloud-kafka-secret/versions/1}
```

Running the example class should print the properties out with the secret
values replaced with the secret payloads referred to by the Secret Manager
resource IDs.
