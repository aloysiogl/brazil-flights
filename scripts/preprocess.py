import numpy as np
import pandas as pd
import os
import sys


filename = 'flights2019-20.csv'
data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'

# df_airports = pd.read_csv(data_dir + 'br-airports.csv')
# df_airports = df_airports[['icao', 'latitude_deg', 'longitude_deg']]
# df_airports = df_airports.set_index('icao')

chunksize = 3 * 10 ** 6
header = True
for chunk in pd.read_csv(data_dir + filename, chunksize=chunksize):
    # Reset index
    chunk.drop(chunk.columns[0], axis=1, inplace=True)

    if chunk[chunk['Situacao Voo'] == '"></body>'].shape[0] > 0:
        print(chunk[chunk['Situacao Voo'] == '"></body>']['Partida Prevista'])

    # Remove flight number
    chunk.drop('Numero Voo', axis=1, inplace=True)

    # Rename values
    complete = ['REALIZADO', 'Realizado', '"Realizado"']
    not_complete = ['NAO REALIZADO', 'NÃO REALIZADO', 'Nao Realizado']
    canceled = ['CANCELADO', 'Cancelado', '"Cancelado"']
    not_informed = ['NAO INFORMADO', 'NíO INFORMADO', 'NÕO INFORMADO']
    chunk['Situacao Voo'].replace(complete, 1, inplace=True)
    chunk['Situacao Voo'].replace(not_complete, 2, inplace=True)
    chunk['Situacao Voo'].replace(canceled, 3, inplace=True)
    chunk['Situacao Voo'].replace(not_informed, 4, inplace=True)

    chunk['Codigo DI'].replace('D', 10, inplace=True)
    chunk['Codigo DI'].replace('E', 11, inplace=True)
    chunk['Codigo DI'].replace(['A', 'B', 'C', 'F', ' '], np.nan, inplace=True)
    chunk['Codigo DI'] = pd.Series(chunk['Codigo DI'], dtype='Int8')
    print(chunk['Codigo DI'].value_counts())

    chunk['Codigo Tipo Linha'].replace('N', 1, inplace=True)
    chunk['Codigo Tipo Linha'].replace('C', 2, inplace=True)
    chunk['Codigo Tipo Linha'].replace('I', 3, inplace=True)
    chunk['Codigo Tipo Linha'].replace('G', 4, inplace=True)
    chunk['Codigo Tipo Linha'].replace(['X', 'H', 'L', 'R', 'E'], np.nan, inplace=True)
    chunk['Codigo Tipo Linha'] = pd.Series(chunk['Codigo Tipo Linha'], dtype='Int8')
    print(chunk['Codigo Tipo Linha'].value_counts())

    # Parse dates
    chunk['Partida Prevista'].replace(not_informed, np.nan, inplace=True)
    chunk['Partida Real'].replace(not_informed, np.nan, inplace=True)
    chunk['Chegada Prevista'].replace(not_informed, np.nan, inplace=True)
    chunk['Chegada Real'].replace(not_informed, np.nan, inplace=True)
    chunk['Partida Prevista'] = pd.to_datetime(
        chunk['Partida Prevista'], format='%d/%m/%Y %H:%M')
    chunk['Partida Real'] = pd.to_datetime(
        chunk['Partida Real'], format='%d/%m/%Y %H:%M')
    chunk['Chegada Prevista'] = pd.to_datetime(
        chunk['Chegada Prevista'], format='%d/%m/%Y %H:%M')
    chunk['Chegada Real'] = pd.to_datetime(
        chunk['Chegada Real'], format='%d/%m/%Y %H:%M')

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
