# Disclaimer

The data used to train this solution has been downloaded from http://complatt.smartwatt.net/
This website hosts this data for a closed competition meant to solve the energegy price forecasting problem.
The data was not collected or vetted by Google LLC and hence, we can't guarantee the veracity or qualitty of it. 

# Explanation of variables included in the files:

- File MarketPricePT.csv:

	date_utc - Date and hour that corresponds to the energy price, in UTC.
	price - Energy price at given hour.	

- File historical_weather.csv:

	point - Specific id of each weather point location (18 points in the country).
	prediction_date	- Date and hour that corresponds to the forecast, in UTC.
	wind_speed_100m - Wind speed estimated at 100 meters, in m/s.
	wind_direction_100m - Wind direction estimated at 100 meters, in degrees [0-360].	
	temperature - Ambient temperature estimated at groud level, in degrees C.	
	air_density - Air density estimated at ground level, in kg/m3.	
	pressure - Air pressure estimated at ground level, in hPa.	
	precipitation - Rainfall intensity, in mm/m2.
	wind_gust  - Wind gust speed estimated at 10 meters, in m/s.
	radiation - Solar radiation estimated at ground level, in W/m2.	
	wind_speed - Wind speed estimated at 10 meters, in m/s.	
	wind_direction - Wind direction estimated at 10 meters, in degrees [0-360].

