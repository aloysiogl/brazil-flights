import numpy as np
import os
import pandas as pd
import re


data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
raw_data_dir = data_dir + 'raw/raw/'
divided_data_dir = data_dir + 'raw/divided/'
df_urls = pd.read_csv(data_dir + 'urls.csv')
df_urls = df_urls.set_index(['year', 'month'])

if not os.path.isdir(raw_data_dir):
    os.makedirs(raw_data_dir)
if not os.path.isdir(divided_data_dir):
    os.makedirs(divided_data_dir)

columns_mapping = {
    'Sigla  da Empresa': 'ICAO Empresa Aerea',
    'ICAO Empresa Area': 'ICAO Empresa Aerea',
    'sgempresaicao': 'ICAO Empresa Aerea',
    'Nmero Voo': 'Numero Voo',
    'NUmero Voo': 'Numero Voo',
    'Nmero do Voo': 'Numero Voo',
    'Numero do Voo': 'Numero Voo',
    'nrvoo': 'Numero Voo',
    'Cdigo DI': 'Codigo DI',
    'Cdigo Autorizao DI': 'Codigo DI',
    'Código Autorização (DI)': 'Codigo DI',
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
drop_last_rows = {(2005, 5): 24, (2002, 1): 24}

i = 1
cur_year = 2020
df_final = pd.DataFrame(dtype=str)
for index, row in df_urls.iterrows():
    year, month = index
    print(str(i) + '/' + str(df_urls.shape[0]) + ':', year, month)
    i += 1

    url = row['url']
    if os.path.isfile(raw_data_dir + str(year) + str(month) + '.csv'):
        df = pd.read_csv(raw_data_dir + str(year) + str(month) + '.csv')
    else:
        if url[-4:] == 'xlsx':
            df = pd.read_excel(url)
        else:
            df = pd.read_csv(url, sep=',|;|\t', encoding='latin1')

        df.to_csv(raw_data_dir + str(year) + str(month) + '.csv')

    drop_rows = []
    if (year, month) in drop_first_row:
        drop_rows = [0]
        drop_columns += ['d1', 'd2', 'd3']
        df.columns = ['ICAO Empresa Aerea', 'Numero Voo', 'Codigo DI', 'Codigo Tipo Linha',
                      'ICAO Aerodromo Origem', 'ICAO Aerodromo Destino', 'Partida Prevista',
                      'Partida Real', 'Chegada Prevista', 'Chegada Real', 'Situacao Voo',
                      'Codigo Justificativa', 'd1', 'd2', 'd3']
    if (year, month) in drop_last_rows:
        for d in range(df.shape[0] - drop_last_rows[year, month], df.shape[0]):
            drop_rows.append(d)

    df.columns = [re.sub(r'[^A-Za-z0-9 ]+', '', s) for s in df.columns]
    df.drop(drop_rows, inplace=True)
    df = df.rename(columns=columns_mapping).drop(
        drop_columns, axis=1, errors='ignore')

    if cur_year != year:
        df_final.to_csv(divided_data_dir + 'flights' +
                        str(cur_year) + '.csv', index=False)
        cur_year = year
        del df_final
        df_final = pd.DataFrame(dtype=str)
    df_final = pd.concat([df_final, df])

df_final.to_csv(divided_data_dir + 'flights' + str(2000) + '.csv', index=False)
