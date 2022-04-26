# grecv

grecv offloads decoding and encoding from the mainframe.

The server is a java application which terminates TLS and decompresses a GZIP stream 
of blocks sent by the client. The server maintains an array of decoders to 
decode fields in the input dataset. After decoding, an ORC Writer appends batches 
of data to an ORC file in GCS. The target ORC partition size is 128 MB. After a 
partition exceeds the target size, a new writer is created automatically.

The client reads blocks from the input dataset and sends round-robin across one or 
more sockets to the server.


## Protocol

### Client Handshake

Upon connecting, the client sends an integer indicating the number of 
bytes in the serialized request message.
The serialized request message is sent immediately after the length.
The server replies with 200 if it was able to deserialize the message.
The client then closes the connection.


### Data upload

The client connects one or more sockets and initializes a GZIPOutputStream for each.
The server accepts exactly the number of connections specified during the handshake.
Before each data block, the client sends an integer indicating the size of the block.
A value of less than 1 is sent to indicate end of stream.
Upon receiving the end of stream message, the server sends the number of blocks it has 
received and closes the connection.
The client confirms the block count and closes the connection. 


## Deployment

GCS is used as an artifact repository.
Each version of grecv will have the following objects:
- `mainframe-connector-version.jar` Application
- `lib.tar` Application dependencies
- `run.sh` Application launcher
- `jre.tar` JVM
- `pki.tar` TLS certificate and private key

The `pkgUri` passed to grecv will be different for each environment.
* Prod version for dev should be located at `gs://prod-bucket/prefix/<version>`
* Dev version for dev should be located at `gs://dev-bucket/prefix/SNAPSHOT`


## Package contents

lib.tar
- `lib/*` dependencies

pki.tar
- `chain.pem` X509 certificate chain
- `key.pem` X509 private key

jre.tar
- `jre/bin/java` java executable
- `jre/lib/*` core libraries


## Generating Proto source

```bash
protoc \
  --plugin=protoc-gen-grpc-java=/usr/local/bin/protoc-gen-grpc-java \
  --java_out=src/main/java \
  --grpc-java_out=src/main/java \
  grecv.proto
```

## Pem Files

chain.pem

```
-----BEGIN CERTIFICATE-----
          <host>
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
     <intermediate CA>
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
        <root CA>
-----END CERTIFICATE-----
```
