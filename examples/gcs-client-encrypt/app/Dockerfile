FROM python:3.9-slim

WORKDIR /app

COPY requirement.txt .
RUN pip install --no-cache-dir -r requirement.txt

COPY gcs-client.py .

ENV FLASK_APP=gcs-client.py
ENV FLASK_ENV=development
ENV FLASK_RUN_PORT=8000

EXPOSE 8000

CMD ["flask", "run", "--host=0.0.0.0"]
