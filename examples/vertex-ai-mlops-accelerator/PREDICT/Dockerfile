# Specifies base image and tag
FROM us-docker.pkg.dev/vertex-ai/prediction/sklearn-cpu.0-23:latest

WORKDIR /root

RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install gcsfs fsspec google-cloud-storage interpret waitress numpy scikit-learn flask gunicorn pandas fastapi flask_cors

COPY config.ini /root/config.ini

COPY model.joblib /root/model.joblib

# Copies the trainer code to the docker image.
COPY prediction_server_beta.py /root/prediction_server_beta.py