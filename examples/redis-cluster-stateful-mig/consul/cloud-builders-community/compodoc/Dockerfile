FROM node:10.15.1-alpine

LABEL maintainer="Ram Gopinathan"

ARG COMPODOC_VER=1.1.8

RUN apk update \
  && apk add --update alpine-sdk python bash \
  && yarn global add @compodoc/compodoc@${COMPODOC_VER} \
  && apk del alpine-sdk python \
  && rm -rf /tmp/* /var/cache/apk/* *.tar.gz ~/.npm \
  && npm cache clean --force \
  && yarn cache clean

COPY ./launch.sh /opt/launch.sh

ENTRYPOINT ["/opt/launch.sh"]
