import numpy as np
import pandas as pd
import os


def read_preprocessed(year):
    path = os.path.dirname(os.path.abspath(
        __file__)) + '/../data/preprocessed/flights' + str(year) + '.csv'
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


def print_info(df):
    df.info(memory_usage='deep')
    year = df['scheduled_departure'].copy()
    year.loc[year.isna()] = df.loc[year.isna(), 'real_departure']
    year.loc[year.isna()] = df.loc[year.isna(), 'real_arrival']
    print('Year distribution:', dict(year.dt.year.value_counts(dropna=False)))
    print()

    # Check if the length of the icao codes are correct
    if (df['airline'].str.len() == 3).sum() != df.shape[0]:
        print('airline lengths frequency:', dict(
            df['airline'].str.len().value_counts(dropna=False)))
    if (df['origin_airport'].str.len() == 4).sum() != df.shape[0]:
        print('origin_airport lengths frequency: ', dict(
            df['origin_airport'].str.len().value_counts(dropna=False)))
    if (df['destination_airport'].str.len() == 4).sum() != df.shape[0]:
        print('destination_airport lengths frequency:', dict(
            df['destination_airport'].str.len().value_counts(dropna=False)))

    # Check if dates make sense
    x = (df['scheduled_departure'] > df['scheduled_arrival']).sum()
    if x > 0:
        print('scheduled_departure > scheduled_arrival:', x)
    x = (df['real_departure'] > df['real_arrival']).sum()
    if x > 0:
        print('real_departure > real_arrival:', x)

    # Check if any aiport wasn't in the catalog
    if df['origin_latitude'].isna().sum() > 0 or df['destination_latitude'].isna().sum() > 0:
        print('Airports not found:')
        print(df[df['origin_latitude'].isna()]
              ['origin_airport'].value_counts())
        print(df[df['destination_latitude'].isna()]
              ['destination_airport'].value_counts(), end='\n\n')

    # Check if states make sense
    states = [np.nan, 'RO', 'AC', 'AM', 'RR', 'PA', 'AP', 'TO', 'MA', 'PI', 'CE', 'RN', 'PB', 'PE',
              'AL', 'SE', 'BA', 'MG', 'ES', 'RJ', 'SP', 'PR', 'SC', 'RS', 'MS', 'MT', 'GO', 'DF']
    not_in = ~df['origin_state'].isin(states)
    if not_in.sum() > 0:
        print('Wrong origin_state frequency:',
              {k: v for k, v in dict(df.loc[not_in, 'origin_state'].value_counts()).items() if v > 0})
    not_in = ~df['destination_state'].isin(states)
    if not_in.sum() > 0:
        print('Wrong destination_state frequency:',
              {k: v for k, v in dict(df.loc[not_in, 'destination_state'].value_counts()).items() if v > 0})

    print()
    print('============================================')


if __name__ == '__main__':
    for y in range(2000, 2021):
        df = read_preprocessed(y)
        print_info(df)
