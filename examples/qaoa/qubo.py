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

"""A module that reduces PUBO maxSAT problem to a QUBO formulation."""

from collections import namedtuple


class Qclause(namedtuple('Qclause', ['vars_ind', 'coeff'])):
    """A namedtuple that represents a clause in a QUBO formalism.

    Attributes:
        vars_ind: list of indices of variables in the clause
        coeff: a coefficient for a corresponding variable
    """

    pass


class Penalty(namedtuple('Penalty', ['var1_ind', 'var2_ind', 'var_repl_ind'])):
    """A nameduple that represents a penalty for PUBO -> QUBO transformation.

    Attributes:
        var1_ind: an index for the first variable
        var2_ind: an index for the second variable
        var_repl_ind: an index for a ancillary variable that substitutes the
            multiplicaion of the first and the second ones.
    """

    pass


class QuboProblem(object):
    """A representation of a max-SAT problem in a QUBO form.

    Attributes:
        var_names: list of variables names
        qclauses - list of Qclause, each clause stores variables' indices
        penalties - list of tuples of penalties (Penalties)
    """

    def __init__(self, sat):
        """Init a QUBO class.

        Args:
            sat: an instance of SAT problem
        """
        v = set([abs(el) for c in sat.clauses for el in c])
        self.var_names = ['X%s' % i for i in range(max(list(v)))]
        self.qclauses = []
        for c in sat.clauses:
            self.qclauses += open_brackets(c)
        self.penalties = []
        self.sat = sat
        self.reduce_to_qubo()

    def _get_penalty(self, penalty):
        """Represent a penalty as list of Qclauses.

        Args:
            penalty: a Penalty
        Returns:
            a list of Qclauses that represents this penalty.
        """
        return [Qclause([penalty.var_repl_ind], 3),
                Qclause([penalty.var1_ind, penalty.var2_ind], 1),
                Qclause([penalty.var1_ind, penalty.var_repl_ind], -2),
                Qclause([penalty.var2_ind, penalty.var_repl_ind], -2)]

    def get_penalties(self):
        """Return a list of Qclauses that represents penalties."""
        penalties = []
        for p in self.penalties:
            penalties += self._get_penalty(p)
        return penalties

    def _replace_var(self, var1_ind, var2_ind, anc_var_ind):
        """Replace variables in a list of QClauses (inplace).

        Args:
        var1_ind: index of the first variable
        var2_ind: index of the second variable
        anc_var_ind: an index of an ancillary variable that replaces a
            multiplication of var1_ind and var2_ind
        """
        for c in self.qclauses:
            if (var1_ind in c.vars_ind and
                    var2_ind in c.vars_ind and len(c.vars_ind) > 2):
                c.vars_ind.remove(var1_ind)
                c.vars_ind.remove(var2_ind)
                c.vars_ind.append(anc_var_ind)

    def reduce_to_qubo(self):
        """Reduce a PUBO max-SAT problem in a purely QUBO form (inplace)."""
        anc_var_ind = len(self.var_names) - 1
        for c in self.qclauses:
            while len(c.vars_ind) > 2:
                anc_var_ind += 1
                var1_ind = c.vars_ind[0]
                var2_ind = c.vars_ind[1]
                self._replace_var(var1_ind, var2_ind, anc_var_ind)
                self.var_names.append('X_%s_%s' % (var1_ind, var2_ind))
                self.penalties.append(Penalty(var1_ind, var2_ind, anc_var_ind))

    def to_qwave_format(self):
        """Transform a problem to QWave format."""
        lines = []
        onsite_fields, interactions = self.get_qaoa()
        lines.append('c  This is a sample .qubo file\n')
        lines2 = []
        nodes = 0
        lines2.append('c ------------------\n')
        for i, c in enumerate(onsite_fields):
            if abs(c) > 0:
                lines2.append('%s  %s   %s\n' % (i, i, c))
                nodes += 1
        lines2.append('c ------------------\n')
        n_couplers = 0
        for i, row in enumerate(interactions):
            for j, c in enumerate(row):
                if abs(c) > 0.:
                    lines2.append('%s  %s   %s\n' % (i, j, c))
                    n_couplers += 1
        lines.append('p   qubo  0   %s   %s   %s\n' % (
            len(self.var_names),
            nodes,
            n_couplers))
        return lines + lines2

    def get_qaoa(self):
        """Transform a QUBO problem into a  QAOA TFQuantum format.

        Returns:
            onsite_fields - a list of length amount_of_variables,
            contains 1/2 of energy for every variable (spin).
            interactions - a nested list amount_of_variables
                * amount_of_variables, contains 1/2 of energy interaction
                between spins I and J,
            diagonal elements are zeros.
        """
        clauses = self.qclauses + self.get_penalties()
        l = len(self.var_names)
        onsite_fields = [0.] * l
        interactions = [[0.] * l for _ in range(l)]
        for q in clauses:
            if len(q.vars_ind) == 1:
                onsite_fields[q.vars_ind[0]] += 1. * q.coeff / 2
            elif len(q.vars_ind) == 2:
                interactions[q.vars_ind[0]][q.vars_ind[1]] += 1. * q.coeff / 2
                interactions[q.vars_ind[1]][q.vars_ind[0]] += 1. * q.coeff / 2
        return onsite_fields, interactions


def open_brackets(clause):
    """Open brackets in a parse_raw_sat.Clause.

    Args:
    clause: Clause that might have brackets (a.k.a. positive signs)
    Returns:
    a list of Qclauses
    """
    def _open_bracket(acc, sign, left_clause, right_clause):
        if right_clause:
            element = right_clause[0]
            if element > 0:
                _open_bracket(acc, -sign, left_clause + [element],
                              right_clause[1:])
                _open_bracket(acc, sign, left_clause, right_clause[1:])
            else:
                _open_bracket(acc, sign, left_clause + [-element],
                              right_clause[1:])
        else:
            acc.append(Qclause([el - 1 for el in left_clause], sign))

    if clause:
        clauses = []
    _open_bracket(clauses, 1, [], clause)
    return clauses
