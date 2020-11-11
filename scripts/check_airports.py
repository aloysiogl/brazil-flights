import pandas as pd

airports_data = pd.read_csv("../data/br-airports.csv")

considered_airports_data = airports_data[["icao", "latitude_deg" ,"longitude_deg"]] 
considered_airports_data = considered_airports_data.set_index('icao')

flights_data = pd.read_csv("../data/raw/divided/flights2020.csv")

result = flights_data.join(considered_airports_data, on='ICAO Aerodromo Origem')

result.to_csv("out.csv")