FROM python:3.9


COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY src .
ENV PYTHONPATH=/
