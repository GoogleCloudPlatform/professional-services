FROM apache/beam_python3.7_sdk:2.39.0

COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

COPY src/raw_schema/schema.pbtxt raw_schema/
COPY src/ src/
