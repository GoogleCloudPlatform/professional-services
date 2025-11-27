FROM python:3.12-slim

ENV PYTHONUNBUFFERED True

COPY requirements.txt ./

RUN pip install -r requirements.txt

WORKDIR /job
COPY . ./

CMD ["python", "main.py"]