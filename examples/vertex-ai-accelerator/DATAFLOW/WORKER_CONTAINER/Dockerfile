FROM python:3.7-buster

# Copy files from official SDK image, including script/dependencies.
COPY --from=apache/beam_python3.7_sdk:latest /opt/apache/beam /opt/apache/beam

RUN python3 -m pip install --upgrade pip

# Installs additional packages
RUN python3 -m pip --trusted-host=pypi.python.org --trusted-host=pypi.org --trusted-host=files.pythonhosted.org install apache-beam==2.41.0 tensorflow_data_validation==1.11.0 google-cloud-aiplatform==1.19.0 pandas numpy redis

# Copies the trainer code to the docker image.
COPY data_prep /data_prep

# Set the entrypoint to Apache Beam SDK launcher.
ENTRYPOINT ["/opt/apache/beam/boot"]