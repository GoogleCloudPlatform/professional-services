# Use the official lightweight Python image.
# https://hub.docker.com/_/python
FROM python:3.10-slim
ENV PYTHONUNBUFFERED True
ENV SERVING_PORT 8080

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME
COPY . ./

RUN pip install --no-cache-dir -r requirements.txt
CMD exec gunicorn --bind :$SERVING_PORT --workers 1 --threads 8 --timeout 0 main:app
