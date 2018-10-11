# Google Cloud Routing Trace Tool route-trace

## Summary
As more and more large enterprise customers are migrating to Google Cloud, their GCP infrastructure becomes increasingly complex.  Each projects will have tens and hundreds of routes configure.  Troubleshooting a routing issue becomes time consuming, difficult and error prone.

The route-trace tool will enable user to find out exactly how traffic to a specific destination will be routed



## System Requirements
This tools is implemented in python and it runs on Linux, Mac OS X and Windows, and requires the following packages and libraries:

    Python 2.7.x or Python 3.3+

    Google Cloud SDK

    Google Cloud Python Client API library

    If Python 2.7 is used, Python py2-ipaddress 2.0 package needs to be installed.  This is a backport of standard IP address handling package from Python version 3.3+

Please refer to Appendix “Setting Up Python Environment” for step by step instructions on how to set up the environment


## Command Format
gcp-tracer DESTINATION_IP --project=PROJECT_ID --network=NETWORK --tag=TAG --verbose=true


## Parameters

DESTINATION_IP

[Required] Destination IP of the traffic, e.g. 192.168.0.1


--project

[Required] Name of the project where routing rules are configured


--network

[Required] Name of the network where routing rules are configured


--tag

[Optional] Used to simulate traffic initiated from a instance with this specific tag.  


--verbose

[Optional] when set to “true” Print out detailed route tracing information.  If not used, only route trace results will be printed




## Examples

python route-trace.py 6.6.6.254 --project=mzuo-nyt-vpn --network=lb-test  --tag=qa --verbose=true
This command traces traffic sent from an instance tagged with “qa” and destined to 6.6.6.254, printing out trace information in detail.

python route-trace.py 10.0.0.1 --project=mzuo-nyt-vpn --network=lb-test 
This command traces traffic destined to 10.0.0.1, printing out trace result only.



## Notes
1. This tool is designed for troubleshooting routing rules configuration and is not part of GCP feature set. 
2. Currently there is no extensive checking of parameter formats and validity.  Please see specification and examples above for how to run the tool
3. For questions and comments, please contact mzuo@google.com




## Appendix: Setting Up Python Environment
1. Install Python if not already installed
    Check to see if Python is installed and which version is installed
    Python installation packages are available at https://www.python.org/downloads/  
        If using Version 2.7 (default version for many platforms), py2-ipaddress 2.0 package need to be installed as well
        Download ipy2-ipaddress 2.0 Python 2.7 backport package from https://pypi.python.org/pypi/py2-ipaddress/2.0 
        Unzip package and run setup Python script setup.py in the package. (e.g. on a linux platform: “sudo python setup.py         install”)
2. Install GCP Cloud SDK from https://cloud.google.com/sdk/ 
3. Provide Google Cloud credentials by using GCP Cloud SDK command “gcloud auth application-default login”
4. Install Python Client API library from https://developers.google.com/api-client-library/python/start/installation

