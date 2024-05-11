ARG BASE_IMAGE=alpine:edge
FROM ${BASE_IMAGE}

ARG ANSIBLE_VERSION=2.7.0-r1

RUN apk add --update ansible openssh-client && \
    rm -rf /var/cache/apk/*

ENTRYPOINT ["/usr/bin/ansible-playbook"]
