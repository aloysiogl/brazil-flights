import pandas as pd

airports_data = pd.read_csv("../data/br-airports.csv")

considered_airports_data = airports_data[["ICAO Aerodromo Origem", "latitude_deg" ,"longitude_deg"]] 

flights_data = pd.read_csv("../data/flights2020.csv")

result = flights_data.merge(considered_airports_data)

result.to_csv("out.csv")