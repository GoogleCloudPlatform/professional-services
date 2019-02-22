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

"""Unit tests for parse_raw_sat.py."""

import unittest

from parse_raw_sat import _parse_clause
from parse_raw_sat import _parse_lines_iterator
from parse_raw_sat import Clause
from parse_raw_sat import Sat


class _TestClause(unittest.TestCase):

    def test_simple(self):
        a = Clause()
        a.append(2)
        a.append(3)
        self.assertCountEqual(a, [2, 3])

    def test_errors(self):
        a = Clause([4, 5, -2])
        with self.assertRaises(ValueError):
            a.append(2)

    def test_errors2(self):
        a = Clause()
        with self.assertRaises(ValueError):
            a.append(0)


class _TestSat(unittest.TestCase):

    def test_simple(self):
        # (X0|X1|X2) & (X2|X4|X5)
        clauses = [Clause([1, 2, 3]), Clause([3, 5, 6])]
        sat = Sat(clauses, 2, 'test')
        self.assertEqual(sat.check([1, 0, 0, 0, 1, 1]), 2)
        self.assertEqual(sat.check([0, 0, 0, 1, 0, 0]), 0)
        self.assertEqual(sat.check([1, 1, 0, 1, 0, 0]), 1)


class _TestParseFile(unittest.TestCase):

    def test_simple(self):
        txt = ''.join(['Minimize\n0\nSubject To\nR1:X0+X1-X3>=0\n',
                       'Bounds\nBinaries\nX0 X1 X2 X3 X4\nEnd'])
        lines_iter = iter(txt.split('\n'))
        c, n = _parse_lines_iterator(lines_iter)
        self.assertCountEqual(c[0], [1, 2, -4])
        self.assertEqual(n, 5)


class _TestParseClause(unittest.TestCase):

    def test_simple(self):
        p = _parse_clause('R267: X0 + X167 - X5 - X76 >= -1')
        self.assertCountEqual(p, [1, 168, -6, -77])

    def test_simple2(self):
        p = _parse_clause('R267: -X2 + X167 - X5 - X76 >= -2')
        self.assertCountEqual(p, [168, -3, -6, -77])

    def test_zero(self):
        p = _parse_clause('R267: -X2 + X167 - X0 - X76 >= -2')
        self.assertCountEqual(p, [168, -3, -1, -77])

    def test_error(self):
        with self.assertRaises(ValueError):
            _ = _parse_clause('R2: X0 + X1 - X2 >= -1')


if __name__ == '__main__':
    unittest.main()
