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
for y in range(2000, 2022):
    print(y)

    df = read_preprocessed(data_path, y)

    # Filter cancelled flights
    df = df[df['status'] == 1]

    # Filter airports
    df = df[(df['origin_airport'].isin(airports['code'])) & (
        df['destination_airport'].isin(airports['code']))]

    # Filter ailines
    df = df[df['airline'].isin(airlines['code'])]

    # Fix types
    df.loc[df['origin_state'].isna() | df['destination_state'].isna(),
           'domestic'] = False
    df.loc[~df['origin_state'].isna() & ~df['destination_state'].isna(),
           'domestic'] = True
    df['type'] = df['type'].fillna(5)
    df.loc[df['domestic'] & (df['type'] == 3), 'type'] = 1
    df.loc[df['domestic'] & (df['type'] == 4), 'type'] = 2
    df.loc[~df['domestic'] & (df['type'] == 1), 'type'] = 3
    df.loc[~df['domestic'] & (df['type'] == 2), 'type'] = 4
    df.loc[~df['domestic'] & (df['type'] == 6), 'type'] = 3
    df.loc[~df['domestic'] & (df['type'] == 7), 'type'] = 4
    df.loc[~df['domestic'] & (df['type'] == 8), 'type'] = 3

    # Create week date
    date = df['scheduled_departure'].copy()
    date.loc[date.isna()] = df.loc[date.isna(), 'real_departure']
    date.loc[date.isna()] = df.loc[date.isna(), 'real_arrival']
    date = date.dt.date - date.dt.weekday * np.timedelta64(1, 'D')

    # Time variables
    df['duration'] = np.nan
    mask = ~df['real_arrival'].isna() & ~df['real_departure'].isna()
    df.loc[mask, 'duration'] = df['real_arrival'] - df['real_departure']
    mask = df['duration'].isna() & ~df['scheduled_arrival'].isna(
    ) & ~df['scheduled_departure'].isna()
    df.loc[mask, 'duration'] = df['scheduled_arrival'] - \
        df['scheduled_departure']
    mask = ~df['duration'].isna()
    df.loc[mask, 'duration'] = (
        df.loc[mask, 'duration'] / pd.Timedelta('1 min')).astype(int)

    df['delay'] = np.nan
    mask = ~df['real_arrival'].isna() & ~df['scheduled_arrival'].isna()
    df.loc[mask, 'delay'] = df['real_arrival'] - df['scheduled_arrival']
    mask = ~df['delay'].isna() & ~df['real_departure'].isna(
    ) & ~df['scheduled_departure'].isna()
    df.loc[mask, 'delay'] += df['real_departure'] - df['scheduled_departure']
    df.loc[mask, 'delay'] *= 0.5
    mask = df['delay'].isna() & ~df['real_departure'].isna(
    ) & ~df['scheduled_departure'].isna()
    df.loc[mask, 'delay'] = df['real_departure'] - df['scheduled_departure']
    mask = ~df['delay'].isna()
    df.loc[mask, 'delay'] = (df.loc[mask, 'delay'] /
                             pd.Timedelta('1 min')).astype(int)

    # Count routes
    df['key'] = df['origin_airport'].astype('str') + ' ' + df['destination_airport'].astype(
        'str') + ' ' + date.astype('str') + ' ' + df['type'].astype('str') + ' ' + df['airline'].astype('str')
    df = df[['key', 'duration', 'delay']]
    df = df.astype({ 'key': str, 'duration': 'Int64', 'delay': 'Int64' })
    durations = df.groupby('key').duration.agg(['count', 'sum'])
    durations.columns = ['count', 'duration']
    delays = df.groupby('key').delay.sum()
    delays.columns = ['delay']
    durations['delay'] = delays
    df = durations.reset_index()

    routes.append(df)

routes = pd.concat(routes, axis=0)
routes = routes.groupby('key').sum()
routes = routes.reset_index()

routes[['origin_airport', 'destination_airport', 'date',
        'type', 'airline']] = routes['key'].str.split(expand=True)
routes = routes[['origin_airport', 'destination_airport',
                 'date', 'type', 'airline', 'count', 'duration', 'delay']]
routes = routes.sort_values('date')
routes['duration'] = routes['duration'].replace(0, np.nan)
routes['delay'] = routes['delay'].replace(0, np.nan)

routes.to_csv(data_path + 'routes_counts.csv', index=False)
