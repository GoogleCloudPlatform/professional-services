FROM "node:8.15"

COPY . .

# Download and install required tools.
RUN curl -L https://get.pulumi.com/ | bash

ENV PATH=$PATH:/root/.pulumi/bin

ENTRYPOINT [ "pulumi", "version" ]
