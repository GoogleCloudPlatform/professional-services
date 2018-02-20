
# Maven

## Build application

    mvn package

# Docker

## Build image

    docker build -t="java-chat" .
    
## Run image locally

    docker run -d -p 8080:80 --name java-chat java-chat
    
    