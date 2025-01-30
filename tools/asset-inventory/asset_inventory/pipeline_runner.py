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
"""Code to invoke the pipeline."""

import logging
import pprint
import time

from googleapiclient.discovery import build
from oauth2client.client import GoogleCredentials


def get_job_name(load_time):
    """User-friendly job name from load_time."""
    return ('cloud-asset-import-' + load_time.lower().replace(
        ':', '-').replace(' ', '').replace('.', '-'))


def is_successful_state(final_state):
    """True if the status is successful.

    Checks both for beam and template runner success codes.

    Args:
        final_state: Final state the pipeline is in.

    Returns:
        True if the job was successful.
    """
    if final_state not in ['JOB_STATE_DONE', 'DONE']:
        return False
    return True


def wait_on_pipeline_job(df_service, pipeline_job):
    """Poll the job status every 60 seconds until done."""
    dataflow_project = pipeline_job['projectId']
    template_region = pipeline_job['location']
    job_id = pipeline_job['id']
    pipeline_job = df_service.projects().locations().jobs().get(
        location=template_region, projectId=dataflow_project,
        jobId=job_id).execute(num_retries=5)
    logging.info('job status %s', pprint.pformat(pipeline_job))
    current_state = pipeline_job['currentState']
    # We have reached a terminal state.
    if current_state in [
        'JOB_STATE_DONE', 'JOB_STATE_FAILED', 'JOB_STATE_CANCELLED',
        'JOB_STATE_UPDATED', 'JOB_STATE_DRAINED'
    ]:
        logging.info('final pipeline state : %s', current_state)
        return current_state, pipeline_job
    logging.info('sleeping 60 seconds before polling.')
    time.sleep(60)
    return wait_on_pipeline_job(df_service, pipeline_job)


def run_pipeline_template(dataflow_project, template_region, template_location,
                          input_location, group_by, write_disposition, dataset,
                          stage, load_time, num_shards, add_load_date_suffix,
                          runtime_environment):
    """Invoke the supplied pipeline template.

    Args:
        dataflow_project: Project to run the dataflow job in.
        template_region: Region to run the job in.
        template_location: GCS path to the template file.
        input_location: GCS path load json documents from,
        group_by: How to split assets into tables.
        write_disposition: To append to or overwrite BigQuery tables.
        dataset: BigQuery dataset to write to.
        stage: GCS path to write BigQuery load files.
        load_time: Timestamp or date to load data with.
        num_shards: Shards for each asset type.
        add_load_date_suffix: If the load date is added as a table suffix.
        runtime_environment: Dict  supplying other runtime overrides.
    Returns:
        End state of the pipline and job object.
    """
    credentials = GoogleCredentials.get_application_default()
    df_service = build('dataflow', 'v1b3', credentials=credentials,
                       cache_discovery=False)

    # Set the following variables to your values.
    job_name = get_job_name(load_time)
    body = {
        'jobName': job_name,
        'parameters': {
            'input': input_location,
            'load_time': load_time,
            'stage': stage,
            'group_by': group_by,
            'write_disposition': write_disposition,
            'num_shards': num_shards,
            'add_load_date_suffix': add_load_date_suffix,
            'dataset': dataset,
        },
        'environment': runtime_environment
    }
    logging.info('launching template %s in %s:%s with %s', template_location,
                 dataflow_project, template_region, pprint.pformat(body))
    launch_result = df_service.projects().locations().templates().launch(
        location=template_region,
        projectId=dataflow_project,
        gcsPath=template_location,
        body=body).execute(num_retries=5)

    logging.info('waiting on pipeline : %s', pprint.pformat(launch_result))
    return wait_on_pipeline_job(df_service, launch_result['job'])


def run_pipeline_beam_runner(pipeline_runner, dataflow_project, input_location,
                             group_by, write_disposition, dataset, stage,
                             load_time, num_shards, add_load_date_suffix,
                             pipeline_arguments):
    """Invokes the pipeline with a beam runner.

    Only tested with the dataflow and direct runners.

    Args:
        pipeline_runner: The Beam runner to use.
        dataflow_project: Project to run the dataflow job in.
        input_location: GCS path load json documents from,
        group_by: How to split assets into tables.
        write_disposition: To append to or overwrite BigQuery tables.
        dataset: BigQuery dataset to write to.
        stage: GCS path to write BigQuery load files.
        load_time: Timestamp to add to data during BigQuery load.
        num_shards: Shards for each asset type.
        add_load_date_suffix: If the load date is added as a table suffix.
        pipeline_arguments: List of additional runner arguments.
    Returns:
        The end state of the pipeline run (a string), and PipelineResult.
    """

    # pylint: disable=import-error
    # import on demand as we don't want to depend on pipeline code which imports
    # apache beam code unless we are using a beam runner and not invoking a
    # template.
    from asset_inventory import import_pipeline
    job_name = get_job_name(load_time)

    pipeline_parameters = pipeline_arguments

    parameters = {
        '--load_time': load_time,
        '--job_name': job_name,
        '--project': dataflow_project,
        '--input': input_location,
        '--group_by': group_by,
        '--write_disposition': write_disposition,
        '--num_shards': num_shards,
        '--add_load_date_suffix': add_load_date_suffix,
        '--dataset': dataset,
        '--stage': stage,
        '--runner': pipeline_runner
    }
    for arg_name, value in parameters.items():
        if value and arg_name not in pipeline_parameters:
            pipeline_parameters += [arg_name, value]
    pipeline_result = import_pipeline.run(pipeline_parameters)
    logging.info('waiting on pipeline : %s', pprint.pformat(pipeline_result))
    state = pipeline_result.wait_until_finish()
    logging.info('final pipeline state: %s', state)
    return pipeline_result.state, pipeline_result
