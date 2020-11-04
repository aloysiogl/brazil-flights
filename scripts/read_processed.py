import numpy as np
import pandas as pd
import os


filename = 'processed_flights.csv'
data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
df = pd.read_csv(data_dir + filename, dtype={'ICAO Empresa Aerea': str,
                                             'Codigo DI': 'Int8',
                                             'Codigo Tipo Linha': 'Int8',
                                             'ICAO Aerodromo Origem': str,
                                             'ICAO Aerodromo Destino': str,
                                             'Situacao Voo': 'Int8',
                                             'Codigo Justificativa': 'Int8'},
                 parse_dates=['Partida Prevista', 'Partida Real', 'Chegada Prevista', 'Chegada Real'])

print(df.info())
print(df.memory_usage(deep=True) / 1024 ** 2)

print('\nICAO Empresa Aerea lengths frequency')
print(dict(df['ICAO Empresa Aerea'].str.len().value_counts()))
print('\nICAO Aerodromo Origem lengths frequency')
print(dict(df['ICAO Aerodromo Origem'].str.len().value_counts()))
print('\nICAO Aerodromo Destino lengths frequency')
print(dict(df['ICAO Aerodromo Destino'].str.len().value_counts()))
print()
print('Partida Prevista > Chegada Prevista:', np.count_nonzero(df['Partida Prevista'] > df['Chegada Prevista']))
print('Partida Real > Chegada Real:', np.count_nonzero(df['Partida Real'] > df['Chegada Real']))

df[df['Partida Prevista'] > df['Chegada Prevista']].to_csv(data_dir + 'analyze.csv', index=False)
