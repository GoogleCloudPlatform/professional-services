from collections import defaultdict
import argparse
import datetime
import logging
import pandas
from google.api_core.exceptions import NotFound
from google.cloud import bigquery
from google.cloud import datastore
log = logging.getLogger()


class BQHelper(object):

  def __init__(self, dataset_str, table_str):
    self._client = bigquery.Client()
    self._table_str = table_str
    self._dataset = None
    self._table = None
    self._projects = None
    self._dataset = self._create_dataset_if_needed(dataset_str)

  @property
  def project(self):
    return self._project

  @property
  def client(self):
    return self._client

  @property
  def dataset(self):
    return self._dataset

  @property
  def table_ref(self):
    if not self._table:
      self._table = self.dataset.table(self._table_str)
    return self._table

  def save_in_bq(self, df):
    if len(df) > 0:
      self.client.load_table_from_dataframe(df, self.table_ref)

  def _create_dataset_if_needed(self, dataset_str):
    try:
      return bigquery.Dataset(self.client.dataset(dataset_str))
    except NotFound:
      return bigquery.create_dataset(self.client.dataset(dataset_str))

  @property
  def projects(self):
    if not self._projects:
      self._projects = [p.project_id for p in self.client.list_projects()]
    return self._projects

  '''@property
  def projects(self):
    return ['data-analysis-sme-arif']'''

  def get_job(self, project_id, job_id):
    return self.client.get_job(job_id, project_id)

  def get_jobs(self, project_id, last_time, current_time):
    return list(
        self.client.list_jobs(
            project_id,
            min_creation_time=last_time,
            max_creation_time=current_time,
            all_users=True))


class Marker(object):
  marker_kind = 'marker'
  pending_jobs_kind = 'pending_jobs'

  def __init__(self, default_to_days=30):
    self._client = datastore.Client()
    self._default_days_back = default_to_days

  @property
  def client(self):
    return self._client

  @property
  def default_days_back(self):
    return self._default_days_back

  def get_last_point(self, project):
    key = self.client.key(Marker.marker_kind, project)
    last_point = self.client.get(key)
    if not last_point:
      return datetime.datetime.now() - datetime.timedelta(
          days=self.default_days_back)
    return last_point.values()[0]

  def set_last_point(self, project_id, point_in_time):
    key = self.client.key(Marker.marker_kind, project_id)
    last_point = datastore.Entity(key=key)
    last_point['last_point'] = point_in_time
    self.client.put(last_point)

  def get_pending_jobs(self, project_id):
    key = self.client.key(Marker.pending_jobs_kind, project_id)
    jobs = self.client.get(key)
    vals = jobs.values()[0] if jobs and jobs.values() else []
    return vals

  def set_pending_jobs(self, project_id, jobs):
    key = self.client.key(Marker.pending_jobs_kind, project_id)
    pending_jobs = datastore.Entity(key=key)
    pending_jobs['pending_jobs'] = jobs
    self.client.put(pending_jobs)


class JobProcessor(object):

  def __init__(self, bq_helper):
    self._bq_helper = bq_helper
    self._marker = Marker()

  @property
  def marker(self):
    return self._marker

  @property
  def bq_helper(self):
    return self._bq_helper

  def _get_starting_second_time(self, mytime):
    return datetime.datetime(
        year=mytime.year,
        month=mytime.month,
        day=mytime.day,
        hour=mytime.hour,
        minute=mytime.minute,
        second=mytime.second)

  def _get_missing_in_between_second_windows(self, windows):
    if not windows:
      return {}

    keys = sorted(windows.keys())
    new_windows = {}

    for a_time in range(1, len(keys)):
      seconds = pandas.date_range(
          keys[a_time - 1], keys[a_time], freq='S').tolist()
      seconds = [sec.to_pydatetime() for sec in seconds]
      for sec in seconds:
        new_windows[sec] = windows[keys[a_time - 1]]
      new_windows[keys[a_time - 1]] = windows[keys[a_time - 1]]
    new_windows[keys[len(keys) - 1]] = windows[keys[len(keys) - 1]]
    return new_windows

  def get_time_lines_df(self, project_id, job):
    if not hasattr(job, 'timeline') or not job.timeline:
      return self._get_empty_df()

    windows = defaultdict(lambda: (0, 0))
    start_time = job.started

    for timeline in job.timeline:
      pending_units = timeline.pending_units
      active_units = timeline.active_units
      slots_millis = timeline.slot_millis
      elapsed_ms = timeline.elapsed_ms
      stage_start_time = start_time + datetime.timedelta(
          milliseconds=elapsed_ms)
      stage_starting_second_time = self._get_starting_second_time(
          stage_start_time)

      windows[stage_starting_second_time] = (
          max(windows[stage_starting_second_time][0], pending_units),
          max(windows[stage_starting_second_time][1], active_units))

    windows = self._get_missing_in_between_second_windows(windows)
    df = pandas.DataFrame(windows).T.reset_index()
    df.columns = ['time_window', 'pending_units', 'active_units']
    df['project_id'] = str(project_id)
    df['job_id'] = str(job.job_id)
    return df

  def _get_empty_df(self):
    return pandas.DataFrame(columns=[
        'time_window', 'pending_units', 'active_units', 'project_id', 'job_id'
    ])

  def _get_job_list(self, project_id, current_time):
    prev_jobs_list = [
        self.bq_helper.get_job(project_id, job_id)
        for job_id in self.marker.get_pending_jobs(project_id)
    ]
    last_time = self.marker.get_last_point(project_id)
    curr_jobs_list = self.bq_helper.get_jobs(project_id, last_time,
                                             current_time)
    return prev_jobs_list + curr_jobs_list

  def get_current_time(self):
    return datetime.datetime.utcnow()

  def run(self):
    project_list = self.bq_helper.projects
    current_time = self.get_current_time()
    for project_id in project_list:
      log.info('Started processing jobs for project %s' % project_id)
      pending_or_running_jobs = []
      job_list = self._get_job_list(project_id, current_time)
      all_timelines_df = self._get_empty_df()
      for job in job_list:
        if job.state == u'DONE':
          time_lines_df = self.get_time_lines_df(project_id, job)
          all_timelines_df = all_timelines_df.append(
              time_lines_df, ignore_index=True)
        else:
          pending_or_running_jobs.append(job.job_id)

      self.bq_helper.save_in_bq(all_timelines_df)
      self.marker.set_pending_jobs(project_id, pending_or_running_jobs)
      self.marker.set_last_point(project_id, current_time)
      log.info('Finished processing jobs for project %s' % project_id)
    return


if __name__ == '__main__':
   """Main entry point."""
   parser = argparse.ArgumentParser()
   parser.add_argument(
      '--sink-dataset',
      dest='dataset',
      default=
      'slots_deficits',
      required=False,
      help='Dataset where the deficit table will get exported to.')
   parser.add_argument(
      '--sink-table',
      dest='table',
      default=
      'slots_deficits',
      required=False,
      help='Table to export slots deficit data.')
   known_args,_ = parser.parse_known_args()
   JobProcessor(BQHelper(known_args.dataset, known_args.table)).run()
