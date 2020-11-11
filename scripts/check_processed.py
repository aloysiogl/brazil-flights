import pandas as pd
import os


def read_preprocessed(year):
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
    return df


def print_info(df):
    df.info(memory_usage='deep')
    print('Year distribution:', dict(
        df['scheduled_departure'].dt.year.value_counts(dropna=False)))
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

    print()
    print('============================================')


if __name__ == '__main__':
    # for y in range(2000, 2021):
    df = read_preprocessed(2004)
    print_info(df)
