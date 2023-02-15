This is an example of running build steps with cloudbuild, having docker-compose
running HTTPS_PROXY in the background connected to a bastion host via Identity
Aware Proxy using 'gcloud compute ssh'.

This is one of the way to restrict outbound public IP address of the cloudbuild
default pool.

# Prerequisite:

## Setup Bastion Host and install Proxy

e.g. Tiny proxy is pre-installed in the bastion host.

```
sudo apt-get install tinyproxy
sudo vim /etc/tinyproxy/tinyproxy.conf
########################
# Edit tiny proxy config
# - Update Port
# - Update Allow list with: 0.0.0.0/0, localhost
########################
sudo /etc/init.d/tinyproxy restart
```

## Reserve public IP

*   [Reserve a public IP](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address)
*   [Setup Cloud NAT](https://cloud.google.com/nat/docs/set-up-manage-network-address-translation)
*   [Setup Cloud NAT with reserved IP](https://cloud.google.com/nat/docs/set-up-manage-network-address-translation)

## Edit '.env' file with required variables

*   PROJECT_ID: The Project ID that the Proxy Server is running in
*   ZONE: The Zone that Proxy Server is running in
*   PROXY_SERVER: The name of the VM running as Proxy Server
*   PORT: The PORT that tinyproxy config points to

# Running the build

## Running docker-compose in local host

To make sure that the config is properly setup, it is easier to test it in local
environment before submitting to Cloud Build.

*   Run docker-compose locally to connect to Proxy Server:

```
docker-compose -f docker-compose-local.yaml up --build
```

*   To verify that proxy is connected correctly, run below command and make sure
    that the egress IP is the same as the public IP reserved for Cloud NAT

```
curl -x localhost:$PORT https://api.ipify.org?format=json
```

*   Bring down docker-compose

```
docker-compose -f docker-compose-local.yaml down
```

## Running the test in Cloud Build

*   Submit a Cloud Build request and verify that the public IP for NAT is used
    by Step 2

```
gcloud builds submit . --substitutions=$(sed -z 's/\n/,_/g;s/,_$/\n/;s/^/_/' .env)
```
