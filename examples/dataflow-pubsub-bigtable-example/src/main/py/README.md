# MetricsApp

### Setup
```sh
pip install --user virtualenv
python -m virtualenv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Running

```sh
export FLASK_APP=query.py
python -m flask run
```

### Testing

```sh
curl "http://localhost:5000/metrics?host=h127&dc=dc3&region=r1&limit=3"
curl "http://localhost:5000/top?host=h127&dc=dc3&regior1&limit=3"
```

