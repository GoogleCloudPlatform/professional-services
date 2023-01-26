FROM python:3.9-slim

RUN pip install Flask gunicorn google-cloud-bigquery redis jinja2 google-cloud-storage kfp google-cloud-aiplatform google-cloud-pipeline-components db-dtypes

ENV APP_HOME /app

WORKDIR $APP_HOME

COPY main.py ./main.py

COPY config.ini ./config.ini

CMD exec gunicorn --bind :$PORT main:app