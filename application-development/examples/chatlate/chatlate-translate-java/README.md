
# Maven

## Build application

    mvn package

# Docker

## Build image

    docker build -t="java-translate" .
    
## Run image locally

    docker run -d -p 8080:80 --name java-translate java-translate
    
    