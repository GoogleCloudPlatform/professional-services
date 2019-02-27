FROM python:3.6-slim


ENV SLUGIFY_USES_TEXT_UNIDECODE=yes

RUN set -ex \
    && buildDeps=' \
    freetds-dev \
    python3-dev \
    libkrb5-dev \
    libsasl2-dev \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    curl \
    git \
    python\
    ' \
    && apt-get update -yqq \
    && apt-get upgrade -yqq \
    && apt-get install -yqq --no-install-recommends \
    $buildDeps \
    freetds-bin \
    build-essential \
    python3-pip \
    && pip install -U pip setuptools wheel \
    && apt-get clean \
    && rm -rf \
    /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/* \
    /usr/share/man \
    /usr/share/doc \
    /usr/share/doc-base


ADD . /

RUN  curl -sSL https://sdk.cloud.google.com | bash
ENV PATH $PATH:/root/google-cloud-sdk/bin

RUN chmod +x /scripts/entrypoint.sh

ENTRYPOINT ["/scripts/entrypoint.sh"]

