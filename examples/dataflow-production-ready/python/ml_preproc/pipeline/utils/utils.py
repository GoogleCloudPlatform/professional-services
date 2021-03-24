import argparse

def read_abbreviations_local(path):
    abbreviations_dict = {}
    with open(path) as f:
        for line in f:
            (key, val) = line.split('=')
            abbreviations_dict[key.strip()] = val.strip()
    return abbreviations_dict

