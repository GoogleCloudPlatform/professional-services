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