#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
""" Module for finding the number of lines in input and output files """

def get_line_count(file1,file2):
    fd1,fd2 = open(file1,'r'),open(file2,'r')
    lines_td = len(fd1.readlines())
    lines_bq = len(fd2.readlines())
    percentage_diff = int(100* (lines_bq-lines_td) / (lines_td))
    fd1.close()
    fd2.close()

    return lines_td,lines_bq,percentage_diff