import numpy as np
import pandas as pd
import os


filename = 'processed_flights2020.csv'
data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
df = pd.read_csv(data_dir + filename, dtype={'ICAO Empresa Aerea': str,
                                             'Codigo DI': 'Int8',
                                             'Codigo Tipo Linha': 'Int8',
                                             'Situacao Voo': np.int8,
                                             'Codigo Justificativa': str},
                 parse_dates=['Partida Prevista', 'Partida Real', 'Chegada Prevista', 'Chegada Real'])
print(df.info())
print(df.head())
