import numpy as np
import pandas as pd
import os

data_path = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
routes_counts = pd.read_csv(data_path + 'routes_counts.csv')
airports = pd.read_csv(data_path + 'filtered_airports.csv')

airports = airports.set_index('code')

# Add origin_state
routes_counts = routes_counts.set_index('origin_airport')
routes_counts = routes_counts.join(airports)
routes_counts = routes_counts.drop(columns=['latitude', 'longitude', 'brazilian'])
routes_counts = routes_counts.reset_index()
routes_counts = routes_counts.rename(columns={'state': 'origin_state', 'index': 'origin_airport'})

# Add destination_state
routes_counts = routes_counts.set_index('destination_airport')
routes_counts = routes_counts.join(airports)
routes_counts = routes_counts.drop(columns=['latitude', 'longitude', 'brazilian'])
routes_counts = routes_counts.reset_index()
routes_counts = routes_counts.rename(columns={'state': 'destination_state', 'index': 'destination_airport'})

routes_counts = routes_counts.sort_values('date')
routes_counts.to_csv(data_path + 'routes_counts.csv', index=False)