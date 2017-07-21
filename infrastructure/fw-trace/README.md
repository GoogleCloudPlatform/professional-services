# Google Cloud Firewall Trace Tool fw-trace

## Summary
As GCP adds new features like egress firewall rules customers’ cloud architecture will become more complex as they implement strong security policy through large sets of firewall rules.  Troubleshooting misconfiguration of firewall rules manually becomes time consuming, difficult and prone to error.

The Firewall Tracer tool will enable user to find out exactly how current firewall rules permits or deny a specific traffic flow between two IPs.


## System Requirements
This tools is implemented in python and it runs on Linux, Mac OS X and Windows, and requires the following packages and libraries:

    Python 2.7.x or Python 3.3+

    Google Cloud SDK

    Google Cloud Python Client API library

    If Python 2.7 is used, Python py2-ipaddress 2.0 package needs to be installed.  This is a backport of standard IP address handling package from Python version 3.3+

Please refer to Appendix “Setting Up Python Environment” for step by step instructions on how to set up the environment


## Command Format
gcp-tracer SOURCE_IP DESTINATION_IP PROTOCOL PORT --project=PROJECT_NAME --network=NETWORK --src_tag=SRC_TAG --dst_tag=DST_TAG --verbose=true


## Parameters
SOURCE_IP

[Required] Source IP of the traffic, e.g. 10.0.0.1


DESTINATION_IP

[Required] Destination IP of the traffic, e.g. 192.168.0.1


PROTOCOL

[Required] Traffic protocol, choose from GCP supported list of:
tcp, udp, icmp, esp, ah, sctp


PORT

[Required] Protocol port number, applies only to protocol tcp and udp.  For other protocols, this parameter can be set to 0


--project

[Required] Name of the project where firewall rules are configured


--network

[Required] Name of the network where firewall rules are configured


--src_tag

[Optional] Used to simulate traffic coming a source instance with this specific tag. For egress traffic, egress firewall rules with this tag as target tag will be evaluated.   For ingress traffic, ingress firewall rules with this tag as source tag will be evaluated. 


--dst_tag

[Optional] Used to simulate traffic destined to a instance with this specific tag. For ingress traffic, ingress firewall rules with this tag as target tag will be evaluated.  


--verbose

[Optional] when set to “true” Print out detailed firewall tracing information.  If not used, only firewall trace results will be printed



## Examples

        python fw-trace.py 10.0.0.1 192.168.0.1 tcp 80 --project=mzuo-nyt-vpn --network=fw-test --verbose=true

This command traces tcp traffic on port 80 from subnet 10.0.0.0/16 to subnet 192.168.0.0/24 with the same project and network, printing out trace information in detail.


        python fw-trace.py 10.0.0.1 8.8.8.8 udp 300 --project=mzuo-nyt-vpn --network=fw-test --verbose=true --src_tag=prod

This command traces udp traffic on port 300 from an instance tagged as “prod” in subnet 10.0.0.0/16 to external IP 8.8.8.8 , printing out trace information in detail.


        python fw-trace.py 10.0.0.1 192.168.1.1 tcp 443 --project=mzuo-nyt-vpn --network=fw-test --src_tag=prod --dst_tag=qa

This command traces tcp traffic on port 80 from an instance tagged as “prod” in subnet 10.0.0.0/16 to an instance tagged as “qa” in subnet 192.168.0.0/24 with the same project and network.  In this scenario, egress firewall rules for instance “prod” and ingress firewall rules for instance “qa” will both be evaluated.


        python fw-trace.py 10.0.0.1 8.8.8.8 icmp 0 --project=mzuo-nyt-vpn --network=fw-test  --src_tag=prod 

This command traces icmp traffic from an instance tagged as “prod” in subnet 10.0.0.0/16 to external IP 8.8.8.8



## Notes
1. This tool is designed for troubleshooting firewall rules configuration and is not part of GCP feature set. 
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

