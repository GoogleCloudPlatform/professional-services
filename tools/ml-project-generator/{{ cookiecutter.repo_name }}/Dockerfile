FROM python:3.9

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./{{ cookiecutter.repo_name }} /app/{{ cookiecutter.repo_name }}

ENV PYTHONPATH "${PYTHONPATH}:/app"

CMD ["python", "/app/{{ cookiecutter.repo_name }}/main.py predict"]
