# Contributing

Thanks for your interest in contributing to the dataflow Python examples!

Here is the general guidance:

* Batch Pipelines should live in batch-examples folder

* Streaming Pipelines should live in Streaming-examples folder

* Pipelines written using single python module without any other associated scripts should be added to either 
   batch-examples/cookbook-examples or streaming-examples/cookbook-examples depending on the nature of pipeline.
  
* Pipelines written either over multiple modules or has associated scripts (e.g: shell scripts / terraform etc) must live
   in self contained directory as a sub directory under either batch-examples/ or streaming-examples/ depending on the nature of pipeline.
   
   Every self contained pipeline should follow below guidelines:
    
    1. Include requirements.txt specifying dependent python packages with respective versions 
    
    2. Include [cloudbuild.yaml](streaming-examples/slowlychanging-sideinput/cloudbuild.yaml) file consisting 2 steps:
    
        1. Building a docker image with [beam](https://hub.docker.com/search?q=apache%2Fbeam_&type=image) as base image and 
           python packages required for your pipeline.
        
        2. Run tests
            
    3. Add an additional step to root level [cloudbuild.yaml](./cloudbuild.yaml) referring to cloudbuild.yaml inside your sub directory
