FROM locustio/locust

# Set working directory
WORKDIR /tasks

# Copy Locust task file
COPY locust_tests/locust.py ./

# Install dependencies
RUN pip install -U \
    google-auth \
    google-cloud-storage \
    google-cloud-logging \
    python-dotenv \
    google-cloud-aiplatform \
    grpcio \
    grpc_interceptor \
    grpcio-status

# No need to copy the config file here since it's mounted as a ConfigMap
# The command to run will be provided by the Kubernetes deployment