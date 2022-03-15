FROM python:3.8-slim-buster

RUN apt-get update && apt-get install -y \
  build-essential

WORKDIR /app

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "webhook:app", "--host", "0.0.0.0", "--port", "8081"]
