# Copyright 2019 Google LLC
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

with fixity_dates as (
select distinct bucket, bag, fixity_date
from `PROJECT_ID.fixity_data.records` 
order by bucket, bag, fixity_date asc
),
ranked_fixity_dates as (
select row_number() over (partition by bucket, bag order by fixity_date asc) as version, bucket, bag, fixity_date
from fixity_dates
),
fixity_files as (
select distinct bucket, bag, file_name
from `PROJECT_ID.fixity_data.records` 
),
ranked_fixity_files as (
select f.*, d.version
from `PROJECT_ID.fixity_data.records` f
join ranked_fixity_dates d on f.fixity_date = d.fixity_date and f.bag = d.bag and f.bucket = d.bucket
order by bucket, bag, file_name, version
),
running_manifest as (
select distinct d.version, f.bucket, f.bag, f.file_name, d.fixity_date, f2.file_md5sum as old_md5sum, f1.file_md5sum as new_md5sum, 
case
when (f2.file_md5sum = f1.file_md5sum) then ''
when (f2.file_md5sum is null and f1.file_md5sum is not null) then 'FILE_CREATED'
when (f2.file_md5sum is not null and f1.file_md5sum is null) then 'FILE_DELETED'
when (f1.file_md5sum is not null and f2.file_md5sum is not null and f1.file_md5sum != f2.file_md5sum) then 'NEW_VERSION_UPLOADED'
end as operation
from fixity_files f
join ranked_fixity_dates d on f.bag = d.bag and f.bucket = d.bucket
left join ranked_fixity_files f1 on f.file_name = f1.file_name and d.version = (f1.version)
left join ranked_fixity_files f2 on f.file_name = f2.file_name and d.version = (f2.version + 1)
order by file_name, version desc
)
select bucket, bag, file_name, fixity_date, old_md5sum, new_md5sum, operation from running_manifest where operation is not null;