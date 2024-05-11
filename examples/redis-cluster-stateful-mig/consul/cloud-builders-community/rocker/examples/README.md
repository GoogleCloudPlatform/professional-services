This example uses the [Rocker builder](https://github.com/grammarly/rocker) to print some basic build system information.

To run this example:

    gcloud builds submit --config=cloudbuild.yaml .
    
At the bottom of the build output, you'll see something like the following:

    Step #1: Already have image: rocker:latest
    Step #1: Docker host: unix:///var/run/docker.sock
    Step #1: Docker use TLS: false
    Step #1: Docker GoVersion: go1.8.3
    Step #1: Docker KernelVersion: 4.4.0-103-generic
    Step #1: Docker Version: 17.06.1-ce
    Step #1: Docker ApiVersion: 1.30
    Step #1: Docker MinAPIVersion: 1.12
    Step #1: Docker GitCommit: 874a737
    Step #1: Docker Os: linux
    Step #1: Docker Arch: amd64
    Step #1: Docker BuildTime: 2017-08-17T22:51:03.387188803+00:00
