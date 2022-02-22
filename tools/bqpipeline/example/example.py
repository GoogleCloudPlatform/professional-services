#!/usr/bin/env python
# -*- coding: utf-8 -*-
from bqpipeline.bqpipeline import BQPipeline
import sys

if __name__ == "__main__":
    JOB_NAME = sys.argv[1]
    PROJECT = sys.argv[2]
    DATASET = sys.argv[3]
    bq = BQPipeline(job_name=JOB_NAME,
                    query_project=PROJECT,
                    default_project=PROJECT,
                    default_dataset=DATASET,
                    json_credentials_path='credentials.json')

    replacements = {
        'project': PROJECT,
        'dataset': DATASET
    }

    # It's possible to leave project and dataset unspecified if defaults have been set
    tbl1 = '.'.join([PROJECT, DATASET, 'tmp_table_1'])
    tbl2 = '.'.join([DATASET, 'tmp_table_2'])
    tbl3 = '.'.join([PROJECT, DATASET, 'tmp_table_3'])
    tbl4 = '.'.join([PROJECT, DATASET, 'tmp_table_4'])
    tbl5 = '.'.join([DATASET, 'tmp_table_5'])
    tbl6 = 'tmp_table_6'

    bq.run_queries(
        [
            ('q1.sql', tbl1),
            ('q2.sql', tbl2),
            ('q3.sql', 'tmp_table_3'),
            'q4.sql'
        ],
        **replacements
    )

    bq.copy_table(tbl3, tbl4)
    bq.copy_table(tbl4, tbl5)
    bq.copy_table('tmp_table_5', tbl6)

    bq.export_csv_to_gcs(tbl6)

    bq.delete_tables([
        tbl1,
        tbl2,
        'tmp_table_3',
        tbl4,
        tbl5,
        tbl6,
    ])
