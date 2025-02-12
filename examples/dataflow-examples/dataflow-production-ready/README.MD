# Dataflow Production-Ready Pipeline

## Introduction
This repo aims to provide a reference implementation for a number of best practices for Google Dataflow (Apache Beam) via a sample pipeline. 
This sample pipeline doesn't focus on complex transformations or specific business logic, but rather on the
the scaffolding around data pipelines in terms of: 
* Unit testing
* Integration testing
* Infrastructure automation
* Deployment automation

The repo uses many concepts as explained in the Google Cloud blog series 
[Building production-ready data pipelines using Dataflow](https://cloud.google.com/solutions/building-production-ready-data-pipelines-using-dataflow-overview)  

## Sample pipelines
The repo provides a data-preprocessing pipeline for a hypothetical ML use case in both [Python](python) and [Java](java)(WIP).
The pipeline reads and parse a CSV in the following format:
```
source_address;source_city;target_address;target_city
```
Then, apply some text-cleaning on the fields and calculate similarity features `address_similarity` and `city_similarity` between source and target attributes.
The output and rejected records are then written into BigQuery into two separate tables.

The main goal of the repo is to demonstrates the following:

 * Beam Pipeline structuring and patterns
    * DoFns
    * PTransform
    * Counters
    * Side Inputs
    * Multiple outputs (Error output)
    * Writing to BigQuery
* Testing
    * Structuring the pipeline into testable units
    * Unit Tests (python methods, DoFns, TestPipeline, PAssert)
    * Transform-integration test with static data (PTransform)
    * System-integration test on Dataflow service
* Flex Template
    * Packaging the pipeline code and dependencies into a container image
    * Using multi-python modules [(Python example)](python)
* CD pipeline
    * Using Cloud Build
    * Running unit tests
    * Building and deploying Flex template
    * Running system integration test with Flex template 
* Infrastructure automation 
    * Using Terraform to automate environment creation for the data pipeline
    
    
