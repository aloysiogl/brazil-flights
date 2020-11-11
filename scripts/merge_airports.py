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
        coordinates = files[f][1]

        for c in codes:
            print(c, end='... ')

            if len(coordinates) == 2:
                new_df = read_df[list([c] + coordinates)]
                new_df = new_df.rename(
                    columns={c: 'code', coordinates[0]: 'latitude', coordinates[1]: 'longitude'})
            else:
                new_df = pd.concat([read_df[c],
                                    read_df[coordinates[0]].str.split(',', expand=True)], axis=1)
                new_df = new_df.rename(
                    columns={c: 'code', 0: 'latitude', 1: 'longitude'})

            df = pd.concat([df, new_df])
            df = df.drop_duplicates(subset='code')
        print()

    return df


if __name__ == '__main__':
    data_path = os.path.dirname(os.path.abspath(__file__)) + '/../data/'
    br_path = data_path + 'br-airports.csv'
    intl_path = 'https://raw.githubusercontent.com/michaelarg/datasets/master/airports.csv'
    intl_path_2 = 'https://datahub.io/core/airport-codes/r/airport-codes.csv'
    files = {
        br_path: [['icao', 'gps_code'], ['latitude_deg', 'longitude_deg']],
        intl_path: [['ICAO'], ['Latitude', 'Longitude']],
        intl_path_2: [['gps_code'], ['coordinates']]
    }

    more_airports = [
        ['1AON', -6.775833, -51.06],
        ['2NHT', -15.353333, -38.997222],
        ['6ASO', -12.472778, -55.668889],
        ['SBAG', -22.975, -44.306667],
        ['SBAS', -22.64, -50.453056],
        ['SBFC', -20.592222, -47.383056],
        ['SBFE', -12.200556, -38.906389],
        ['SBGS', -25.187778, -50.144444],
        ['SBMG', -23.479444, -52.012222],
        ['SBMH', -23.479444, -52.012222],
        ['SBNR', -12.079167, -45.009444],
        ['SBPM', -10.29, -48.357778],
        ['SBRE', -8.126389, -34.922778],
        ['SBRG', -32.081667, -52.163333],
        ['SBSB', -3.678889, -40.336667],
        ['SJUR', -16.438056, -39.077778],
        ['SNNG', -7.125833, -55.400833],
        ['SNUO', -3.747298, -47.500597],
        ['SSSK', -4.509166, -43.920277],
        ['SWJH', -11.286667, -57.538889],
        ['SWKN', -17.724722, -48.61],
        ['SWMP', -9.78596, -54.908],

        ['FAJS', -26.133333, 28.25],
        ['GVFM', 14.9261, -23.4948],
        ['GOOO', 14.671111, -17.066944],
        ['GVPR', 14.9413, -23.485],
        ['KIMA', -28.801667, 24.763611],
        ['KSJU', 18.439167, -66.001944],
        ['LPFU', 32.694167, -16.778056],
        ['LSZM', 47.59, 7.529167],
        ['MRSJ', 9.9330, -84.1000],
        ['SABA', 17.645556, -63.220556],
        ['SAIG', -25.737222, -54.473611],
        ['SBKO', 4.701389, -74.146944],
        ['SCIQ', -36.274444	-71.897222],
        ['SMPB', 5.852222, -55.203889],
        ['TTPS', 10.595278, -61.337222],
    ]

    df = merge_files(files)

    for airport in more_airports:
        df = df.append(dict(zip(df.columns, airport)), ignore_index=True)

    df = df.sort_values(by='code')
    df.to_csv(data_path + 'airports.csv', index=False)
