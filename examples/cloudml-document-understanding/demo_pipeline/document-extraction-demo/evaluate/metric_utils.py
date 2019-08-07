#!/usr/bin/python2
# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Utilities to check if fields are equal."""

import abc
import re


DEFAULT_OMIT_CHARACTERS = ['.', ':', ',', '(', ')', '[', ']']


class DefineFieldEquality(object):

    @abc.abstractmethod
    def __init__(self, kwargs):
        return

    @abc.abstractmethod
    def is_equal(self, value_truth, value_extracted):
        return


class GeneralEquality(DefineFieldEquality):

    def __init__(self, list_omit_characters=DEFAULT_OMIT_CHARACTERS):
        self._omit_characters = list_omit_characters

    def _remove_ommited_characters(self, text):
        for char in self._omit_characters:
            text = text.replace(char, ' ')
        text = re.sub('\s+', ' ', text).strip()
        return text

    def is_equal(self, value_truth, value_extracted):

        # TODO: Clean exception handling (None or non-string)
        if value_truth is None:
            if value_extracted is None:
                return True
            else:
                return False
        if value_extracted is None:
            return False
        
        if isinstance(value_truth, float):
            value_truth = str(value_truth)
        if isinstance(value_extracted, float):
            value_extracted = str(value_extracted)

        value_truth = value_truth.lower()
        value_extracted = value_extracted.lower()
        value_truth = self._remove_ommited_characters(value_truth)
        value_extracted = self._remove_ommited_characters(value_extracted)
        return value_truth == value_extracted


class DateEquality(DefineFieldEquality):
    ## To Implement
    pass


class Postprocessing(object):

    @abc.abstractmethod
    def process(self, text):
        return


class PostprocessClassification(Postprocessing):
    """Posprocessor to remove the OCR issues on classification.

    Example usage:
    21100 --> 21/00
    7104 --> 7/04
    3117088 --> 31/7088

    Logic used:
    If the result does not contain '/', Look for a 1 in position
       [-2, -3, -4, -5] and replace by a '/'.
    """

    def process(self, text):
        
        if not text:
            return None
        if isinstance(text, float):
            text = str(text)

        text = text.replace('O', '0')

        if '/' in text:
            return text
        
        for index in [-2, -3, -4, -5]:
            if len(text) < (-index):
                continue
            if text[index] == '1':
                new_text = text[:index] + '/' + text[(index+1):]
                return new_text

        return text


EQUALITY_FN_MAP = {}
POSTPROCESS_FN_MAP = {
    'PostprocessClassification': PostprocessClassification()}
DEFAULT_EQUALITY_FN = GeneralEquality()


def parse_field_config(config_field_extracted):
    """Parses the configuration part related to field extracted.
    
    Args:
      config_field_extracted: a dictionary with required key 'field_name'
        and optional keys 'postprocess_fn' and 'equality_fn'.
        This is typically one element of the config file.

    Returns:
      Tupe of (field_name, postprocess_fn, equality_fn)
        where postprocess_fn is `Postprocessing` instance and equality_fn is
        a `DefineFieldEquality` instance.

    Raises;
     ValueError if config is not properly formatted.
    """

    if 'field_name' not in config_field_extracted:
        raise ValueError('Config file is not properly formatted, field_name is required.')
    field_name = config_field_extracted['field_name']

    if 'postprocess_fn' in config_field_extracted:
        postprocess_fn_info = config_field_extracted['postprocess_fn']
        if postprocess_fn_info in POSTPROCESS_FN_MAP:
            postprocess_fn = POSTPROCESS_FN_MAP[postprocess_fn_info]
        else:
            raise ValueError('Postprocess_fn `{}` can not be found in POSTPROCESS_FN_MAP'.format(
                postprocess_fn_info))
    else:
        postprocess_fn = None

    if 'equality_fn' in config_field_extracted:
        equality_fn_info = config_field_extracted['equality_fn']
        if equality_fn_info in EQUALITY_FN_MAP:
            equality_fn = EQUALITY_FN_MAP[equality_fn]
        else:
            raise ValueError('Equality_fn {} can not be found by EQUALITY_FN_MAP {}'.format(
                equality_fn_info))
    else:
        equality_fn = DEFAULT_EQUALITY_FN

    return field_name, postprocess_fn, equality_fn