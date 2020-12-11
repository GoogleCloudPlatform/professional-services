#!/usr/bin/env python3

#   Copyright 2020 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import os
from xml.etree import ElementTree
from xml.dom.minidom import parseString
from lxml import etree

from json2xml import json2xml
from google.cloud import bigquery


def bigquery_to_xml(query, custom_root_node="results", custom_row_tag="row"):
    """ Executes a BQ query and returns the output as an XML string.

    Args:
      query: The BigQuery query to execute
      custom_root_node: A string that serves as the root tag for the report. 
        For example, "sample" would return <sample>[query results]</sample>

      Returns:
        An XML string containing the BigQuery result.
    """

    # Construct a BigQuery client object.
    client = bigquery.Client()

    # Insert query here - this example demonstrates how this works on a public dataset
    query_job = client.query(query)  # Make an API request.

    # save the resultset as a python list (if very large, consider numpy array)
    records = [dict(row) for row in query_job]

    # convert to xml
    if custom_root_node:
        my_xml = json2xml.Json2xml(records,
                                   wrapper=custom_row_tag,
                                   attr_type=False).to_xml()
    else:
        my_xml = json2xml.Json2xml(records, attr_type=False).to_xml()

    # OPTIONAL - Remove empty tags
    matching_tags = []
    doc = etree.XML(my_xml)
    for element in doc.xpath("//*[not(node())]"):
        element.getparent().remove(element)

    # For repeated BQ fields: rename <item> tags
    # according to their parents' tag names
    for element in doc.xpath((".//item")):
        parent = element.getparent()
        element.tag = parent.tag
        if parent.tag not in matching_tags:
            matching_tags.append(parent.tag)

    # After renaming item tags, remove original parent tags,
    # which were only included to be used for naming in the previous step
    for tag in matching_tags:
        for element in doc.xpath((".//{0}".format(tag))):
            parent = element.getparent()
            if element.tag == parent.tag:
                parent.tag = "deleteme"

    etree.strip_tags(doc, "deleteme")

    # Change root
    doc.tag = custom_root_node


    # Convert to string
    my_xml = ElementTree.tostring(doc, method="xml")

    # Convert cleaned data to formatted XML
    my_xml = parseString(my_xml).toprettyxml()

    # Clean up whitespace
    my_xml = os.linesep.join([s for s in my_xml.splitlines() if s.strip()])

    # Optional - implement what you need to with the cleaned-up XML. Default just returns a string
    return my_xml
