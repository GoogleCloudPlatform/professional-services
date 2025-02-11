# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

import random
import sys
class TestGen():
  def __init__(self, infile, outfile):
    self.infile = infile
    self.outfile = outfile
    # NOTE: Statistics are written at the top of the file along with
    # actual content primarily to compare the counts against SSN matches
    # found by the pipeline
    self.stats = {
      'expected_valid_socials': 0,
      'valid_ssn_line': 0,
      'valid_ssn_with_fake': 0,
      'invalid_with_fake_ssn': 0,
      'invalid_no_num': 0
    }
    with open(self.infile) as f:
      self.socials = [s.strip() for s in f.readlines()]

  def randsocial(self):
    return random.choice(self.socials)

  def rand_acct(self):
    return f'{random.randrange(1*10**9 - 1):09d}'

  def valid_ssn_line(self):
    s = self.randsocial()
    self.stats['expected_valid_socials'] += 1
    self.stats['valid_ssn_line'] += 1
    return f'My social is {s}\n'

  def valid_ssn_with_fake(self):
    s = self.randsocial()
    self.stats['expected_valid_socials'] += 1
    self.stats['valid_ssn_with_fake'] += 1
    return f'My account number is {self.rand_acct()} and my ssn is {s.replace("-", "")}\n'

  def invalid_with_fake_ssn(self):
    self.stats['invalid_with_fake_ssn'] += 1
    return f'My account number is {self.rand_acct()}\n'

  def invalid_no_num(self):
    self.stats['invalid_no_num'] += 1
    return 'My name is Inigo Montoya, you killed my father, prepare to die!\n'

  def run(self, num_lines):
    funcs = [self.valid_ssn_line, self.valid_ssn_with_fake, self.invalid_with_fake_ssn, self.invalid_no_num]
    outlines = []
    for _ in range(0, int(num_lines)):
      func = random.choice(funcs)
      outlines.append(func())
    for k in sorted(self.stats.keys(), reverse=True):
      outlines.insert(0, f'{k} = {self.stats[k]}\n')
    with open(self.outfile, 'w') as f:
      for line in outlines:
        f.write(line)

if __name__ == '__main__':
  args = sys.argv[1:]
  TestGen(args[0], args[1]).run(args[2])
