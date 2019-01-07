# Copyright 2019 Google Inc.
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

"""A HTTP server that runs the Cloud Asset Inventory export and import process.


This server can run anywhere and can be invoked on a schedule to periodically
export the inventory assets and run the beam pipline to import into BigQuery.
The arguments are supplied in the `config.yaml` file in the same directory.

Works on python2.7 and python3 App Engine Standard when invoking the beam
pipeline via a template.

"""

from __future__ import print_function
import site
import importlib
import pkg_resources

site.addsitedir('lib')
try:
    importlib.reload(pkg_resources)
except AttributeError:
    pass

import yaml
import os
import logging
import json
import datetime
from flask import Flask, request
from asset_inventory import pipeline_runner
from asset_inventory import export
import pprint

app = Flask(__name__)


def get_export_arguments():
    """Convert environment values into arguments."""
    env = os.environ
    return (env['EXPORT_PARENT'], env['GCS_DESTINATION'],
            [ct.strip() for ct in env['EXPORT_CONTENT_TYPES'].split(',')],
            [at.strip() for at in env['EXPORT_ASSET_TYPES'].split(',')])


def get_import_arguments():
    """Convert environment values into arguments."""
    env = os.environ
    return (env['IMPORT_PIPELINE_RUNNER'], env['IMPORT_DATAFLOW_PROJECT'],
            env['IMPORT_TEMPLATE_REGION'], env['IMPORT_TEMPLATE_LOCATION'],
            '{}/*.json'.format(env['GCS_DESTINATION']), env['IMPORT_GROUP_BY'],
            env['IMPORT_WRITE_DISPOSITION'], env['IMPORT_DATASET'],
            env['IMPORT_STAGE'],
            datetime.datetime.now().isoformat(),
            env['IMPORT_PIPELINE_ARGUMENTS'],
            json.loads(env['IMPORT_PIPELINE_RUNTIME_ENVIRONMENT']))


def run_import():
    """Run the import pipeline."""

    # Load time is the current time.
    import_arguments = get_import_arguments()
    logging.info('running import %s', import_arguments)
    (runner, dataflow_project, template_region, template_location,
     input_location, group_by, write_disposition, dataset, stage, load_time,
     pipeline_arguments, pipeline_runtime_environment) = import_arguments

    if runner == 'template':
        return pipeline_runner.run_pipeline_template(
            dataflow_project, template_region,
            template_location, input_location,
            group_by, write_disposition, dataset, stage,
            load_time, pipeline_runtime_environment)
    else:
        return pipeline_runner.run_pipeline_beam_runner(
            runner, dataflow_project, input_location,
            group_by, write_disposition, dataset, stage, load_time,
            pipeline_arguments)


@app.route('/export_import')
def run_export_import():
    """Run export and import process."""

    # Optionally require that we are invoked by a cron tasks and not any old
    # pulic HTTP request.
    if (os.environ['RESTRICT_TO_CRON_TASKS'] and
        os.environ['RESTRICT_TO_CRON_TASKS'] != 'false'):
        if 'X-Appengine-Cron' not in request.headers:
            return '', 403

    # perform export
    export_arguments = get_export_arguments()
    export_result = export.export_to_gcs_content_types(*export_arguments)

    # perform import
    final_state, pipeline_result = run_import()

    # Return 200 if everything worked.
    status_code = 200
    if not pipeline_runner.is_successful_state(final_state):
        status_code = 500

    return pprint.pformat({
        'export_result': export_result,
        'pipeline_result': pipeline_result
    }), status_code


@app.errorhandler(500)
def server_error(_):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500


logging.basicConfig()
logging.getLogger().setLevel(logging.INFO)
with open('config.yaml') as app_yaml:
    app_yaml = yaml.load(app_yaml)
    env_variables = app_yaml['env_variables']
    for env_variable in env_variables:
        os.environ[env_variable] = env_variables[env_variable]

if __name__ == '__main__':
    app.run(debug=True, port=5000)
