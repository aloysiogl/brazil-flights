import numpy as np
import pandas as pd
import os
import sys


def rename_columns(df):
    df.rename(columns={'ICAO Empresa Aerea': 'airline',
                       'Codigo DI': 'di',
                       'Codigo Tipo Linha': 'type',
                       'ICAO Aerodromo Origem': 'origin_airport',
                       'ICAO Aerodromo Destino': 'destination_airport',
                       'Partida Prevista': 'scheduled_departure', 'Partida Real': 'real_departure',
                       'Chegada Prevista': 'scheduled_arrival',
                       'Chegada Real': 'real_arrival',
                       'Situacao Voo': 'status',
                       'Codigo Justificativa': 'reason'}, inplace=True)


def fix_column_orders(df):
    # Fix column orders in two different cases
    locs = df['real_departure'].str.len() == 4
    temp = df.loc[locs, 'destination_airport']
    df.loc[locs, 'destination_airport'] = df.loc[locs, 'real_departure']
    df.loc[locs, 'real_departure'] = df.loc[locs, 'scheduled_departure']
    df.loc[locs, 'scheduled_departure'] = temp

    locs = df['scheduled_departure'].str.len() == 4
    temp = df.loc[locs, 'destination_airport']
    df.loc[locs, 'destination_airport'] = df.loc[locs, 'scheduled_departure']
    df.loc[locs, 'scheduled_departure'] = df.loc[locs, 'real_departure']
    df.loc[locs, 'real_departure'] = temp
    return df


def encode_values(df):
    # Encode values to int
    complete = ['REALIZADO', 'Realizado']
    not_complete = ['NAO REALIZADO', 'NÃO REALIZADO', 'Nao Realizado']
    canceled = ['CANCELADO', 'Cancelado']
    not_informed = ['NAO INFORMADO', 'NíO INFORMADO', 'NÕO INFORMADO', 'NaN']
    df['status'].replace(complete, 1, inplace=True)
    df['status'].replace(not_complete, 2, inplace=True)
    df['status'].replace(canceled, 3, inplace=True)
    df['status'].replace(not_informed, np.nan, inplace=True)
    df['status'] = pd.Series(df['status'], dtype='Int8')

    df['di'].replace({'D': 10, 'E': 11, 'A': 12, 'B': 13,
                      'C': 14, 'F': 15}, inplace=True)
    df['di'] = pd.Series(df['di'], dtype='Int8')

    df['type'].replace({'N': 1, 'C': 2, 'I': 3, 'G': 4, 'X': 5,
                        'H': 6, 'L': 7, 'R': 8, 'E': 9, 'N/I': np.nan}, inplace=True)
    df['type'] = pd.Series(df['type'], dtype='Int8')

    df['reason'].replace({'AA': 0, 'AF': 1, 'AG': 2, 'AI': 3, 'AJ': 4, 'AM': 5, 'AR': 6, 'AS': 7, 'AT': 8, 'DF': 9,
                          'DG': 10, 'FP': 11, 'GF': 12, 'HA': 13, 'HB': 14, 'HD': 15, 'HI': 16, 'IR': 17, 'MA': 18, 'MX': 19,
                          'OA': 20, 'RA': 21, 'RI': 22, 'RM': 23, 'ST': 24, 'TC': 25, 'TD': 26, 'VE': 27, 'VI': 28, 'VR': 29,
                          'WA': 30, 'WI': 31, 'WO': 32, 'WR': 33, 'WS': 34, 'WT': 35, 'XA': 36, 'XB': 37, 'XI': 38, 'XJ': 39,
                          'XL': 40, 'XM': 41, 'XN': 42, 'XO': 43, 'XS': 44, 'XT': 45, 'cc': 46, 'WP': 47, 'XR': 48, 'HC': 49,
                          'M': 50}, inplace=True)
    df['reason'].replace('<!--', np.nan, inplace=True)
    df['reason'] = pd.Series(df['reason'], dtype='Int8')
    return df


def parse_dates(df):
    not_informed = ['NAO INFORMADO', 'NíO INFORMADO', 'NÕO INFORMADO', 'NaN']
    date_columns = ['scheduled_arrival', 'real_arrival',
                    'scheduled_departure', 'real_departure']
    formats = ['%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M:%S']
    for column in date_columns:
        df[column].fillna('NaN', inplace=True)
        for f in formats:
            locs = df[column].astype(str).str.len() == len(f) + 2
            df.loc[locs, column] = pd.to_datetime(
                df.loc[locs, column], format=f)
        df[column].replace(not_informed, np.nan, inplace=True)
    return df


def add_coordinates(df, airports_data_path):
    airports_df = pd.read_csv(airports_data_path)
    airports_df.set_index('code', inplace=True)
    columns = list(df.columns) + ['origin_latitude', 'origin_longitude',
                                  'destination_latitude', 'destination_longitude', 'domestic']

    df = df.join(airports_df, on='origin_airport', rsuffix='_origin')
    df = df.join(airports_df, on='destination_airport', rsuffix='_destination')
    df['brazilian'] = df['brazilian'].astype(
        bool) | df['brazilian_destination'].astype(bool)
    df.rename(columns={'latitude': 'origin_latitude',
                       'longitude': 'origin_longitude',
                       'latitude_destination': 'destination_latitude',
                       'longitude_destination': 'destination_longitude',
                       'brazilian': 'domestic'}, inplace=True)
    return df[columns]


def filter_bad_data(df):
    # Remove airports that don't exist
    not_found = {0, '0', 'X', 'MUMC', '0GMM', 'XBGR', 'KMIS', 'SBXX', 'SBGE', 'SBSU',
                 'ABEG', 'SBEB', 'SBJK', 'SMPJ', 'SBGF', 'KJSU', 'SBGY', 'SARZ', 'ABKP', 'SBVA'}
    mask = df['origin_airport'].isin(
        not_found) | df['destination_airport'].isin(not_found)

    # Remove flights without dates
    mask |= df['scheduled_departure'].isna() & df['real_departure'].isna(
    ) & df['scheduled_arrival'].isna() & df['real_arrival'].isna()

    # Remove dates that don't make sense
    mask |= df['scheduled_departure'] > df['scheduled_arrival']
    mask |= df['real_departure'] > df['real_arrival']

    print('Filtered', mask.sum(), 'values')

    return df[~mask]


def preprocess(year):
    data_path = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
    airports_data_path = data_path + 'airports.csv'
    raw_path = data_path + 'raw/divided/flights' + str(year) + '.csv'
    save_path = data_path + 'preprocessed/'

    if not os.path.isdir(save_path):
        os.makedirs(save_path)

    df = pd.read_csv(raw_path, low_memory=False)

    # Remove flight number column
    df.drop('Numero Voo', axis=1, inplace=True)

    # Remove leading or trailing quotes and spaces
    for col in df.columns:
        if df.dtypes[col] == 'object':
            df[col] = df[col].str.strip('" ')
    df.replace('', np.nan, inplace=True)

    rename_columns(df)
    df = fix_column_orders(df)
    df = encode_values(df)
    df = parse_dates(df)
    df = add_coordinates(df, airports_data_path)
    df = filter_bad_data(df)

    df.sort_values(by=['scheduled_departure', 'scheduled_arrival',
                       'real_departure', 'real_arrival'], inplace=True)
    df.to_csv(save_path + 'flights' + str(year) + '.csv', index=False)


if __name__ == '__main__':
    for y in range(2000, 2021):
        print(y, ':', end=' ')
        preprocess(y)
