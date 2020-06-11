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

"""Unit tests for qubo.py."""

import unittest

import numpy as np

from parse_raw_sat import Clause
from parse_raw_sat import Sat
from qubo import open_brackets
from qubo import Penalty
from qubo import Qclause
from qubo import QuboProblem


class _TestOpenBrackets(unittest.TestCase):

    def test_open_brackets(self):
        self.assertCountEqual(
            open_brackets(Clause([-1, -2, -3])),
            [Qclause([0, 1, 2], 1)])

    def test_open_brackets2(self):
        self.assertCountEqual(
            open_brackets(Clause([1, 2, 3])),
            [Qclause([], 1), Qclause([0], -1), Qclause([1], -1),
             Qclause([0, 1], 1), Qclause([2], -1), Qclause([0, 2], 1),
             Qclause([1, 2], 1), Qclause([0, 1, 2], -1)])


class _TestQuboProblem(unittest.TestCase):

    def _qlauses_equals(self, q1, q2):
        self.assertCountEqual(q1.vars_ind, q2.vars_ind)

    def test_simple(self):
        # (X0|X1|X2) & (X2|X4|X5)
        clauses = [Clause([1, 2, 3]), Clause([3, 5, 6])]
        sat = Sat(clauses, 2, 'test')
        q = QuboProblem(sat)
        self.assertCountEqual(
            q.var_names,
            ['X0', 'X1', 'X2', 'X3', 'X4', 'X5', 'X_0_1', 'X_2_4'])
        self.assertCountEqual(
            q.qclauses,
            [Qclause([], 1), Qclause([0], -1), Qclause([1], -1),
             Qclause([0, 1], 1), Qclause([2], -1), Qclause([0, 2], 1),
             Qclause([1, 2], 1), Qclause([2, 6], -1), Qclause([], 1),
             Qclause([2], -1), Qclause([4], -1), Qclause([2, 4], 1),
             Qclause([5], -1), Qclause([2, 5], 1), Qclause([4, 5], 1),
             Qclause([5, 7], -1)])
        self.assertCountEqual(
            q.penalties,
            [Penalty(0, 1, 6), Penalty(2, 4, 7)])

    def test_replace_var(self):
        qaoa = QuboProblem(Sat([Clause([1])], 1, 'test'))
        qclauses = [Qclause([0, 1, 2], 1), Qclause([0, 2, 3], 1),
                    Qclause([0, 2], 1), Qclause([0, 1, 4], 1)]
        qaoa.qclauses = qclauses
        qaoa._replace_var(0, 1, 5)
        self.assertCountEqual(
            qaoa.qclauses,
            [Qclause([2, 5], 1), Qclause([0, 2, 3], 1),
             Qclause([0, 2], 1), Qclause([4, 5], 1)])

    def test_get_qaoa(self):
        # (X0|X1|X2) & (X2|X4|X5)
        clauses = [Clause([1, 2, 3]), Clause([3, 5, 6])]
        sat = Sat(clauses, 2, 'test')
        q = QuboProblem(sat)
        o, i = q.get_qaoa()
        expected_states = np.array(
            [-0.5, -0.5, -1., -0., -0.5, -0.5, 1.5, 1.5])
        np.testing.assert_allclose(np.array(o), expected_states)
        expected_interactions = np.array(
            [[0., 1., .5, 0., 0., 0., -1., 0.],
             [1., 0., .5, 0., 0., 0., -1., 0.],
             [.5, .5, 0., 0., 1., .5, -.5, -1.],
             [0., 0., 0., 0., 0., 0., 0., 0.],
             [0., 0., 1., 0., 0., .5, 0., -1.],
             [0., 0., .5, 0., .5, 0., 0., -.5],
             [-1., -1., -.5, 0., 0., 0., 0., 0.],
             [0., 0., -1., 0., -1., -.5, 0., 0.]])
        np.testing.assert_allclose(np.array(i), expected_interactions)

    def test_to_qwave(self):
        # (X0|X1|X2) & (X2|X4|X5)
        clauses = [Clause([1, 2, 3]), Clause([3, 5, 6])]
        sat = Sat(clauses, 2, 'test')
        q = QuboProblem(sat)
        lines = q.to_qwave_format()
        output = """c  This is a sample .qubo file
        p   qubo  0   8   7   24
        c ------------------
        0  0   -0.5
        1  1   -0.5
        2  2   -1.0
        4  4   -0.5
        5  5   -0.5
        6  6   1.5
        7  7   1.5
        c ------------------
        0  1   1.0
        0  2   0.5
        0  6   -1.0
        1  0   1.0
        1  2   0.5
        1  6   -1.0
        2  0   0.5
        2  1   0.5
        2  4   1.0
        2  5   0.5
        2  6   -0.5
        2  7   -1.0
        4  2   1.0
        4  5   0.5
        4  7   -1.0
        5  2   0.5
        5  4   0.5
        5  7   -0.5
        6  0   -1.0
        6  1   -1.0
        6  2   -0.5
        7  2   -1.0
        7  4   -1.0
        7  5   -0.5
        5  5   -0.5""".split('\n')
        for l0, l1 in zip(lines, output):
            self.assertEqual(l0.strip(), l1.strip())


if __name__ == '__main__':
    unittest.main()
