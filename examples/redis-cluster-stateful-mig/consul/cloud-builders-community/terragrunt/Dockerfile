FROM gcr.io/cloud-builders/gcloud as builder
LABEL MAINTAINER marcin.niemira@gmail.com

ARG TERRAFORM_VERSION
ARG TERRAFORM_VERSION_SHA256SUM
ARG TERRAGRUNT_VERSION
ARG TERRAGRUNT_VERSION_SHA256SUM

WORKDIR /builder/terragrunt

RUN apt-get update
RUN apt-get -y install unzip wget curl ca-certificates
RUN curl https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip > terraform_linux_amd64.zip
RUN echo "${TERRAFORM_VERSION_SHA256SUM} terraform_linux_amd64.zip" > terraform_SHA256SUMS
RUN sha256sum -c terraform_SHA256SUMS --status
RUN unzip terraform_linux_amd64.zip -d /builder/terragrunt

RUN wget -q https://github.com/gruntwork-io/terragrunt/releases/download/v${TERRAGRUNT_VERSION}/terragrunt_linux_amd64
RUN echo "${TERRAGRUNT_VERSION_SHA256SUM} terragrunt_linux_amd64" > terragrunt_SHA256SUMS
RUN sha256sum -c terragrunt_SHA256SUMS --status


FROM gcr.io/cloud-builders/gcloud
LABEL MAINTAINER marcin.niemira@gmail.com

ENV PATH=/builder/terragrunt/:$PATH

WORKDIR /builder/terragrunt

COPY --from=builder /builder/terragrunt/terraform ./
COPY --from=builder /builder/terragrunt/terragrunt_linux_amd64 ./terragrunt

COPY entrypoint.bash /builder/entrypoint.bash

RUN chmod +x ./terraform
RUN chmod +x ./terragrunt

ENTRYPOINT ["/builder/entrypoint.bash"]
