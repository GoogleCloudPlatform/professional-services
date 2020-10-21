"""
   Copyright 2020 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

"""

import os
import xml.etree.ElementTree as ET
from xml.dom.minidom import parseString
import lxml.etree as etree

from json2xml import json2xml
from google.cloud import bigquery

def bigquery_to_xml(query, custom_root_node=False):
    """ Executes a BQ query and returns the output as an XML string.

    Args:
      query: The BigQuery query to execute
      custom_root_node: A string that serves as the root tag for the report. 
        For example, "sample" would return <sample>[query results]</sample>

      Returns:
        An XML string containing the BigQuery result.
    """

    # print("Installing python packages")
    # os.system("pip3 install json2xml google-cloud-bigquery lxml dicttoxml")

    # print("Setting Google App Credentials")
    # os.system('export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials/file.json"')

    # Construct a BigQuery client object.
    client = bigquery.Client()

    # Insert query here - this example demonstrates how this works on a public dataset
    query_job = client.query(query)  # Make an API request.

    # save the resultset as a python list (if very large, consider numpy array)
    records = [dict(row) for row in query_job]

    # convert to xml
    if custom_root_node:
        my_xml = json2xml.Json2xml(records, wrapper=custom_root_node, attr_type=False).to_xml()
    else:
        my_xml = json2xml.Json2xml(records, attr_type=False).to_xml()

    # OPTIONAL - Remove empty tags
    matching_tags = []
    doc = etree.XML(my_xml)
    for element in doc.xpath("//*[not(node())]"):
        element.getparent().remove(element)

    # For repeated BQ fields: rename <item> tags
    # # according to their parents' tag names
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

    # Convert to string
    my_xml = etree.tostring(doc)

    # Remove root node
    removeRoot = ET.fromstring(my_xml)[0]
    my_xml = ET.tostring(removeRoot, method="xml")

    # Convert cleaned data to formatted XML
    my_xml = parseString(my_xml).toprettyxml()

    # Clean up whitespace
    my_xml = os.linesep.join([s for s in my_xml.splitlines() if s.strip()])

    # TODO - implement what you need to with the cleaned-up XML
    print(my_xml)

# Example implementation below:

#_QUERY = """
# SELECT * EXCEPT (item)
# FROM `bigquery-public-data`.wikipedia.wikidata
# LIMIT 1"""
# bigquery_to_xml(_QUERY,_CUSTOM_ROOT_NODE)
