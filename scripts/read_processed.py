import numpy as np
import pandas as pd
import os


year = 2020
path = os.path.dirname(os.path.abspath(
    __file__)) + '/../data/preprocessed/flights' + str(year) + '.csv'
df = pd.read_csv(path, dtype={'airline': str,
                              'di': 'Int8',
                              'type': 'Int8',
                              'origin_airport': str,
                              'destination_ariport': str,
                              'status': 'Int8',
                              'reason': 'Int8',
                              'origin_latitude': 'Float32',
                              'origin_longitude': 'Float32',
                              'destination_latitude': 'Float32',
                              'destination_longitude': 'Float32'},
                 parse_dates=['scheduled_departure', 'real_departure', 'scheduled_arrival', 'real_arrival'])
print(df.info())
print(df.memory_usage(deep=True) / 1024 ** 2)

print('\nairline lengths frequency')
print(dict(df['airline'].str.len().value_counts()))
print('\norigin_airport lengths frequency')
print(dict(df['origin_airport'].str.len().value_counts()))
print('\ndestination_airport lengths frequency')
print(dict(df['destination_airport'].str.len().value_counts()))
print()
print('scheduled_departure > scheduled_arrival:', np.count_nonzero(
    df['scheduled_departure'] > df['scheduled_arrival']))
print('real_departure > real_arrival:', np.count_nonzero(
    df['real_departure'] > df['real_arrival']))
print()
print('Year distribution:', dict(
    df['scheduled_departure'].dt.year.value_counts(dropna=False)))
