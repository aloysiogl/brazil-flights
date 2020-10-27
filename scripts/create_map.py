import pandas as pd
import plotly.graph_objects as go

# Function to extract airports data
def read_all_airports(flights_data, airports_data):
    orig = flights_data["ICAO Aerodromo Origem"]
    dest = flights_data["ICAO Aerodromo Destino"]
    airports_icaos = pd.concat([orig, dest], axis=0).drop_duplicates()
    # print(airports_icaos)
    df = pd.DataFrame([airports_icaos]).transpose()
    df.columns = ["ICAO Aerodromo Origem"]
    
    airports_info = df.merge(airports_data[["ICAO Aerodromo Origem", "latitude_deg" ,"longitude_deg"]])
    return airports_info

# Loading data
flights_data = pd.read_csv("../data/flights2020.csv")
airports_data = pd.read_csv("../data/br-airports.csv")

# Reading data about the airports (locations)
br_airports_df = read_all_airports(flights_data, airports_data)

# Creationg map
token = open(".mapbox_token").read()
fig = go.Figure(go.Scattermapbox())

fig.update_layout(
    mapbox = {
        'accesstoken': token,
        'style': "mapbox://styles/aloysiogl/ckgs2cbsz10dj19rtt5zgox47", 'zoom': 0.7},
    showlegend = False)

# Adding airports to the map
fig.add_trace(go.Scattermapbox(
    lon = br_airports_df['longitude_deg'],
    lat = br_airports_df['latitude_deg'],
    hoverinfo = 'text',
    # text = df_airports['airport'],

    mode = 'markers',
    marker = go.scattermapbox.Marker(
            size=3,
            color='yellow'
        )))

fig.show()