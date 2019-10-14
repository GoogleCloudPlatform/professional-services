# This Dockerfile builds the image used in Cloud Build CI to run 'make test'.
# To push a new image, run 'gcloud builds submit --project=cloud-eng-council --tag gcr.io/cloud-eng-council/make .'
# from this directory.

FROM debian

RUN apt-get update && apt-get install -y build-essential python python-pip python3 python3-pip
RUN pip install yapf
RUN pip3 install yapf

RUN apt-get install -y golang

ENTRYPOINT ["make"]
