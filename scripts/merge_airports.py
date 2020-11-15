import numpy as np
import pandas as pd
import os
import sys


def merge_files(files):
    df = pd.DataFrame()
    i = 0
    for f in files:
        print('Processing', i, ': ', end='')
        i += 1

        read_df = pd.read_csv(f)
        codes = files[f][0]
        info = files[f][1]

        for c in codes:
            print(c, end='... ')

            if len(info) == 4:
                new_df = read_df[list([c] + info)]
                new_df = new_df.rename(
                    columns={c: 'code', info[0]: 'brazilian', info[1]: 'state', info[2]: 'latitude', info[3]: 'longitude'})
            elif len(info) == 3:
                new_df = read_df[list([c] + info)]
                new_df = new_df.rename(
                    columns={c: 'code', info[0]: 'brazilian', info[1]: 'latitude', info[2]: 'longitude'})
            else:
                new_df = pd.concat(
                    [read_df[c], read_df[info[1]].str.split(',', expand=True)], axis=1)
                new_df = new_df.rename(
                    columns={c: 'code', info[0]: 'brazilian', 1: 'latitude', 0: 'longitude'})

            df = pd.concat([df, new_df])
            df = df.drop_duplicates(subset='code')
        print()

    brazil_names = {'Brazil', 'BR'}
    df['brazilian'] = df['brazilian'].isin(brazil_names)

    return df


if __name__ == '__main__':
    data_path = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
    br_path = data_path + 'br-airports.csv'
    intl_path = 'https://raw.githubusercontent.com/michaelarg/datasets/master/airports.csv'
    intl_path_2 = 'https://datahub.io/core/airport-codes/r/airport-codes.csv'
    files = {
        br_path: [['icao', 'gps_code'], ['iso_country', 'local_region', 'latitude_deg', 'longitude_deg']],
        intl_path: [['ICAO'], ['Country', 'Latitude', 'Longitude']],
        intl_path_2: [['gps_code'], ['iso_country', 'coordinates']]
    }

    more_airports = [
        ['1AON', 1, 'PA', -6.775833, -51.06],
        ['2NHT', 1, 'BA', -15.353333, -38.997222],
        ['6ASO', 1, 'MT', -12.472778, -55.668889],
        ['SBAG', 1, 'RJ', -22.975, -44.306667],
        ['SBAS', 1, 'SP', -22.64, -50.453056],
        ['SBFC', 1, 'SP', -20.592222, -47.383056],
        ['SBFE', 1, 'BA', -12.200556, -38.906389],
        ['SBGS', 1, 'PR', -25.187778, -50.144444],
        ['SBMG', 1, 'PR', -23.479444, -52.012222],
        ['SBMH', 1, 'PR', -23.479444, -52.012222],
        ['SBNR', 1, 'BA', -12.079167, -45.009444],
        ['SBPM', 1, 'TO', -10.29, -48.357778],
        ['SBRE', 1, 'PE', -8.126389, -34.922778],
        ['SBRG', 1, 'RS', -32.081667, -52.163333],
        ['SBSB', 1, 'CE', -3.678889, -40.336667],
        ['SJUR', 1, 'BA', -16.438056, -39.077778],
        ['SNNG', 1, 'PA', -7.125833, -55.400833],
        ['SNUO', 1, 'PA', -3.747298, -47.500597],
        ['SSSK', 1, 'MA', -4.509166, -43.920277],
        ['SWJH', 1, 'MT', -11.286667, -57.538889],
        ['SWKN', 1, 'GO', -17.724722, -48.61],
        ['SWMP', 1, 'MT', -9.78596, -54.908],

        ['FAJS', 0, np.nan, -26.133333, 28.25],
        ['GVFM', 0, np.nan, 14.9261, -23.4948],
        ['GOOO', 0, np.nan, 14.671111, -17.066944],
        ['GVPR', 0, np.nan, 14.9413, -23.485],
        ['KIMA', 0, np.nan, -28.801667, 24.763611],
        ['KSJU', 0, np.nan, 18.439167, -66.001944],
        ['LPFU', 0, np.nan, 32.694167, -16.778056],
        ['LSZM', 0, np.nan, 47.59, 7.529167],
        ['MRSJ', 0, np.nan, 9.9330, -84.1000],
        ['SABA', 0, np.nan, 17.645556, -63.220556],
        ['SAIG', 0, np.nan, -25.737222, -54.473611],
        ['SBKO', 0, np.nan, 4.701389, -74.146944],
        ['SCIQ', 0, np.nan, -36.274444 - 71.897222],
        ['SMPB', 0, np.nan, 5.852222, -55.203889],
        ['TTPS', 0, np.nan, 10.595278, -61.337222],
    ]

    df = merge_files(files)

    # Fix data points identified on test
    df = df[(df['code'] != '\\N') & (df['code'] !=
                                     '#loc +airport +code +gps') & (df['code'] != '#meta +code')]
    df = df[~df['code'].isna()]

    df.loc[df['code'] == 'SCSN', 'brazilian'] = False

    states_fix = {'SJDB': 'MT', 'BR-0792': 'MT', 'SWUP': 'MT', 'BR-1011': 'MT',
                  'SJTJ': 'MS', 'BR-0161': 'MS', 'BR-1037': 'MS', 'BR-0415': 'MS',
                  'SWZU': 'SP', 'SNTN': 'SP', 'BR-0186': 'SP',
                  'SNSK': 'MG', 'SNRT': 'MG', 'SNDY': 'MG', 'BR-0748': 'MG',
                  'BR-0049': 'GO', 'BR-0053': 'GO', 'BR-0045': 'GO', 'BR-0047': 'GO',
                  'BR-0130': 'RJ',
                  'SSMN': 'PA', 'BR-0196': 'PA', 'BR-0195': 'PA', 'BR-0194': 'PA', 'SSXP': 'PA', 'SDVU': 'PA', 'SJHL': 'PA',
                  'SWWC': 'AP',
                  'BR-0104': 'MA', 'BR-0105': 'MA',
                  'BR-0594': 'RO',
                  'BR-0224': 'TO', 'BR-0214': 'TO', 'BR-0212': 'TO', 'BR-0567': 'TO'}
    for code, state in states_fix.items():
        df.loc[df['code'] == code, 'state'] = state

    for airport in more_airports:
        df = df.append(dict(zip(df.columns, airport)), ignore_index=True)

    df = df.sort_values(by='code')
    df.to_csv(data_path + 'airports.csv', index=False)
