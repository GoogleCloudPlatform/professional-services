<!--
Copyright 2022 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Overview

This repository demonstrates processing CSV files into
[Schema](https://beam.apache.org/documentation/programming-guide/#what-is-a-schema)
aware PCollections using [Apache Beam](https://beam.apache.org/) where we expect
different headers.

# Methodology

Two configuration inputs are assumed from the user of this code.
- a single file pattern source path
- a mapping of a header text to a Schema

Briefly described, a [Row](https://beam.apache.org/releases/javadoc/current/org/apache/beam/sdk/values/Row.html)
PCollection results from a [ContextualTextIO](https://beam.apache.org/releases/javadoc/current/org/apache/beam/sdk/io/contextualtextio/ContextualTextIO.html)
read from the single file pattern source input.  Each Row corresponds to a line
in all the ingested text files that match the single file pattern and represents
either a CSV header, CSV record or neither a header nor a record.  Subsequently,
CSV records are [join](https://beam.apache.org/releases/javadoc/current/org/apache/beam/sdk/schemas/transforms/Join.html)ed
with their corresponding headers.

As a final output, using the mapping of a header text to a Schema, we convert
each Row in the PCollection to new Row adhering to the mapped Schema.

We quarantine, within each step in the aforementioned algorithm, records that
associate with unmapped headers, records with header column mismatch, and
records without headers.

# Rationale

## What is the problem with CSV?

CSV is a textual representation of data.  Representing data in this textual
encoding provides flexibility, yet risks to systems that depend on such data.

These risks include:
- lack of informed type
- risk of mismatch between columns in a header and columns in a record
- lines in a file that are not representative of the data (i.e. some files
will contain a header or footer)
- empty lines
- multiple files in the same parent path may represent different data structures
i.e. different headers

## How does this solution solve the problem with CSV?

This example demonstrates, within an Apache Beam context, a method to process
multiple CSV files where we expect different headers and schema representations.
The result is a Schema aware PCollection that allows for the benefits of
informed data structures and types to downstream PTransforms.

## What does Schema aware mean?

A schema describes elements of a tuple that each adhere to a known data type.
Independent of a language or system, a Schema describes
(See [what-is-a-schema](https://beam.apache.org/documentation/programming-guide/#what-is-a-schema)):
- the name of the member of the tuple relation
- the data type of the member
- whether the member is required i.e. nullable

The corresponding representation of a data element adhering to a Schema is a Row.
In the context of Apache Beam, we can have a PCollection of Rows that are required
to adhere to a Schema.

Using this generic Row data representation yet coupled
to its adhered Schema allows us the flexibility of building PTransforms without
knowing the details of said Schema ahead of time.  This is what it means to be
Schema aware.

# Requirements

- [Java 11](https://www.java.com/en/)

# Usage

1. Define the [CSVIOReadConfiguration](src/main/java/com/google/example/csvio/CSVIOReadConfiguration.java)
with the source file pattern.
```
CSVIOReadConfiguration configuration = CSVIOReadConfiguration.builder()
    .setFilePattern("path/to/csv/files/*.csv")
    .build();
```

2. Read and process the CSV files, using [CSVIO.Read](src/main/java/com/google/example/csvio/CSVIO.java)
bundling the headers with the corresponding line records.
```
Pipeline p = ...;

CSVIO.Read.Result readResult = p.apply(
    "ReadCSV",
    CSVIO
        .read()
        .setConfiguration(configuration)
        .build()
    );
```

3. Process the resulting CSV records into a Row PCollection.

a. Define a header schema registry.

```
final static final Map<String, Schema> HEADER_SCHEMA_REGISTRY =
    new HashMap<>(){{
        this.put("column1,column2,column3", Schema.of(
            Schema.Field.of("column1", Schema.FieldType.STRING),
            Schema.Field.of("column2", Schema.FieldType.INT64),
            Schema.Field.of("column3", Schema.FieldType.BOOLEAN)
        ));
        
        this.put("column4,column5,column6", Schema.of(
            Schema.Field.of("column4", Schema.FieldType.STRING),
            Schema.Field.of("column5", Schema.FieldType.DOUBLE),
            Schema.Field.of("column6", Schema.FieldType.INT32)
        ));
    }};
```

b. Call the [CSVRecordToRow](src/main/java/com/google/example/csvio/CSVRecordToRow.java) transform.

```
CSVRecordToRow.Result csvRecordToRowResult = readResult.getSuccess().apply(
    "ParseCSV",
    CSVRecordToRow
        .builder()
        .setHeaderSchemaRegistry(HEADER_SCHEMA_REGISTRY)
        .build()
);
```

See [ExampleRead](src/main/java/com/google/example/ExampleRead.java) for
a working example.

# Running

## Local machine

Run the following command to execute the pipeline on your local machine.

```
./gradlew run -Pargs="--source=src/main/resources/com/google/example/*.csv --quarantine=/tmp/csvio/quarantine --sink=/tmp/csvio/output"
```

## Dataflow

### 1. Provision resources

Follow [infrastructure/README](infrastructure/README.md) for instructions on
deploying to [Google Cloud Dataflow](https://cloud.google.com/dataflow).

### 2. Execute the Dataflow Template

The result of the previous step provisioned all required Google Cloud
resources as well as a Custom Dataflow template to execute this pipeline.

#### 2.1 Create Dataflow Job From Template

Navigate to https://console.cloud.google.com/dataflow/createjob.

#### 2.2 Select Custom Template

Select `Custom Template` from the `Dataflow template` drop down menu.  Then,
click the `BROWSE` button and navigate to the bucket with the name that starts
with `dataflow-templates-`.  Within this bucket, select the json file object
that represents the template details.  For example, `exampleread-batch.json`
is the name of the bucket object containing the template details for the
Java implementation of the CSV IO Read example.

#### 2.3 Complete Dataflow Job template UI form

The Google Cloud console will further prompt for required fields such as Job
name and any required fields for the custom Dataflow template.

Below are suggestions based on [infrastructure/03.io](infrastructure/03.io)
where we created a copy of the Metropolitan Museum of Art BigQuery public dataset
into Google Cloud storage.

Source: gs://source-<changeme>/*.csv

Sink: gs://source-<changeme>/output

Quarantine: gs://source-<changeme>/quarantine

#### 2.4 Run the template

When you are satisfied by the values provided to the custom Dataflow template,
click the `RUN` button.

#### 2.5 Monitor the Dataflow Job

Navigate to https://console.cloud.google.com/dataflow/jobs to locate the job
you just created.  Clicking on the job will let you navigate to the job
monitoring screen.