# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#!/usr/bin/env python

# Copyright 2019 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Start preprocessing job for Survival Analysis TFRecords"""

import argparse
import logging
import sys
import os
from datetime import datetime
import posixpath

from preprocessor import preprocess


def parse_arguments(argv):
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser()
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    parser.add_argument(
        '--job_name',
        default='{}-{}'.format('bq-to-tfrecords', timestamp)
    )
    parser.add_argument(
        '--output_dir',
        default=os.path.join('gs://internal-klm/survival', timestamp)
    )
    parser.add_argument(
        '--log_level',
        help='Set logging level',
        default='INFO'
    )
    parser.add_argument(
        '--bq_table',
        help="""""",
        default='bigquery-public-data.google_analytics_sample.ga_sessions_*'
    )
    parser.add_argument(
        '--machine_type',
        help="""Set machine type for Dataflow worker machines.""",
        default='n1-highmem-4'
    )
    parser.add_argument(
        '--cloud',
        help="""Run preprocessing on the cloud. Default False.""",
        action='store_true',
        default=False
    )
    parser.add_argument(
        '--project_id',
        help="""Google Cloud project ID""",
        default='internal-klm'
    )
    known_args, _ = parser.parse_known_args(argv)

    return known_args


def get_pipeline_args(flags):
    """Create Apache Beam pipeline arguments"""
    options = {
        'project': flags.project_id,
        'staging_location': os.path.join(flags.output_dir, 'staging'),
        'temp_location': os.path.join(flags.output_dir, 'temp2'),
        'job_name': flags.job_name,
        'save_main_session': True,
        'setup_file': posixpath.abspath(
            posixpath.join(posixpath.dirname(__file__), 'setup.py'))
    }
    return options


def main():
    flags = parse_arguments(sys.argv[1:])
    pipeline_args = get_pipeline_args(flags)
    logging.basicConfig(level=getattr(logging, flags.log_level.upper()))
    preprocess.run(flags, pipeline_args)


if __name__ == '__main__':
    main()
