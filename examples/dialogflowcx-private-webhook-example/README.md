# Dialogflow CX - Private Webhook example
Simple Dialogflow CX webhook for demo and troubleshooting purpose. Solution based on [`FastAPI`](https://fastapi.tiangolo.com/). Example designed to implement a Dialogflow CX webhook using [Service Directory for private network access](https://cloud.google.com/dialogflow/cx/docs/concept/webhook#sd) using a [self signed certificate](https://cloud.google.com/dialogflow/cx/docs/concept/webhook#https_certificate_verification).

The example can be adapted to support external URL and public certificates tweaking the `docker-compose` configuration.

For local testing purposes, a simple endpoint can be started with the following command:
```
python3 -m venv env
source env/bin/activate
uvicorn webhook:app --host 0.0.0.0 --port 8081
```

You can open your browser `http://127.0.0.1:8081/docs` to check and test your webhook endpoints.

The webhook suports 2 Dialgflow webhook `tags`: 
  - `Default Welcome Intent`: it returns always `Hi from a Python Webhook!` message
  - `echo`: it returns the sentence sent by the intent in the form of `You said: $SENTENCE`

## Tests
Tests are written using `pytest`. You can run tests with the following command:
```
pytest
```

## Project Structure
```
.
├── modules             # Folder containing Data structure
  ├── request.py        # Data structure definition for Dialogflow webhook request
  ├── resposne.py       # Data structure definition for Dialogflow webhook response
├── docker-compose.yaml # Docker compose YAML configuration to deploy Traefik and Webhook containers
├── Dockerfile          # Dockerfile to define a docker container
├── requirements.txt    # Python requirement file
├── webhook_test.py     # pytest
├── webhook.py          # Main file
 
```
## Architecture
The solution can be deployed on any environment, this demo assumes the following:
- The solution relies on a single GCP project with single project VPC
- The solution runs a GCE instance
- The GCE instance has no public IP
- The GCE instance runs on the same region as the Dialogflow agent

## Deployment 
Dialogflow CX requires the webhook to support HTTPS requests. The solution is designed to handle requests for host `webhook.internal`, it relies on a self-signed certificate and it uses [`Traefik`](https://traefik.io/) reverse-proxy to handle SSL certificates.

### Prerequisites
The following components are present on the GCE instance:
- Openssl
- Docker
- Docker-Compose

### Create Self Signed certificates
To create a self-signed certification, run the following command in the `certificate` folder:

```
export DOMAIN=webhook.internal

openssl genrsa -out server.key 2048
openssl req -nodes -new -sha256 -newkey rsa:2048 -key server.key -subj "/CN=${DOMAIN}" -out server.csr
openssl x509 -req -days 3650 -sha256 -in server.csr -signkey server.key -out server.crt -extfile <(printf "\nsubjectAltName='DNS:${DOMAIN}'")
openssl x509 -in server.crt -out server.der -outform DER
```

### Run `docker-compose`
Run `docker-compose` to deploy your application:

```
docker-compose up -d
```

### Configure DialogFlow CX Agent
Configure your Dialogflow CX agent:
- [Configure the Dialgoflow agent webhook](https://cloud.google.com/dialogflow/cx/docs/concept/webhook#sd) to use Service Directory for private network access. 
  - The webhook URL is `https://webhook.internal/weebhook`. 
  - Upload the `DER` self-signed certificate created.
- Configure the Dialogflow intent to use the configured webhook. 

## Test your Agent - Webhook interaction
Open the Dialogflow CX `Test agent` section and trigger the intent you configured.
