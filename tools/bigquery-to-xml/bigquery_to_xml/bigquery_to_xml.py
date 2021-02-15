"""
BigQuery-To-XML allows you to run an arbitrary BigQuery query and
download the result as an XML string.

To run the script, specify a query, and (optionally) custom root and row
tags. Note that the script assumes it is running on a machine that has the
appropriate permissions to run queries on your GCP project.

The result is returned as a string: to save the output it may be 
helpful to run "bq_to_xml.py > output.txt".
"""

# !/usr/bin/env python3

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
import xml

from json2xml import json2xml
import lxml.etree
from google.cloud import bigquery


def bigquery_to_xml(query, 
                    custom_root_node="results", 
                    custom_row_tag="row"):

    """ Executes a BQ query and returns the output as an XML string.

    Args:
      query: The BigQuery query to execute
      custom_root_node: A string that serves as the root tag for the report. 
        For example, "sample" would return <sample>[query results]</sample>
      custom_row_tag: Like root node, but to label individual BigQuery rows.

      Returns:
        An XML string representing the BigQuery result.
    """

    # Construct and query a BigQuery client object
    client = bigquery.Client()
    query_job = client.query(query)

    # Save the resultset as a python list (if very large, consider numpy array)
    records = [dict(row) for row in query_job]

    # Convert to XML
    if custom_root_node:
        my_xml = json2xml.Json2xml(records,
                                   wrapper=custom_row_tag,
                                   attr_type=False).to_xml()
    else:
        my_xml = json2xml.Json2xml(records, attr_type=False).to_xml()

    # Remove empty tags
    matching_tags = []
    doc = lxml.etree.XML(my_xml)
    for element in doc.xpath("//*[not(node())]"):
        element.getparent().remove(element)

    # For repeated BQ fields: rename generic <item> tags to match their parents
    for element in doc.xpath((".//item")):
        parent = element.getparent()
        element.tag = parent.tag
        if parent.tag not in matching_tags:
            matching_tags.append(parent.tag)

    # After renaming parent tags, mark and remove original generic tags
    for tag in matching_tags:
        for element in doc.xpath((".//{0}".format(tag))):
            parent = element.getparent()
            if element.tag == parent.tag:
                parent.tag = "deleteme"

    lxml.etree.strip_tags(doc, "deleteme")

    # Change root tag
    doc.tag = custom_root_node

    # Convert to string
    my_xml = lxml.etree.tostring(doc, method="xml")

    # Convert cleaned data to formatted XML
    my_xml = xml.dom.minidom.parseString(my_xml).toprettyxml()

    # Clean up whitespace
    my_xml = os.linesep.join([s for s in my_xml.splitlines() if s.strip()])

    # Optional - implement what you need to with the cleaned-up XML. 
    # Default returns the generated report as a string
    return my_xml
