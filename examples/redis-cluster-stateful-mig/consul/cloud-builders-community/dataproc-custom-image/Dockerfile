FROM google/cloud-sdk:latest

RUN apt-get -y update \
    && apt-get install python-dev -y \
    && apt-get install git curl -y

RUN curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py \
    && python get-pip.py \
    && pip install -U pip \
    && pip install numpy  

RUN git clone https://github.com/GoogleCloudPlatform/dataproc-custom-images.git

COPY dataproc-custom-image.sh /usr/local/bin/dataproc-custom-image.sh

ENTRYPOINT ["bash", "-C", "/usr/local/bin/dataproc-custom-image.sh"]