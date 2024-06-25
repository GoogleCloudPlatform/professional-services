#!/usr/bin/env python3

import yaml

ystr = yaml.dump({'a': 1, 'b': 2, 'c': 3})
yaml.load(ystr)

print("This is unsecure!")
