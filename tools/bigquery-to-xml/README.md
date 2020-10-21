# BigQuery to XML Conversion
This simple Python script allows you to take the output of a BigQuery query and convert the output into an XML file. This works best with nested and repeated fields and contains some customizations like custom root nodes.


## User Guide

This tool assumes it will be run by an entity with the appropriate permissions to query BigQuery and that the default project has been configured.

In v1 the tool only returns the XML report as a string, leaving it up to the user what to do with it. 

### Tips for Query Formatting 
The easiest way to create a report is to include all of the report’s information in one denormalized row in BigQuery. 
This allows you to define the names of your repeated fields - rows are represented as repeated fields under the <item/> tag.
To map the relationship between parent and child tags, use nested fields;
Repeated fields should be used when there are multiple instances of the same tag;

#### Example XML Schema:
```
<header/>
  <transaction>
    <item1/>
    <item2/>
  </transaction>
  <transaction>
    <item1/>
    <item2/>
  </transaction>
<footer/>
```
#### Example BQ Schema:
header | STRING | NULLABLE
transaction | RECORD | REPEATED
transaction.item1 | STRING | NULLABLE
transaction.item2 | STRING | NULLABLE
footer | STRING | NULLABLE
