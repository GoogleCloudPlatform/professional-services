FROM apache/beam_python3.9_sdk:2.44.0

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY lib.py ./

ENTRYPOINT ["/opt/apache/beam/boot"]