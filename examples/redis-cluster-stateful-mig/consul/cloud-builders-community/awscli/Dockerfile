FROM python:3-alpine
RUN apk add --update \
    groff \
    less  \
  && pip install awscli \
  && rm -rf /var/cache/apk/* ~/.cache/pip
ENV PAGER=less
ENTRYPOINT ["aws"]
