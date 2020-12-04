import numpy as np
import pandas as pd
import os


def read_preprocessed(data_path, year):
    path = data_path + 'preprocessed/flights' + str(year) + '.csv'
    df = pd.read_csv(path, dtype={'airline': 'category',
                                  'di': 'Int8',
                                  'type': 'Int8',
                                  'origin_airport': 'category',
                                  'destination_airport': 'category',
                                  'status': 'Int8',
                                  'reason': 'Int8',
                                  'origin_latitude': 'Float32',
                                  'origin_longitude': 'Float32',
                                  'destination_latitude': 'Float32',
                                  'destination_longitude': 'Float32',
                                  'origin_state': 'category',
                                  'destination_state': 'category',
                                  'domestic': bool},
                     parse_dates=['scheduled_departure', 'real_departure', 'scheduled_arrival', 'real_arrival'])
    return df


data_path = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
airlines_counts = []
for y in range(2000, 2021):
    df = read_preprocessed(data_path, y)
    airlines_counts.append(df['airline'].value_counts().rename('count'))
airlines_counts = pd.concat(airlines_counts, axis=1).sum(
    axis=1).rename('count').astype(int).sort_values(ascending=False)
airlines_counts = airlines_counts[airlines_counts > 1000]

airlines_counts.to_csv(data_path + 'filtered_airlines.csv')
