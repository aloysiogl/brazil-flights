import numpy as np
import os
import pandas as pd
import re


data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
df_urls = pd.read_csv(data_dir + 'urls.csv')
df_urls = df_urls.set_index(['year', 'month'])

df_final = pd.DataFrame(dtype=str)

columns_mapping = {
    'Sigla  da Empresa': 'ICAO Empresa Aerea',
    'ICAO Empresa Area': 'ICAO Empresa Aerea',
    'sgempresaicao': 'ICAO Empresa Aerea',
    'Nmero Voo': 'Numero Voo',
    'NUmero Voo': 'Numero Voo',
    'Nmero do Voo': 'Numero Voo',
    'nrvoo': 'Numero Voo',
    'Cdigo DI': 'Codigo DI',
    'Cdigo Autorizao DI': 'Codigo DI',
    'D I': 'Codigo DI',
    'cddi': 'Codigo DI',
    'Tipo de Linha': 'Codigo Tipo Linha',
    'Cdigo Tipo Linha': 'Codigo Tipo Linha',
    'cdtipolinha': 'Codigo Tipo Linha',
    'ICAO Aerdromo Origem': 'ICAO Aerodromo Origem',
    'ICAO Aerdromo Destino': 'ICAO Aerodromo Destino',
    'sgicaoorigem': 'ICAO Aerodromo Origem',
    'sgicaodestino': 'ICAO Aerodromo Destino',
    'Aeroporto Origem': 'ICAO Aerodromo Origem',
    'Aeroporto Destino': 'ICAO Aerodromo Destino',
    'Data Partida Prevista': 'Partida Prevista',
    'Data Partida Real': 'Partida Real',
    'Data Chegada Prevista': 'Chegada Prevista',
    'Data Chegada Real': 'Chegada Real',
    'dtpartidaprevista': 'Partida Prevista',
    'dtpartidareal': 'Partida Real',
    'dtchegadaprevista': 'Chegada Prevista',
    'dtchegadareal': 'Chegada Real',
    'Situao Voo': 'Situacao Voo',
    'Situacao': 'Situacao Voo',
    'situacao': 'Situacao Voo',
    'Situao': 'Situacao Voo',
    'Cdigo Justificativa': 'Codigo Justificativa',
    'Justificativa': 'Codigo Justificativa',
    'CdigoJustificativa': 'Codigo Justificativa',
    'cdjustificativa': 'Codigo Justificativa'
}

drop_columns = ['Unnamed 0', 'Grupo DI', 'Data Prevista']
drop_first_row = set([(2015, 11), (2015, 12)])
drop_last_rows = { (2005, 5): 27, (2002, 1): 27 }

i = 1
for index, row in df_urls.iterrows():
    year, month = index
    print(str(i) + '/' + str(df_urls.shape[0]) + ':', year, month)
    i += 1

    url = row['url']
    if os.path.isfile(data_dir + str(year) + str(month) + '.csv'):
        df = pd.read_csv(data_dir + str(year) + str(month) + '.csv')
    else:
        if url[-4:] == 'xlsx':
            df = pd.read_excel(url)
        else:
            df = pd.read_csv(url, sep=',|;|\t', encoding='latin1')

        df.to_csv(data_dir + str(year) + str(month) + '.csv')

    drop_rows = []
    if (year, month) in drop_first_row:
        drop_rows = [0]
    if (year, month) in drop_last_rows:
        for d in range(df.shape[0] - drop_last_rows[year, month], df.shape[0]):
            drop_rows.append(d)

    df.columns = [re.sub(r'[^A-Za-z0-9 ]+', '', s) for s in df.columns]
    df.drop(drop_rows)
    df = df.rename(columns=columns_mapping).drop(drop_columns, axis=1, errors='ignore')
    df_final = pd.concat([df_final, df])

    if (year, month) == (2020, 8):
        df_final.to_csv(data_dir + 'flights2020.csv')
    elif (year, month) == (2019, 12):
        df_final.to_csv(data_dir + 'flights2019-20.csv')

print(df_final.columns)
df_final.to_csv(data_dir + 'flights.csv')
