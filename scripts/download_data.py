from io import BytesIO
import numpy as np
import os
import pandas as pd
from urllib.request import urlopen
import xlrd
from zipfile import ZipFile


data_dir = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
df_urls = pd.read_csv(data_dir + 'urls.csv')
df_urls = df_urls.set_index(['year', 'month'])

dtypes = {'ICAO Empresa Aerea': str, 'Numero Voo': str, 'Codigo DI': str,
          'Grupo DI': str, 'Codigo Tipo Linha': str, 'ICAO Aerodromo Origem': str,
          'ICAO Aerodromo Destino': str, 'Partida Prevista': str,
          'Partida Real': str, 'Chegada Prevista': str, 'Chegada Real': str,
          'Situacao Voo': str, 'Codigo Justificativa': str}
df_final = pd.DataFrame(columns=dtypes.keys())

i = 0
for index, row in df_urls.iterrows():
    year, month = index
    print(str(i) + '/' + str(df_urls.shape[0]) + ':', year, month)
    i += 1
    url = row['url']
    if i > 9:
        break

    if os.path.isfile(data_dir + str(year) + str(month) + '.csv'):
        df = pd.read_csv(data_dir + str(year) + str(month) + '.csv')
    else:
        response = urlopen(url)
        if url[-3:] == '.zip':
            zf = ZipFile(BytesIO(response.read()))
            path = '/tmp/' + str(year) + str(month)
            zf.extractall(path=path)
            zf.close()
            df = pd.read_csv(path, sep=';', encoding='mac_roman')
        elif url[-4:] == '.xlsx':
            df = pd.read_excel(url)
        else:
            df = pd.read_csv(url, sep=';', encoding='mac_roman')

        df.to_csv(data_dir + str(year) + str(month) + '.csv')

    df = df.rename(columns={'ICAO Aeródromo Origem': 'ICAO Aerodromo Origem',
                            'ICAO Aeródromo Destino': 'ICAO Aerodromo Destino',
                            'Sigla  da Empresa': 'ICAO Empresa Aerea',
                            'N˙mero do Voo': 'Numero Voo',
                            'D I': 'Codigo DI',
                            'Aeroporto Origem': 'ICAO Aerodromo Origem',
                            'Aeroporto Destino': 'ICAO Aerodromo Destino',
                            'SituaÁ„o': 'Situacao Voo',
                            'Justificativa': 'Codigo Justificativa',
                            'Tipo de Linha': 'Codigo Tipo Linha',
                            'ICAO Empresa AÈrea': 'ICAO Empresa Aerea',
                            'N˙mero Voo': 'Numero Voo',
                            'CÛdigo DI': 'Codigo DI',
                            'CÛdigo Tipo Linha': 'Codigo Tipo Linha',
                            'ICAO AerÛdromo Origem': 'ICAO Aerodromo Origem',
                            'ICAO AerÛdromo Destino': 'ICAO Aerodromo Destino',
                            'SituaÁ„o Voo': 'Situacao Voo',
                            'CÛdigo Justificativa': 'Codigo Justificativa'})
    df_final = pd.concat([df_final, df]).astype(dtypes)

    if (year, month) == (2020, 8):
        df_final.to_csv(data_dir + 'flights2020.csv')
    elif (year, month) == (2019, 12):
        df_final.to_csv(data_dir + 'flights2019-20.csv')
    print(df_final.columns)

del df_final['Unnamed: 0']
print(df_final.columns)
print(df_final.dtypes)
df_final.to_csv(data_dir + 'flights.csv')
