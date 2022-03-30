# gRPC Example

This example creates a gRCP server that connect to redis to find the name of a
user for a given user id.

## Application Project Structure

 ```
    .
    └── grpc_example_redis
        └── src
            └── main
                ├── java
                        └── com.example.grpc
                            ├── client
                                └── ConnectClient # Example Client
                            ├── server
                                └── ConnectServer # Initializes gRPC Server
                            └── service
                                ├── ConnectServiceImpl # Implementation of rpc services in the proto
                                └── RedisUtil # Tool to initialize redis
                └── proto
                    └── connect_service.proto # Proto definition of the server
       ├── pom.xml
       └── README.md
```

## Technology Stack

1. gRPC
2. Redis

## Setup Instructions

### Redis Emulator Setup

#### Quick Start

Reference guide can be found [here](https://redis.io/topics/quickstart)

#### Installation

```
$ wget http://download.redis.io/redis-stable.tar.gz
$ tar xvzf redis-stable.tar.gz
$ cd redis-stable
$ make
$ make test
$ make install
```

#### Start the Server

```
$ redis-server
[28550] 01 Aug 19:29:28 # Warning: no config file specified, using the default config. In order to specify a config file use 'redis-server /path/to/redis.conf'
[28550] 01 Aug 19:29:28 * Server started, Redis version 2.2.12
[28550] 01 Aug 19:29:28 * The server is now ready to accept connections on port 6379
... more logs ...

```

#### Test the Server

```
$ redis-cli
redis 127.0.0.1:6379> ping
PONG
```

#### Set Data

```
redis 127.0.0.1:6379> set 1234 MyName
OK
redis 127.0.0.1:6379> get mykey
"MyName"
```

#### Set environmental variables

```
$ export REDIS_HOST=127.0.0.1
$ export REDIS_PORT=6379
$ export REDIS_MAX_TOTAL_CONNECTIONS=128
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