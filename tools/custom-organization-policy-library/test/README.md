# Pre-Requisities

```bash
python3 -m venv venv
. venv/bin/activate
python -m pip install -r requirements.txt
```

# Tests execution

```bash
export PROJECT_ID=dbs-validator-kcc-29ae
export PREFIX=custom-org-policy-1234
pytest main.py
```