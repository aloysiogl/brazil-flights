import numpy as np
import pandas as pd
import os
import sys


filename = 'flights.csv'
data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'

# df_airports = pd.read_csv(data_dir + 'br-airports.csv')
# df_airports = df_airports[['icao', 'latitude_deg', 'longitude_deg']]
# df_airports = df_airports.set_index('icao')

nrows = sum(1 for row in open(data_dir + filename, 'r'))
chunksize = 5 * 10 ** 6
header = True
i = -1
for chunk in pd.read_csv(data_dir + filename, chunksize=chunksize, low_memory=False):
    i += 1
    print('Chunk:', i, 'of', int(np.ceil(nrows / chunksize)))

    # Reset index
    chunk.drop(chunk.columns[0], axis=1, inplace=True)

    # Remove flight number column
    chunk.drop('Numero Voo', axis=1, inplace=True)

    # Remove leading or trailing quotes and spaces
    for col in chunk.columns:
        chunk[col] = chunk[col].str.strip('" ')

    # Fix column orders in two different cases
    locs = chunk['Partida Real'].str.len() == 4
    temp = chunk.loc[locs, 'ICAO Aerodromo Destino']
    chunk.loc[locs, 'ICAO Aerodromo Destino'] = chunk.loc[locs, 'Partida Real']
    chunk.loc[locs, 'Partida Real'] = chunk.loc[locs, 'Partida Prevista']
    chunk.loc[locs, 'Partida Prevista'] = temp
    
    locs = chunk['Partida Prevista'].str.len() == 4
    temp = chunk.loc[locs, 'ICAO Aerodromo Destino']
    chunk.loc[locs, 'ICAO Aerodromo Destino'] = chunk.loc[locs, 'Partida Prevista']
    chunk.loc[locs, 'Partida Prevista'] = chunk.loc[locs, 'Partida Real']
    chunk.loc[locs, 'Partida Real'] = temp
    
    # Convert empty strings to nan
    chunk.replace('', np.nan, inplace=True)

    # Encode values to int
    complete = ['REALIZADO', 'Realizado']
    not_complete = ['NAO REALIZADO', 'NÃO REALIZADO', 'Nao Realizado']
    canceled = ['CANCELADO', 'Cancelado']
    not_informed = ['NAO INFORMADO', 'NíO INFORMADO', 'NÕO INFORMADO', 'NaN']
    chunk['Situacao Voo'].replace(complete, 1, inplace=True)
    chunk['Situacao Voo'].replace(not_complete, 2, inplace=True)
    chunk['Situacao Voo'].replace(canceled, 3, inplace=True)
    chunk['Situacao Voo'].replace(not_informed, np.nan, inplace=True)
    chunk['Situacao Voo'] = pd.Series(chunk['Situacao Voo'], dtype='Int8')

    chunk['Codigo DI'].replace({'D': 10, 'E': 11, 'A': 12, 'B': 13, 'C': 14, 'F': 15}, inplace=True)
    chunk['Codigo DI'] = pd.Series(chunk['Codigo DI'], dtype='Int8')

    chunk['Codigo Tipo Linha'].replace(
        {'N': 1, 'C': 2, 'I': 3, 'G': 4, 'X': 5, 'H': 6, 'L': 7, 'R': 8, 'E': 9, 'N/I': np.nan}, inplace=True)
    chunk['Codigo Tipo Linha'] = pd.Series(chunk['Codigo Tipo Linha'], dtype='Int8')

    chunk['Codigo Justificativa'].replace({'AA': 0, 'AF': 1, 'AG': 2, 'AI': 3, 'AJ': 4, 'AM': 5, 'AR': 6, 'AS': 7, 'AT': 8, 'DF': 9,
                                           'DG': 10, 'FP': 11, 'GF': 12, 'HA': 13, 'HB': 14, 'HD': 15, 'HI': 16, 'IR': 17, 'MA': 18, 'MX': 19,
                                           'OA': 20, 'RA': 21, 'RI': 22, 'RM': 23, 'ST': 24, 'TC': 25, 'TD': 26, 'VE': 27, 'VI': 28, 'VR': 29,
                                           'WA': 30, 'WI': 31, 'WO': 32, 'WR': 33, 'WS': 34, 'WT': 35, 'XA': 36, 'XB': 37, 'XI': 38, 'XJ': 39,
                                           'XL': 40, 'XM': 41, 'XN': 42, 'XO': 43, 'XS': 44, 'XT': 45, 'cc': 46, 'WP': 47, 'XR': 48, 'HC': 49,
                                           'M': 50}, inplace=True)
    chunk['Codigo Justificativa'].replace('<!--', np.nan, inplace=True)
    chunk['Codigo Justificativa'] = pd.Series(chunk['Codigo Justificativa'], dtype='Int8')

    # Parse dates
    date_columns = ['Chegada Prevista', 'Chegada Real',
                    'Partida Prevista', 'Partida Real']
    formats = ['%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M:%S']
    for column in date_columns:
        chunk[column].fillna('NaN', inplace=True)
        for f in formats:
            locs = chunk[column].astype(str).str.len() == len(f) + 2
            chunk.loc[locs, column] = pd.to_datetime(chunk.loc[locs, column], format=f)
        chunk[column].replace(not_informed, np.nan, inplace=True)

    if header:
        chunk.to_csv(data_dir + 'processed_' + filename, index=False)
        header = False
    else:
        chunk.to_csv(data_dir + 'processed_' +
                     filename, header=False, mode='a', index=False)


# # Add airports coordinates
# df_flights = df_flights.set_index(
#     'ICAO Aerodromo Origem').join(df_airports)
# df_flights = df_flights.rename(columns={'latitude_deg': 'Latitude Aerodromo Origem',
#                                         'longitude_deg': 'Longitude Aerodromo Origem'})

# print(df_flights.columns)
# print(df_flights.head())
