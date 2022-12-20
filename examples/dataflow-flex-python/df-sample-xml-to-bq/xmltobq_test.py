import glob
import json
import logging
import os

from apache_beam.testing.test_pipeline import TestPipeline
from apache_beam.testing.test_utils import TempDir
import pytest

import xmltobq

SAMPLE_XML = """<?xml version="1.0" encoding="utf-8"?> 
<Root xmlns="http://www.adventure-works.com">  
  <Orders>  
    <Order>  
      <CustomerID>TestUser</CustomerID>  
      <EmployeeID>6</EmployeeID>  
      <OrderDate>1997-05-06T00:00:00</OrderDate>  
      <RequiredDate>1997-05-20T00:00:00</RequiredDate>  
      <ShipInfo>
        <ShipVia>2</ShipVia>  
        <Freight>3.35</Freight>  
        <ShipName>Great Lakes Food Market</ShipName>  
        <ShipAddress>2732 Baker Blvd.</ShipAddress>  
        <ShipCity>Eugene</ShipCity>  
        <ShipRegion>OR</ShipRegion>  
        <ShipPostalCode>97403</ShipPostalCode>  
        <ShipCountry>USA</ShipCountry>  
      </ShipInfo>  
    </Order>
    <Order>  
      <CustomerID>GREAL</CustomerID>  
      <EmployeeID>8</EmployeeID>  
      <OrderDate>1997-07-04T00:00:00</OrderDate>  
      <RequiredDate>1997-08-01T00:00:00</RequiredDate>  
      <ShipInfo>  
        <ShipVia>2</ShipVia>  
        <Freight>4.42</Freight>  
        <ShipName>Great Lakes Food Market</ShipName>  
        <ShipAddress>2732 Baker Blvd.</ShipAddress>  
        <ShipCity>Eugene</ShipCity>  
        <ShipRegion>OR</ShipRegion>  
        <ShipPostalCode>97403</ShipPostalCode>  
        <ShipCountry>USA</ShipCountry>  
      </ShipInfo>  
    </Order> 
  </Orders>
</Root>"""


def test_xml_to_bq():
    test_pipeline = TestPipeline()

    with TempDir() as temp_dir:
        input_file = temp_dir.create_temp_file(".xml")
        with open(input_file, "w") as fd:
            fd.write(SAMPLE_XML)
        output_file = os.path.join(temp_dir.get_path(), "example.json")
        extra_opts = {'input': input_file, 'output': output_file}
        xmltobq.run(test_pipeline.get_full_options_as_args(**extra_opts))
        output_file = glob.glob(output_file + '*')[0]
        lines = open(output_file).read().splitlines()
        json_data = json.loads(lines[0].replace("'", '"'))
        assert len(lines) == 2
        assert json_data['CustomerID'] == "TestUser"


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    pytest.main()
