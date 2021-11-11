# Copyright 2020 Google LLC
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

from dateutil import parser
from pytest import approx
import sys
sys.path.append('..')
from dependencies.commitment_intervals import compute_diff, ScheduleAndValue, CommitmentValue


def test_same_start_different_end():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-04-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-04-01',
        'amount': 200
    }, {
        'start': '2010-04-02',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_same_start_same_end():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{'start': '2010-03-05', 'end': '2010-12-01', 'amount': 200}]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_multiple_different_overlaping():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-01'), parser.parse('2010-09-15'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-09-01'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-04-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-01',
        'end': '2010-03-04',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-04-01',
        'amount': 200
    }, {
        'start': '2010-04-02',
        'end': '2010-08-31',
        'amount': 100
    }, {
        'start': '2010-09-01',
        'end': '2010-09-15',
        'amount': 200
    }, {
        'start': '2010-09-16',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_no_overlap():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-12-02'), parser.parse('2010-12-09'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-12-02',
        'end': '2010-12-09',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_only_one_day_starting_date_overlaps():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-03-05'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-09'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-03-05',
        'amount': 200
    }, {
        'start': '2010-03-06',
        'end': '2010-12-09',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_end_overlaps_with_start_and_end_date():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-03-05'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-09'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-12-09'), parser.parse('2010-12-11'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'commitments_region')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-03-05',
        'amount': 200
    }, {
        'start': '2010-03-06',
        'end': '2010-12-08',
        'amount': 100
    }, {
        'start': '2010-12-09',
        'end': '2010-12-09',
        'amount': 200
    }, {
        'start': '2010-12-10',
        'end': '2010-12-11',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_but_in_different_regions_so_not_combining_dates():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'us-central-1')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_ids', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'asia-east1')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_but_in_different_folder_id_so_not_combining_dates():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_1', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'us-central-1')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder_2', 'project_ids',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'us-central-1')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_but_in_different_folder_id_so_not_combining_dates():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_1',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'us-central-1')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_2',
                            'commitments_unit_type', 'commitments_cud_type',
                            100, 'us-central-1')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_but_in_different_commitments_cud_unit_id_so_not_combining_dates(
):
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_1', 'CPU',
                            'commitments_cud_type', 100, 'us-central-1')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_1', 'RAM',
                            'commitments_cud_type', 100, 'us-central-1')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1


def test_overlap_but_in_different_commitments_cud_type_so_not_combining_dates():
    data = {}
    data['x'] = []
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_1', 'CPU', 'Regular Usage',
                            100, 'us-central-1')))
    data['x'].append(
        ScheduleAndValue(
            parser.parse('2010-03-05'), parser.parse('2010-12-01'),
            CommitmentValue('id', 'folder', 'project_1', 'CPU',
                            'Not Regular Usage', 100, 'us-central-1')))
    retVal = compute_diff(data['x'])
    expected = [{
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }, {
        'start': '2010-03-05',
        'end': '2010-12-01',
        'amount': 100
    }]
    i = 0
    for res in expected:
        assert retVal[i].start == parser.parse(res['start'])
        assert retVal[i].end == parser.parse(res['end'])
        assert retVal[i].value.commitments_amount == approx(float(
            res['amount']))
        i = i + 1
