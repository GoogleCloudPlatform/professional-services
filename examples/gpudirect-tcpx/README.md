# GPUDirect TCPX Terraform Module
For use with GCP A3 (H100) GPU offerings.

For more information see [Google Cloud Docs](https://cloud.google.com/compute/docs/gpus/gpudirect).

## Overview
This module provisions the performance tuned networking infrastructure in terraform for optimal utilization of multiple A3 nodes. 

## Usage
Pass in a project ID and region to deploy the networks to. Use the outputs of the module in an instance template or compute instance.