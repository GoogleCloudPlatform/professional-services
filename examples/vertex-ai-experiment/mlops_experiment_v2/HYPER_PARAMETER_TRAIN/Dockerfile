FROM us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.0-23:latest
#FROM python:3.9-slim

WORKDIR /root

# Installs hypertune library
RUN pip install cloudml-hypertune

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install gcsfs fsspec interpret scikit-learn google-cloud-bigquery db-dtypes google-cloud-storage

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install --upgrade pandas

# Copies the trainer code to the docker image.
COPY hyper_parameter_task.py /root/hyper_parameter_task.py

# Sets up the entry point to invoke the trainer.
ENTRYPOINT ["python3","hyper_parameter_task.py"]