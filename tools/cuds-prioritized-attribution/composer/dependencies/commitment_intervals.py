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
from datetime import timedelta
import csv
import os
import tempfile
import uuid
from composer.dependencies.helper_function import (table_to_csv_in_gcs,
                                                   csv_in_gcs_to_table,
                                                   gcs_to_local,
                                                   local_to_gcs,
                                                   convert_to_schema)


class CommitmentValue:

    def __init__(self, id, folder_ids, project_ids, commitments_unit_type,
                 commitments_cud_type, commitments_amount, commitments_region):
        self.id = id
        self.folder_ids = folder_ids
        self.project_ids = project_ids
        self.commitments_unit_type = commitments_unit_type
        self.commitments_cud_type = commitments_cud_type
        self.commitments_amount = commitments_amount
        self.commitments_region = commitments_region

    def __eq__(self, other):
        return other.folder_ids == self.folder_ids and self.project_ids == other.project_ids \
               and other.commitments_unit_type == self.commitments_unit_type \
               and self.commitments_cud_type == other.commitments_cud_type \
               and self.commitments_region == other.commitments_region

    def __ne__(self, other):
        return not self.__eq__(other)

    def __add__(self, other):
        if type(other) is not CommitmentValue:
            raise TypeError('unsupported operand type(s) for +' + ': \'' +
                            type(self).__name__ + '\' and \'' +
                            type(other).__name__ + '\'')

        new_amount = float(self.commitments_amount) + float(
                           other.commitments_amount)
        return CommitmentValue(str(uuid.uuid1()), self.folder_ids,
                               self.project_ids, self.commitments_unit_type,
                               self.commitments_cud_type, new_amount,
                               self.commitments_region)


class ScheduleAndValue:

    def __init__(self, start, end, value):
        self.start = start
        self.end = end
        self.value = value

    def __eq__(self, other):
        return other.start == self.start and self.end == other.end and self.value == other.value

    def __ne__(self, other):
        return not self.__eq__(other)

    def __lt__(self, other):
        return self.start < other.start


def is_schedule_combineable(schedule_a, schedule_b):
    """Checks to if two schedule overlaps and are of the same group.

    Args:
        schedule_a: Schedule to compare for overlap (start time is less or equal to schedule B)
        schedule_b: Schedule to compare or overlap
    Returns:
        True if combineable, False otherwise
    """
    intersects = schedule_a.start <= schedule_b.end and schedule_b.start <= schedule_a.end
    return schedule_a.value == schedule_b.value and intersects


def combine_schedule(schedule_a, schedule_b):
    """Find the overlap between two schedules and break the overlap and provides
        non overlaping schedules keeping the overall values the same

    Args:
        schedule_a: Schedule to compare for overlap (start time is less or equal to schedule B)
        schedule_b: Schedule to compare or overlap
    Returns:
        List of non-overlapping schedule
    """
    ret_val = []
    intersects = schedule_a.start <= schedule_b.end and schedule_b.start <= schedule_a.end
    if schedule_a.value != schedule_b.value or not intersects:
        return None
    if schedule_a == schedule_b:
        ret_val.append(
            ScheduleAndValue(schedule_a.start, schedule_a.end,
                             schedule_a.value + schedule_b.value))
    elif schedule_a.start == schedule_b.start:
        if schedule_a.end < schedule_b.end:
            ret_val.append(
                ScheduleAndValue(schedule_a.start, schedule_a.end,
                                 schedule_a.value + schedule_b.value))
            ret_val.append(
                ScheduleAndValue(schedule_a.end + timedelta(days=1),
                                 schedule_b.end, schedule_b.value))
        else:
            ret_val.append(
                ScheduleAndValue(schedule_a.start, schedule_b.end,
                                 schedule_a.value + schedule_b.value))
            ret_val.append(
                ScheduleAndValue(schedule_b.end + timedelta(days=1),
                                 schedule_a.end, schedule_a.value))
    else:
        if schedule_a.end == schedule_b.end:
            ret_val.append(
                ScheduleAndValue(schedule_a.start,
                                 schedule_b.start - timedelta(days=1),
                                 schedule_a.value))
            ret_val.append(
                ScheduleAndValue(schedule_b.start, schedule_b.end,
                                 schedule_a.value + schedule_b.value))

        elif schedule_a.end < schedule_b.end:
            ret_val.append(
                ScheduleAndValue(schedule_a.start,
                                 schedule_b.start - timedelta(days=1),
                                 schedule_a.value))
            ret_val.append(
                ScheduleAndValue(schedule_b.start, schedule_a.end,
                                 schedule_a.value + schedule_b.value))
            ret_val.append(
                ScheduleAndValue(schedule_a.end + timedelta(days=1),
                                 schedule_b.end, schedule_b.value))
        else:
            ret_val.append(
                ScheduleAndValue(schedule_a.start,
                                 schedule_b.start - timedelta(days=1),
                                 schedule_a.value))
            ret_val.append(
                ScheduleAndValue(schedule_b.start, schedule_b.end,
                                 schedule_a.value + schedule_b.value))
            ret_val.append(
                ScheduleAndValue(schedule_b.end + timedelta(days=1),
                                 schedule_a.end, schedule_a.value))
    return ret_val


