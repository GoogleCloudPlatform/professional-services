FROM gcr.io/tfx-oss-public/tfx:1.8.0

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt

# RuntimeError: module compiled against api version 0xe but this version of numpy is 0xd
# Fixed by below command - see https://stackoverflow.com/questions/33859531/runtimeerror-module-compiled-against-api-version-a-but-this-version-of-numpy-is

RUN pip install -U numpy --ignore-installed

COPY src/ src/

ENV PYTHONPATH="/pipeline:${PYTHONPATH}"
