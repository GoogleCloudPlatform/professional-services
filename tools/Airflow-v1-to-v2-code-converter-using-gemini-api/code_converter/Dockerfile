FROM python:3.10-slim

WORKDIR /app

ENV PYTHONUNBUFFERED TRUE
ENV PORT 8080

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 main:app

EXPOSE 8080