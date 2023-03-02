
# ToolBox docker container

Lightweight container with some basic console tools used for testing and probing.

## Build

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

## Docker compose

```yaml
version: "3"
services:
  vpn:
    image: gcr.io/pso-cft-fabric/toolbox:latest
    networks:
      default:
        ipv4_address: 192.168.0.5
    cap_add:
      - NET_ADMIN
    privileged: true

```
