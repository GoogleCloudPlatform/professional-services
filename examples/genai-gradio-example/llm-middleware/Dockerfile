
FROM python:3.11-slim

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy local code to the container image.
ENV APP_HOME /app
ENV PORT 8080
WORKDIR $APP_HOME
COPY ./app ./

# Install production dependencies.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app