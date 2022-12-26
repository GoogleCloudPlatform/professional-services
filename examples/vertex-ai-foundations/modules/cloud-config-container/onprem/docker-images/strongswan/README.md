
# StrongSwan docker container

## Build

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

## Docker compose example

```yaml
version: "3"
services:
  vpn:
    image: gcr.io/pso-cft-fabric/strongswan:latest
    networks:
      default:
        ipv4_address: 192.168.0.2
    cap_add:
      - NET_ADMIN
    ports:
      - "500:500/udp"
      - "4500:4500/udp"
      - "179:179/tcp"
    privileged: true
    volumes:
      - "/lib/modules:/lib/modules:ro"
      - "/etc/localtime:/etc/localtime:ro"
      - "/var/lib/docker-compose/onprem/ipsec/ipsec.conf:/etc/ipsec.conf:ro"
      - "/var/lib/docker-compose/onprem/ipsec/ipsec.secrets:/etc/ipsec.secrets:ro"
      - "/var/lib/docker-compose/onprem/ipsec/vti.conf:/etc/strongswan.d/vti.conf:ro"
  bird:
    image: pierky/bird
    network_mode: service:vpn
    cap_add:
      - NET_ADMIN
      - NET_BROADCAST
      - NET_RAW
    privileged: true
    volumes:
      - "/var/lib/docker-compose/onprem/bird/bird.conf:/etc/bird/bird.conf:ro"

```
