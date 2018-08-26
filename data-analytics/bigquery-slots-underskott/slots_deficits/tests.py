import slots_timeline
import unittest
import pandas as pd
from pandas import Timestamp
from pandas.util.testing import assert_frame_equal
import os
import sys
from mock import Mock, MagicMock

import datetime
class TestJobProcessor(unittest.TestCase):
  '''
  Basic Tests
  '''
  def setUp(self):
    mock_timeline1 = MagicMock()
    mock_timeline1.pending_units = 10
    mock_timeline1.active_units = 5
    mock_timeline1.slot_millis = 2
    mock_timeline1.elapsed_ms = 0

    mock_timeline2 = MagicMock()
    mock_timeline2.pending_units = 20
    mock_timeline2.active_units = 1
    mock_timeline2.slot_millis = 3
    mock_timeline2.elapsed_ms = 2234

    mock_timeline3 = MagicMock()
    mock_timeline3.pending_units = 0
    mock_timeline3.active_units = 0
    mock_timeline3.slot_millis = 0
    mock_timeline3.elapsed_ms = 2244

    expected_df = pd.DataFrame({
      'time_window':[datetime.datetime(1970, 1, 1, 1, 1, 1, 0),
                     datetime.datetime(1970, 1, 1, 1, 1, 2, 0),
                     datetime.datetime(1970, 1, 1, 1, 1, 3, 0),
                    ],
      'job_id':['mock_job_id', 'mock_job_id', 'mock_job_id'],

      'pending_units':[10, 10, 20],

      'active_units':[5,5,1],
      'project_id':['mock_project', 'mock_project', 'mock_project']})

    self.mock_timeline1 = mock_timeline1
    self.mock_timeline2 = mock_timeline2
    self.mock_timeline3 = mock_timeline3
    self.expected_df = expected_df.sort_index(axis=1)

  def test_get_time_lines_df(self):

    mock_job = MagicMock()
    mock_job.started = datetime.datetime(1970, 1, 1, 1, 1, 1, 12)
    mock_job.timeline = [self.mock_timeline1, self.mock_timeline2, self.mock_timeline3]
    mock_job.job_id = 'mock_job_id'

    mock_bq_helper = MagicMock()
    job_processor = slots_timeline.JobProcessor(mock_bq_helper)
    df = job_processor.get_time_lines_df('mock_project', mock_job)
    assert_frame_equal(df.sort_index(axis=1), self.expected_df)

  def test_get_time_lines_df_reverse(self):

    mock_job = MagicMock()
    mock_job.started = datetime.datetime(1970, 1, 1, 1, 1, 1, 12)
    mock_job.timeline = [self.mock_timeline2, self.mock_timeline1, self.mock_timeline3]
    mock_job.job_id = 'mock_job_id'

    mock_bq_helper = MagicMock()
    job_processor = slots_timeline.JobProcessor(mock_bq_helper)
    df = job_processor.get_time_lines_df('mock_project', mock_job)

    assert_frame_equal(df.sort_index(axis=1), self.expected_df)

  def test_get_time_lines_df_single(self):
    mock_timeline_end = MagicMock()
    mock_timeline_end.pending_units = 0
    mock_timeline_end.active_units = 0
    mock_timeline_end.slot_millis = 0
    mock_timeline_end.elapsed_ms = 500

    mock_job = MagicMock()
    mock_job.started = datetime.datetime(1970, 1, 1, 1, 1, 1, 12)
    mock_job.timeline = [self.mock_timeline1, mock_timeline_end]
    mock_job.job_id = 'mock_job_id'
    mock_bq_helper = MagicMock()
    job_processor = slots_timeline.JobProcessor(mock_bq_helper)



    expected_df = pd.DataFrame({
      'time_window':[datetime.datetime(1970, 1, 1, 1, 1, 1, 0)
                    ],
      'job_id':['mock_job_id'],

      'pending_units':[10],

      'active_units':[5],
      'project_id':['mock_project']})

    df = job_processor.get_time_lines_df('mock_project', mock_job)
    assert_frame_equal(df.sort_index(axis=1), expected_df)

if __name__ == '__main__':
  unittest.main()
