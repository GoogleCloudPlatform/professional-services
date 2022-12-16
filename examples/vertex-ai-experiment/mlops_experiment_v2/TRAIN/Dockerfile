# Specifies base image and tag
FROM us-docker.pkg.dev/vertex-ai/training/scikit-learn-cpu.0-23:latest

WORKDIR /root

RUN python3 -m pip install --upgrade pip

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install interpret gcsfs fsspec scikit-learn google-cloud-bigquery db-dtypes google-cloud-storage

# Copies the trainer code to the docker image.
COPY train.py /root/train.py

COPY config.ini /root/config.ini

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install --upgrade pandas

# Sets up the entry point to invoke the trainer.
ENTRYPOINT ["python3", "train.py"]