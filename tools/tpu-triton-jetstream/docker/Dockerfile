FROM nvcr.io/nvidia/tritonserver:24.01-py3

USER root

# Install tools.
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/$distro/$arch/3bf863cc.pub


RUN apt-get update
RUN apt-get install -y --no-install-recommends apt-utils
RUN apt-get install -y --no-install-recommends curl
RUN apt-get install -y --no-install-recommends wget
RUN apt-get install -y --no-install-recommends git

# Install libraries.
ENV PIP_ROOT_USER_ACTION=ignore
RUN python3 -m pip install --upgrade pip
RUN pip install google-cloud-storage==2.7.0
RUN pip install fairscale==0.4.13
RUN pip install fastapi==0.100.1
RUN pip install psutil==5.9.5
RUN pip install sentencepiece==0.1.99
RUN pip install transformers==4.33.2
RUN pip install uvicorn==0.23.2
RUN pip install numpy==1.24.4

# Install ray with nightly build to enable TPU resource.
# https://github.com/ray-project/ray/pull/38669
RUN pip install "ray[serve]"==2.9.0

# torch cpu
RUN pip3 install torch --index-url https://download.pytorch.org/whl/cpu
RUN pip3 install tensorflow flatbuffers absl-py flax sentencepiece seqio google-cloud-storage safetensors

# Install JAX
RUN mkdir jaxlib
WORKDIR /jaxlib
RUN pip3 install pip install jax[tpu] -f https://storage.googleapis.com/jax-releases/libtpu_releases.html

# install torch_xla2
WORKDIR /jaxlib
RUN git clone https://github.com/pytorch/xla.git
WORKDIR /jaxlib/xla
RUN git checkout jetstream-pytorch
WORKDIR /jaxlib/xla/experimental/torch_xla2
RUN pip install -e .

# Install JetStream from source
WORKDIR /jaxlib
RUN git clone https://github.com/google/JetStream.git
WORKDIR /jaxlib/JetStream/
# Update the logging level
RUN sed -i 's/root.setLevel(logging.DEBUG)/root.setLevel(logging.WARNING)/g' jetstream/core/orchestrator.py
RUN sed -i 's/handler.setLevel(logging.DEBUG)/handler.setLevel(logging.WARNING)/g' jetstream/core/orchestrator.py
RUN pip install -e .

# Install jetstream_pytorch using source
# TO-DO: update with git or pip install when jetstream releases the library
WORKDIR /jaxlib
COPY jetstream-pytorch/ jetstream-pytorch/
WORKDIR /jaxlib/jetstream-pytorch/
RUN pip install -e .

WORKDIR /
# Install Triton python Plugin for JetStream
RUN mkdir -p /opt/tritonserver/backends/jetstream
COPY ./src/model.py /opt/tritonserver/backends/jetstream/

# ENV PYTHON_VERBOSITY=debug

# Expose port 9000 for host serving original JetStream grpc server
EXPOSE 9000

# Expose ports for triton serving
EXPOSE 8000
EXPOSE 8001
EXPOSE 8002

ENV PJRT_DEVICE=TPU