def compute_diff(commitment_obj):
    """Redistribute the overlapping schedules from all the commitments

    Args:
        commitment_obj: List of commitments

    Returns:
        List of non-overlapping commitments
    """
    commitment_obj.sort()
    iteration = 0
    while iteration < len(commitment_obj):
        comparison_first = commitment_obj[iteration]
        for comparison_second in commitment_obj[iteration+1:]:
            if is_schedule_combineable(comparison_first, comparison_second):
               new_records = combine_schedule(comparison_first, comparison_second)
               commitment_obj.remove(comparison_first)
               commitment_obj.remove(comparison_second)
               commitment_obj.extend(new_records)
               commitment_obj.sort()
               iteration = iteration - 1
               break
        iteration = iteration + 1
    return commitment_obj


def main(commitment_table, modified_commitment_dataset,
         modified_commitment_table, gcs_bucket, commitment_schema):
    """Breaks out the commitment table rows to remove overlapping commitments.

    Args:
        commitment_table: Name of the commitment table
        modified_commitment_table: Name for the redistributed commitment table
        gcs_bucket: Bucket name for transferring data between BQ
        commitment_schema: Schema for the commitment table

    Returns:
        None; Creates a new table in BigQuery
    """
    data = {}
    source_filename = 'original_commitments'
    table_to_csv_in_gcs(gcs_bucket, source_filename, commitment_table)
    source_file_path = os.path.join('/tmp', source_filename)
    gcs_to_local(gcs_bucket, source_filename, source_file_path)
    with open(source_file_path, 'r') as csvfile:
        datareader = csv.reader(csvfile, delimiter=',')
        next(datareader)
        for row in datareader:
            folder_ids = sorted(row[1].strip().split(","))
            project_ids = sorted(row[2].strip().split(","))
            key = ",".join(folder_ids) + "#" + ",".join(project_ids)
            if (key not in data):
                data[key] = []
            data[key].append(
                ScheduleAndValue(
                    parser.parse(row[7]), parser.parse(row[8]),
                    CommitmentValue(row[0].strip(), row[1].strip(),
                                    row[2].strip(),
                                    row[3].strip(), row[4].strip(),
                                    float(row[5].strip()), row[6].strip())))
    for key in data:
        ret_val = compute_diff(data[key])
        data[key] = ret_val
    with tempfile.NamedTemporaryFile(mode='w+', delete=False) as corrected_commitments:
        writer = csv.writer(corrected_commitments)
        for i, commitment_val in enumerate(sum(data.values(),[])):
            writer.writerow([
                i+1,
                commitment_val.value.folder_ids,
                commitment_val.value.project_ids,
                commitment_val.value.commitments_unit_type,
                commitment_val.value.commitments_cud_type,
                commitment_val.value.commitments_amount,
                commitment_val.value.commitments_region,
                commitment_val.start.strftime("%Y-%m-%d"),
                commitment_val.end.strftime("%Y-%m-%d")
            ])
    local_to_gcs(gcs_bucket, os.path.basename(corrected_commitments.name),
                 corrected_commitments.name)
    csv_in_gcs_to_table(gcs_bucket, os.path.basename(corrected_commitments.name),
                        modified_commitment_dataset,
                        modified_commitment_table,
                        convert_to_schema(commitment_schema))
