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
import uuid
from dependencies.helper_function import file_to_string, table_to_csv_in_gcs, csv_in_gcs_to_table, gcs_to_local, local_to_gcs, convert_to_schema


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
        return other.folder_ids == self.folder_ids and self.project_ids == other.project_ids and other.commitments_unit_type == self.commitments_unit_type \
               and self.commitments_cud_type == other.commitments_cud_type and self.commitments_region == other.commitments_region

    def __add__(self, other):
        if type(other) is not CommitmentValue:
            raise TypeError('unsupported operand type(s) for +'+
                        ': \''+type(self).__name__+'\' and \''+type(other).__name__+'\'')

        new_amount = float(self.commitments_amount) + float(other.commitments_amount)
        return CommitmentValue(self.id + other.id, self.folder_ids,
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

    def __lt__(self, other):
        return self.start < other.start


def combineSchedule(scheduleA, scheduleB):
    """Find the overlap between two schedules and break the overlap and provides
        non overlaping schedules keeping the overall values the same

    Args:
        scheduleA: Schedule to compare for overlap (start time is less or equal to schedule B)
        scheduleB: Schedule to compare or overlap
    Returns:
        List of non-overlapping schedule
    """
    retVal = []
    intersects = scheduleA.start <= scheduleB.end and scheduleB.start <= scheduleA.end
    if scheduleA.value != scheduleB.value or not intersects :
        return None
    if scheduleA == scheduleB:
        retVal.append(ScheduleAndValue(scheduleA.start, scheduleA.end,
                                       scheduleA.value + scheduleB.value))
    elif scheduleA.start == scheduleB.start:
        if scheduleA.end < scheduleB.end:
            retVal.append(ScheduleAndValue(scheduleA.start, scheduleA.end,
                                           scheduleA.value + scheduleB.value))
            retVal.append(ScheduleAndValue(scheduleA.end + timedelta(days=1),
                                           scheduleB.end, scheduleB.value))
        else:
            retVal.append(ScheduleAndValue(scheduleA.start, scheduleB.end,
                                           scheduleA.value + scheduleB.value))
            retVal.append(ScheduleAndValue(scheduleB.end + timedelta(days=1),
                                           scheduleA.end, scheduleA.value))
    else:
        if scheduleA.end == scheduleB.end:
            retVal.append(ScheduleAndValue(scheduleA.start,
                                           scheduleB.start - timedelta(days=1),
                                           scheduleA.value))
            retVal.append(ScheduleAndValue(scheduleB.start, scheduleB.end,
                                           scheduleA.value + scheduleB.value))

        elif scheduleA.end < scheduleB.end:
            retVal.append(ScheduleAndValue(scheduleA.start,
                                           scheduleB.start - timedelta(days=1),
                                           scheduleA.value))
            retVal.append(ScheduleAndValue(scheduleB.start, scheduleA.end,
                                           scheduleA.value + scheduleB.value))
            retVal.append(ScheduleAndValue(scheduleA.end + timedelta(days=1),
                                           scheduleB.end, scheduleB.value))
        else:
            retVal.append(ScheduleAndValue(scheduleA.start,
                                           scheduleB.start - timedelta(days=1),
                                           scheduleA.value))
            retVal.append(ScheduleAndValue(scheduleB.start,
                                           scheduleB.end,
                                           scheduleA.value + scheduleB.value))
            retVal.append(ScheduleAndValue(scheduleB.end + timedelta(days=1),
                                           scheduleA.end, scheduleA.value))
    return retVal


def computeDiff(commitmentObj):
    """Redistribute the overlapping schdules from all the commitments

    Args:
        commitmentObj: List of commitments
    Returns:
        List of non-overlapping commitments
    """
    commitmentObj.sort()
    iteration = 0
    flag = True
    while iteration <= len(commitmentObj)-1:
        comparionsfirst = commitmentObj[iteration]
        flag = False
        i = iteration + 1
        while i <= len(commitmentObj)-1 :
            flag = False
            comparionsSecond = commitmentObj[i]
            if (comparionsfirst.value == comparionsSecond.value):
                newRecords = combineSchedule(comparionsfirst, comparionsSecond)
                if (newRecords is not None):
                    commitmentObj.remove(comparionsfirst)
                    commitmentObj.remove(comparionsSecond)
                    commitmentObj.extend(newRecords)
                    commitmentObj.sort()
                    comparionsfirst = commitmentObj[iteration]
                    flag = True
            if flag:
                i = iteration + 1
            else:
                i = i + 1
        iteration = iteration + 1
    return commitmentObj

def main(commitment_table, modified_commitment_dataset,
         modified_commitment_table, gcs_bucket, commitment_schema):
    """Breaks out the commitment table rows to remove overlapping commitments.

    Args:
        commitment_dataset: Dataset id of the commitment table
        commitment_table: Name of the commitment table
        modified_commitment_table: Name for the redistributed commitment table
        gcs_bucket: Bucket name for transferring data between BQ
        commitment_schema: Schema for the commitment table

    Returns:
        None; Creates a new table in BigQuery
    """
    header="id,folder_ids,project_ids,commitments_unit_type,commitments_cud_type,commitments_amount,commitments_region,commit_start_date,commit_end_date"
    data = {}
    source_filename = 'original_commitments'
    table_to_csv_in_gcs(gcs_bucket, source_filename,
                        commitment_table)
    gcs_to_local(gcs_bucket, source_filename, "/tmp/" + source_filename)
    with open("/tmp/" + source_filename, 'r') as csvfile:
        datareader = csv.reader(csvfile, delimiter=',')
        for row in datareader:
            if ",".join(row) != header:
                folder_ids=row [1].strip().split(",")
                folder_ids.sort()
                project_ids=row [2].strip().split(",")
                project_ids.sort()
                key = ",".join(folder_ids) + "#" + ",".join(project_ids)
                if (key not in data):
                    data[key] = []
                data[key].append(ScheduleAndValue(parser.parse(row[7]),
                                                  parser.parse(row[8]),
                                                  CommitmentValue(row[0].strip(),
                                                                  row[1].strip(),
                                                                  row[2].strip(),
                                                                  row[3].strip(),
                                                                  row[4].strip(),
                                                                  float(row[5].strip()),
                                                                  row[6].strip())))
    for key in data:
        retVal = computeDiff(data[key])
        data[key] = retVal
    destination_file_name = 'corrected_commitments'
    with open("/tmp/" + destination_file_name, 'w+') as newfile:
        i = 1
        for key in data:
            for r in data[key]:
                newline = "{0},{1},{2},{3},{4},{5},{6},{7},{8}\n"
                newline = newline.format(i, r.value.folder_ids,
                                         r.value.project_ids,
                                         r.value.commitments_unit_type,
                                         r.value.commitments_cud_type,
                                         r.value.commitments_amount,
                                         r.value.commitments_region,
                                         r.start.strftime("%Y-%m-%d"),
                                         r.end.strftime("%Y-%m-%d"))
                newfile.write(newline)
                i=i+1
    local_to_gcs(gcs_bucket, destination_file_name,
                 "/tmp/" + destination_file_name)
    csv_in_gcs_to_table(gcs_bucket, destination_file_name,
                        modified_commitment_dataset,
                        modified_commitment_table,
                        convert_to_schema(commitment_schema))