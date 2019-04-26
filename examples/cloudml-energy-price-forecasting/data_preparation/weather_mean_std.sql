/* These are used to normalize model inputs. */

SELECT
  array_concat_agg(ARRAY[temperature, wind_speed_100m, wind_direction_100m, air_density, precipitation,
    wind_gust, radiation, wind_speed, wind_direction, pressure]
    ORDER BY point) AS mean,
  array_concat_agg(ARRAY[temperature_s, wind_speed_100m_s, wind_direction_100m_s, air_density_s, precipitation_s,
    wind_gust_s, radiation_s, wind_speed_s, wind_direction_s, pressure_s]
    ORDER BY point) AS std
FROM
  (
    SELECT
      point,
      AVG(temperature) AS temperature,
      AVG(wind_speed_100m) AS wind_speed_100m,
      AVG(wind_direction_100m) AS wind_direction_100m,
      AVG(air_density) AS air_density,
      AVG(precipitation) AS precipitation,
      AVG(wind_gust) AS wind_gust,
      AVG(radiation) AS radiation,
      AVG(wind_speed) AS wind_speed,
      AVG(wind_direction) AS wind_direction,
      AVG(pressure) AS pressure,
      STDDEV_SAMP(temperature) AS temperature_s,
      STDDEV_SAMP(wind_speed_100m) AS wind_speed_100m_s,
      STDDEV_SAMP(wind_direction_100m) AS wind_direction_100m_s,
      STDDEV_SAMP(air_density) AS air_density_s,
      STDDEV_SAMP(precipitation) AS precipitation_s,
      STDDEV_SAMP(wind_gust) AS wind_gust_s,
      STDDEV_SAMP(radiation) AS radiation_s,
      STDDEV_SAMP(wind_speed) AS wind_speed_s,
      STDDEV_SAMP(wind_direction) AS wind_direction_s,
      STDDEV_SAMP(pressure) AS pressure_s
    FROM
      Energy.historical_weather
    WHERE
      PARSE_TIMESTAMP("%d/%m/%Y %H:%M", prediction_date) BETWEEN @train_from_date AND @train_to_date
    GROUP BY point
  ) AS av