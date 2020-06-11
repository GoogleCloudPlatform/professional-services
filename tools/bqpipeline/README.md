# BigQuery Pipeline

Utility class for building data pipelines in BigQuery.

Provides methods for query, copy table and delete table.

Supports Jinja2 templated SQL.


## Usage

Create an instance of BQPipeline. By setting query_project, default_project and default_dataset, you can omit project and dataset from table references in your SQL statements.

`query_project` is the project that will be billed for queries.

`default_project` is the project used when a tablespec does not specify a project.

`default_dataset` is the dataset used when a tablespec does not specify project or dataset.

Place files containing a single BigQuery Standard SQL statement per file.

Note that if you reference a project with a '-' in the name, you must quote the tablespec in your SQL: ````my-project.dataset_id.table_id````


```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
from bqpipeline.bqpipeline import BQPipeline

bq = BQPipeline(job_name='myjob',
                query_project='myproject',
                default_project='myproject',
                default_dataset='mydataset',
                json_credentials_path='credentials.json')

replacements = {
    'project': 'myproject',
    'dataset': 'mydataset'
}

bq.copy_table('source_table', 'dest_table')

bq.run_queries(['q1.sql', 'q2.sql'], **replacements)

bq.export_csv_to_gcs('tmp_table_2', 'gs://my-bucket/path/to/tmp_table_2-*.csv')

bq.delete_tables(['tmp_table_1', 'tmp_table_2'])
```

Note, that the `run_queries` method provided this utility can alternatively take a list of tuples where the first entry is the sql path, and the second is a destination table. You can see an example of this in [`example.py`](example/example.py).

For detailed documentation about the methods provided by this utility class see [docs.md](docs.md).

### Creating Service Account JSON Credentials

1. Visit the [Service Account Console](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select a service account
3. Select "Create Key"
4. Select "JSON"
5. Click "Create" to download the file


## File Layout
- [bqpipeline.py](bqpipeline/bqpipeline.py) BigQuery client wrapper
- [example](example) Example pipeline using service account credentials


## Installation

### Optional: Install in virtualenv

```
python3 -m virtualenv venv
source venv/bin/activate
```

### Install with pip

```
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/tools/bqpipeline
python3 -m pip install .
```


## Requirements

You'll need to [download Python 3.4 or later](https://www.python.org/downloads/)

[Google Cloud Python Client](https://github.com/googleapis/google-cloud-python)


### pip

```
python3 -m pip install --user --upgrade pip
```

### Optional: virtualenv

```
python3 -m pip install --user virtualenv
```

## Disclaimer

This is not an official Google project.


## References

[Python Example Code](https://github.com/GoogleCloudPlatform/python-docs-samples)
[google-cloud-bigquery](https://pypi.org/project/google-cloud-bigquery/)
[Jinja2](http://jinja.pocoo.org/docs/2.10/)
