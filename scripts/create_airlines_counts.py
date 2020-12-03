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
airlines = pd.read_csv(data_path + 'filtered_airlines.csv')
airports = pd.read_csv(data_path + 'filtered_airports.csv')

routes = []
for y in range(2000, 2021):
    print(y)

    df = read_preprocessed(data_path, y)

    # Filter cancelled flights
    df = df[df['status'] == 1]

    # Filter airports
    df = df[(df['origin_airport'].isin(airports['code'])) & (
        df['destination_airport'].isin(airports['code']))]

    # Filter ailines
    df = df[df['airline'].isin(airlines['code'])]

    # Create week date
    date = df['scheduled_departure'].copy()
    date.loc[date.isna()] = df.loc[date.isna(), 'real_departure']
    date.loc[date.isna()] = df.loc[date.isna(), 'real_arrival']
    date = date.dt.date - date.dt.weekday * np.timedelta64(1, 'D')

    # Count routes
    df = (df['origin_airport'].astype('str') + ' ' + df['destination_airport'].astype('str') +
          ' ' + date.astype('str') + ' ' + df['type'].astype('str') + ' ' + df['airline'].astype('str')).value_counts()

    routes.append(df)

routes = pd.concat(routes, axis=1).sum(axis=1).rename('count').astype(int)

# Split columns
routes = routes.reset_index()
routes[['origin_airport', 'destination_airport', 'date',
        'type', 'airline']] = routes['index'].str.split(expand=True)
routes = routes[['origin_airport', 'destination_airport',
                 'date', 'type', 'airline', 'count']]
routes = routes.sort_values('date')

routes.to_csv(data_path + 'airlines_counts.csv', index=False)
