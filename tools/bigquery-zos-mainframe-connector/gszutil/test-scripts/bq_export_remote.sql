/*
 * Copyright 2022 Google LLC All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
select distinct
    substring(address, 0, 25) as address,
    year,
    year as year_int,
    year as year_string,
    cast(timestamp as date) as timestamp,
    cast(latitude as numeric) as latitude,
    cast(longitude as numeric) as longitude
FROM
    `bigquery-public-data.austin_crime.crime`
where
    latitude is not null
LIMIT
    1000000;