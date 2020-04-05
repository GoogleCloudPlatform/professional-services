#!/usr/bin/env python

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# Verifies that all source files contain the necessary copyright boilerplate
# snippet.
# This is based on existing work
# https://github.com/kubernetes/test-infra/blob/master/hack
# /verify_boilerplate.py
from __future__ import print_function
import argparse
import glob
import os
import re
import sys


def get_args():
    """Parses command line arguments.

    Configures and runs argparse.ArgumentParser to extract command line
    arguments.

    Returns:
        An argparse.Namespace containing the arguments parsed from the
        command line
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("filenames",
                        help="list of files to check, "
                             "all files if unspecified",
                        nargs='*')
    rootdir = os.path.dirname(__file__) + "/../"
    rootdir = os.path.abspath(rootdir)
    parser.add_argument(
        "--rootdir",
        default=rootdir,
        help="root directory to examine")

    default_boilerplate_dir = os.path.join(rootdir, "test/boilerplate")
    parser.add_argument("--boilerplate-dir", default=default_boilerplate_dir)
    return parser.parse_args()


def get_refs(ARGS):
    """Converts the directory of boilerplate files into a map keyed by file
    extension.

    Reads each boilerplate file's contents into an array, then adds that array
    to a map keyed by the file extension.

    Returns:
        A map of boilerplate lines, keyed by file extension. For example,
        boilerplate.py.txt would result in the k,v pair {".py": py_lines} where
        py_lines is an array containing each line of the file.
    """
    refs = {}

    # Find and iterate over the absolute path for each boilerplate template
    for path in glob.glob(os.path.join(
            ARGS.boilerplate_dir,
            "boilerplate.*.txt")):
        extension = os.path.basename(path).split(".")[1]
        ref_file = open(path, 'r')
        ref = ref_file.read().splitlines()
        ref_file.close()
        refs[extension] = ref
    return refs


# pylint: disable=too-many-locals
def has_valid_header(filename, refs, regexs):
    """Test whether a file has the correct boilerplate header.

    Tests each file against the boilerplate stored in refs for that file type
    (based on extension), or by the entire filename (eg Dockerfile, Makefile).
    Some heuristics are applied to remove build tags and shebangs, but little
    variance in header formatting is tolerated.

    Args:
        filename: A string containing the name of the file to test
        refs: A map of boilerplate headers, keyed by file extension
        regexs: a map of compiled regex objects used in verifying boilerplate

    Returns:
        True if the file has the correct boilerplate header, otherwise returns
        False.
    """
    try:
        with open(filename, 'r') as fp:  # pylint: disable=invalid-name
            data = fp.read()
    except IOError:
        return False
    basename = os.path.basename(filename)
    extension = get_file_extension(filename)
    if extension:
        ref = refs[extension]
    else:
        ref = refs[basename]
    # remove build tags from the top of Go files
    if extension == "go":
        con = regexs["go_build_constraints"]
        (data, found) = con.subn("", data, 1)
    # remove shebang
    elif extension == "sh" or extension == "py":
        she = regexs["shebang"]
        (data, found) = she.subn("", data, 1)
    data = data.splitlines()
    # if our test file is smaller than the reference it surely fails!
    if len(ref) > len(data):
        return False
    # trim our file to the same number of lines as the reference file
    data = data[:len(ref)]
    year = regexs["year"]
    for datum in data:
        if year.search(datum):
            return False

    # if we don't match the reference at this point, fail
    if ref != data:
        return False
    return True


def get_file_extension(filename):
    """Extracts the extension part of a filename.

    Identifies the extension as everything after the last period in filename.

    Args:
        filename: string containing the filename

    Returns:
        A string containing the extension in lowercase
    """
    return os.path.splitext(filename)[1].split(".")[-1].lower()


# These directories will be omitted from header checks
SKIPPED_DIRS = [
    'Godeps', 'third_party', '_gopath', '_output',
    '.git', 'vendor', '__init__.py', 'node_modules', '.terraform'
]


def normalize_files(files):
    """Extracts the files that require boilerplate checking from the files
    argument.

    A new list will be built. Each path from the original files argument will
    be added unless it is within one of SKIPPED_DIRS. All relative paths will
    be converted to absolute paths by prepending the root_dir path parsed from
    the command line, or its default value.

    Args:
        files: a list of file path strings

    Returns:
        A modified copy of the files list where any any path in a skipped
        directory is removed, and all paths have been made absolute.
    """
    newfiles = []
    for pathname in files:
        if any(x in pathname for x in SKIPPED_DIRS):
            continue
        newfiles.append(pathname)
    for idx, pathname in enumerate(newfiles):
        if not os.path.isabs(pathname):
            newfiles[idx] = os.path.join(ARGS.rootdir, pathname)
    return newfiles


def get_files(extensions, ARGS):
    """Generates a list of paths whose boilerplate should be verified.

    If a list of file names has been provided on the command line, it will be
    treated as the initial set to search. Otherwise, all paths within rootdir
    will be discovered and used as the initial set.

    Once the initial set of files is identified, it is normalized via
    normalize_files() and further stripped of any file name whose extension is
    not in extensions.

    Args:
        extensions: a list of file extensions indicating which file types
                    should have their boilerplate verified

    Returns:
        A list of absolute file paths
    """
    files = []
    if ARGS.filenames:
        files = ARGS.filenames
    else:
        for root, dirs, walkfiles in os.walk(ARGS.rootdir):
            # don't visit certain dirs. This is just a performance improvement
            # as we would prune these later in normalize_files(). But doing it
            # cuts down the amount of filesystem walking we do and cuts down
            # the size of the file list
            for dpath in SKIPPED_DIRS:
                if dpath in dirs:
                    dirs.remove(dpath)
            for name in walkfiles:
                pathname = os.path.join(root, name)
                files.append(pathname)
    files = normalize_files(files)
    outfiles = []
    for pathname in files:
        basename = os.path.basename(pathname)
        extension = get_file_extension(pathname)
        if extension in extensions or basename in extensions:
            outfiles.append(pathname)
    return outfiles


def get_regexs():
    """Builds a map of regular expressions used in boilerplate validation.

    There are two scenarios where these regexes are used. The first is in
    validating the date referenced is the boilerplate, by ensuring it is an
    acceptable year. The second is in identifying non-boilerplate elements,
    like shebangs and compiler hints that should be ignored when validating
    headers.

    Returns:
        A map of compiled regular expression objects, keyed by mnemonic.
    """
    regexs = {}
    # Search for "YEAR" which exists in the boilerplate, but shouldn't in the
    # real thing
    regexs["year"] = re.compile('YEAR')
    # dates can be 2014, 2015, 2016 or 2017, company holder names can be
    # anything
    regexs["date"] = re.compile('(2014|2015|2016|2017|2018)')
    # strip // +build \n\n build constraints
    regexs["go_build_constraints"] = re.compile(r"^(// \+build.*\n)+\n",
                                                re.MULTILINE)
    # strip #!.* from shell/python scripts
    regexs["shebang"] = re.compile(r"^(#!.*\n)\n*", re.MULTILINE)
    return regexs


def main(args):
    """Identifies and verifies files that should have the desired boilerplate.

    Retrieves the lists of files to be validated and tests each one in turn.
    If all files contain correct boilerplate, this function terminates
    normally. Otherwise it prints the name of each non-conforming file and
    exists with a non-zero status code.
    """
    regexs = get_regexs()
    refs = get_refs(args)
    filenames = get_files(refs.keys(), args)
    nonconforming_files = []
    for filename in filenames:
        if not has_valid_header(filename, refs, regexs):
            nonconforming_files.append(filename)
    if nonconforming_files:
        print('%d files have incorrect boilerplate headers:' % len(
            nonconforming_files))
        for filename in sorted(nonconforming_files):
            print(os.path.relpath(filename, args.rootdir))
        sys.exit(1)


if __name__ == "__main__":
    ARGS = get_args()
    main(ARGS)
