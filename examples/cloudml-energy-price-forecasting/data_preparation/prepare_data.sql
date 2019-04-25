/* Prepare data for ML Engine consumption. */

WITH
  EnergyPrice_Temp AS (
    SELECT
      PARSE_TIMESTAMP("%d/%m/%Y %H:%M", date_utc) AS date_utc,
      price
    FROM
      Energy.MarketPricePT
  ),
  Distribution_Temp AS (
    SELECT
      APPROX_QUANTILES(price * @price_scaling, 4) AS distribution,
      EXTRACT(ISOWEEK FROM date_utc) AS week
    FROM
      EnergyPrice_Temp
    GROUP BY EXTRACT(ISOWEEK FROM date_utc)
  ),
  Weather_Temp AS (
    SELECT
      PARSE_TIMESTAMP("%d/%m/%Y %H:%M", prediction_date) AS prediction_date,
      array_concat_agg(ARRAY[temperature, wind_speed_100m, wind_direction_100m, air_density, precipitation,
        wind_gust, radiation, wind_speed, wind_direction, pressure]
        ORDER BY point) AS weather
    FROM
      Energy.historical_weather
    GROUP BY prediction_date
  )
SELECT
  date_utc,
  EXTRACT(ISOWEEK FROM date_utc) - 1 AS week,
  EXTRACT(DAYOFWEEK FROM date_utc) - 1 AS day,
  EXTRACT(HOUR FROM date_utc) AS hour,
  distribution,
  weather,
  price * @price_scaling AS price
FROM
  EnergyPrice_Temp AS p
  LEFT JOIN
  Distribution_Temp AS d
  ON EXTRACT(ISOWEEK FROM p.date_utc) - 1 = d.week
  JOIN
  Weather_Temp AS w
  ON p.date_utc = w.prediction_date
WHERE
  date_utc BETWEEN @from_date AND @to_date
ORDER BY date_utc