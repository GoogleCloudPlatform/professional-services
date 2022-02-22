# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""A module to parse maxSAT problems from files."""

import argparse
from collections import namedtuple
import os
import re

import numpy as np

from qubo import QuboProblem

# constrains are in form like 'R4:-X3+X6-X0+X5>=-1'
_CONSTRAINT_RE = re.compile(r'R[0-9]+:(-?(?:X[0-9]+[+-])*X[0-9]+)>=(-?[0-9]+)')
_VARIABLE_RE = re.compile(r'[+-]?X[0-9]+')


class Sat(namedtuple('_Sat', ['clauses', 'num_vars', 'source_filename'])):
    """A named tuple that represents a max-SAT problem.

    Attributes:
        clauses: list of Clauses
        num_vars: amount of variables
        source_filame: the path to the source file (Daimler's format)
    """

    def _check_clause(self, clause, solution):
        for el in clause:
            s = solution[abs(el) - 1]
            if el > 0 and s == 1:
                return True
            if el < 0 and s == 0:
                return True
        return False

    def check(self, solution):
        """Check a given solution for this SAT problem.

        Returns:
            Amount of correc clauses.
        """
        return sum([self._check_clause(x, solution) for x in self.clauses])


class Clause(list):
    """A list that represents one clause in CNF form.

    A Clause consits of nonzero ints, every int represents a variable.
    Negative ints represent negation.
    A variable can't be both in a positive and negative form in one clause.
    """

    def __init__(self, *args, **kwargs):
        super(Clause, self).__init__(*args, **kwargs)
        self._check()

    def _check(self):
        abs_vars = [abs(el) for el in self]
        if not len(set(abs_vars)) == len(self):
            raise ValueError('No duplicates in vars are allowed!')
        if 0 in self:
            raise ValueError('Variable with 0 index is not allowed!')

    def append(self, *args, **kwargs):
        super(Clause, self).append(*args, **kwargs)
        self._check()


def _parse_clause(line):
    """Parse a string that represents a clause.

    Args:
        line: a string, e.g. 'X0+X1-X2>=-1'
    Returns:
        A list of non-zero ints representing variables in the clause
            (e.g., [1, 2, -3])
    """
    line = line.replace(' ', '')
    match = re.match(_CONSTRAINT_RE, line)
    if not match:
        raise ValueError('The input line doesn\'t match the expected format')
    raw, c = match.groups()
    raw = re.findall(_VARIABLE_RE, raw)
    vs = [int(x.replace('X', '')) for x in raw]
    # to avoid 0 index (0->1, 1->2, -2->-3)
    vs = [x + 1 if x >= 0 else x - 1 for x in vs]
    if '-X0' in raw:
        vs.remove(1)
        vs.append(-1)
    if not int(c) == (1 - len([x for x in vs if x < 0])):
        raise ValueError('')
    return vs


def _parse_lines_iterator(lines):
    """Parses a Daimler proprietary format.

    Args:
        lines: iterator of lines
    Returns:
        clauses - a list of Clauses of CNF problem
        num_vars - amount of variables in a CNF problem
    """
    clauses = []
    if not next(lines).strip() == 'Minimize':
        raise ValueError('Wrong file format')
    if not next(lines).strip() == '0':
        raise ValueError('Wrong file format')
    if not next(lines).strip() == 'Subject To':
        raise ValueError('Wrong file format')
    while True:
        line = next(lines).strip()
        if line == 'Bounds':
            break
        p = _parse_clause(line)
        clauses.append(Clause(p))
    if not next(lines).strip() == 'Binaries':
        raise ValueError('Wrong file format')
    num_vars = len(next(lines).strip().split())
    max_ind = max([max([abs(ind) for ind in c]) for c in clauses])
    if not num_vars >= max_ind:
        raise ValueError('Wrong file format')
    if not next(lines).strip() == 'End':
        raise ValueError('Wrong file format')
    return clauses, num_vars


def parse_file(file_name):
    """Parse a proprietary Daimler's format.

    Args:
        file_name: a full path to a file

    Returns:
        a SAT instance of a problem
    """
    with open(file_name, 'r') as f:
        c, n = _parse_lines_iterator(f)
    return Sat(c, n, file_name)


def _parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--dir',
        help='Dir to process all files',
        type=str)
    parser.add_argument(
        '--dwave',
        help='Dir to process all files',
        default=False,
        type=bool)
    args = parser.parse_args()
    return vars(args)


def _proccess_all(path, transform=False):
    """Proccess all files and converts problems to QUBO."""
    files = [os.path.join(path, f) for f in os.listdir(path)
             if f.endswith('.lp')]
    problems = []

    def _check_stat(file_stat, value, file_name):
        if ((file_stat['eq'] == 'gt' and value > file_stat['value']) or
                (file_stat['eq'] == 'lt' and value < file_stat['value'])):
            file_stat['value'] = value
            file_stat['filename'] = file_name

    stats = {
        'max_totat_bits': {'value': 0, 'filename': '', 'eq': 'gt'},
        'max_initial_bits': {'value': 0, 'filename': '', 'eq': 'gt'},
        'max_anc_bits': {'value': 0, 'filename': '', 'eq': 'gt'},
        'min_total_bits': {'value': np.inf, 'filename': '', 'eq': 'lt'}}

    for f in files:
        sat = parse_file(f)
        qubo = QuboProblem(sat)
        initial_bits = sat.num_vars
        total_bits = len(qubo.var_names)
        if transform:
            outputname = '{0}/dwave/{1}.qubo'.format(
                os.path.dirname(os.path.realpath(f)),
                os.path.basename(f).split('.')[0])
            with open(outputname, 'w') as f1:
                for line in qubo.to_qwave_format():
                    f1.write(line)
        anc_bits = total_bits - initial_bits
        _check_stat(stats['max_initial_bits'], initial_bits, f)
        _check_stat(stats['max_totat_bits'], total_bits, f)
        _check_stat(stats['min_total_bits'], total_bits, f)
        _check_stat(stats['max_anc_bits'], anc_bits, f)
        problems.append(sat)
    for k, v in stats.items():
        print('%s: %s in %s' % (k, v['value'], v['filename']))
    print('Success!')


def main():
    args = _parse_args()
    if 'dir' in args:
        _proccess_all(args['dir'], args['dwave'])


if __name__ == '__main__':
    main()
