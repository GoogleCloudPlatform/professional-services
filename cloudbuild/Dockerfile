# This Dockerfile builds the image used in Cloud Build CI to run 'make test'.
# To push a new image, run 'gcloud builds submit --project=cloud-eng-council --tag gcr.io/cloud-eng-council/make .'
# from this directory.

FROM python:3.8-slim

# install core tools
RUN apt-get update && apt-get install -y build-essential

# install yapf
RUN pip install yapf
RUN pip3 install yapf
RUN pip3 install flake8

# install golang (+gofmt)
RUN apt-get install -y golang

# Install nodejs (for gts)

RUN apt-get install -y wget nodejs

# installing npm 6.12.0
RUN wget https://github.com/npm/cli/archive/v6.12.0.tar.gz
RUN tar xf v6.12.0.tar.gz
WORKDIR cli-6.12.0
RUN make install

RUN npm install gts

# Install java + google-java-format jar
RUN apt-get install -y default-jdk
RUN wget https://github.com/google/google-java-format/releases/download/google-java-format-1.7/google-java-format-1.7-all-deps.jar --directory-prefix=/usr/share/java/

# install bash linter
RUN apt-get install -y shellcheck

ENTRYPOINT ["make"]
