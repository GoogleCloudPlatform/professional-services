# XSD to BigQuery schema generator
A tool aimed at parsing and generating a nested BigQuery table schema based on a given XSD schema. The tool is meant for use cases related to ingesting XML based data into BigQuery while maintaining the same nested structure.

## How it works
Given an XSD Schema representing XML data such as 
```
<?xml version="1.0" encoding="utf-8" ?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name='document'>
    <xs:complexType>
      <xs:sequence>
        <xs:element name='Customers'>
          <xs:complexType>
            <xs:sequence>
              <xs:element name='Customer' type='CustomerType' minOccurs='0' maxOccurs='unbounded' />
            </xs:sequence>
          </xs:complexType>
        </xs:element>
        <xs:element name='Orders'>
          <xs:complexType>
            <xs:sequence>
              <xs:element name='Order' type='OrderType' minOccurs='0' maxOccurs='unbounded' />
            </xs:sequence>
          </xs:complexType>
        </xs:element>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  <xs:complexType name='CustomerType'>
    <xs:sequence>
      <xs:element name='CompanyName' type='xs:string'/>
      <xs:element name='FullAddress' type='AddressType'/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name='AddressType'>
    <xs:sequence>
      <xs:element name='Address' type='xs:string'/>
      <xs:element name='City' type='xs:string'/>
      <xs:element name='Country' type='xs:string'/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name='OrderType'>
    <xs:sequence>
      <xs:element name='CustomerID' type='xs:token'/>
      <xs:element name='EmployeeID' type='xs:token'/>
      <xs:element name='ShipInfo' type='ShipInfoType'/>
    </xs:sequence>
  </xs:complexType>
  <xs:complexType name='ShipInfoType'>
    <xs:sequence>
      <xs:element name='ShipVia' type='xs:integer'/>
      <xs:element name='Freight' type='xs:decimal'/>
      <xs:element name='ShipName' type='xs:string'/>
    </xs:sequence>
  </xs:complexType>
</xs:schema>
```
The tool can convert the nested and repeated structure of the XML file represented in the above XSD into a JSON BigQuery schema, taking into consideration STRUCT, REPEATED fields and custom type definitions. Resulting JSON would look something like:

```
[{
	"name": "Customers",
	"type": "RECORD",
	"fields": [{
		"name": "Customer",
		"type": "RECORD",
		"fields": [{
			"name": "CompanyName",
			"type": "STRING"
		}, {
			"name": "FullAddress",
			"type": "RECORD",
			"fields": [{
				"name": "Address",
				"type": "STRING"
			}, {
				"name": "City",
				"type": "STRING"
			}, {
				"name": "Country",
				"type": "STRING"
			}]
		}],
		"mode": "REPEATED"
	}]
}, {
	"name": "Orders",
	"type": "RECORD",
	"fields": [{
		"name": "Order",
		"type": "RECORD",
		"fields": [{
			"name": "CustomerID",
			"type": "STRING"
		}, {
			"name": "EmployeeID",
			"type": "STRING"
		}, {
			"name": "ShipInfo",
			"type": "RECORD",
			"fields": [{
				"name": "ShipVia",
				"type": "DECIMAL"
			}, {
				"name": "Freight",
				"type": "DECIMAL"
			}, {
				"name": "ShipName",
				"type": "STRING"
			}]
		}],
		"mode": "REPEATED"
	}]
}]
```

## Setup
This project implements a setuptools `setup.py` file, you can install it into a Python environment by navigating to the root of the project and running `pip install .`.

## Usage
After install, you can run the command directly to generate the JSON schema into stdout or direct the output into a JSON file
```
xsd2bq \
    --root="Root" \
    --xsd_file="./tests/sample_data/customer_orders.xsd" \
    > schema.json
```
You can then use the `bq mk` command to generate a bq table from the generated schema via:

```
bq mk \
    --table \
    xml-ingest:xml_multistream_out.orders \
    schema.json
```

## Contributing
PRs related to adding features or fixing bugs for this tool are welcome and should follow the guidelines of the parent / host repository this tool is part of. At a minimum, all code contributed should be formatted to follow the Google python style guide for open source projects. The below checks can be run to ensure that along with the .pylintcr file included in this project.
```
flake8 --exclude=.git,__pycache__,.env,env --select=E9,F,C
pylint xsd2bq/*
python3 -m yapf -i -r --style="google" xsd2bq/*
```

Unit tests use the unittest module and are available under the tests/* directory, they can be run via
```
python -m unittest tests/*.py
```

## License
Apache 2.0

## Disclaimer
This project is not an official Google project. 