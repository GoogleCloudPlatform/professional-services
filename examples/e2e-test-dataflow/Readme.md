# Running End-to-End test for Dataflow pipelines

We all know testing dataflow applications is important. But when building data ingestion and transformation, sometimes thing gets too technical and hence stakeholders like analyst, data scientist have no visibility on what test are being performed. In this sample code. We run E2E test in Dataflow using cucumber. Cucumber is a BDD tool available on the JVM. Cucumber uses `Gherkin language` to write the test scenarios and hence everyone can contribute.

Note: The Dataflow that we test in this E2E test is [here](https://github.com/bipinupd/professional-services/tree/dataflow-cloud-run/examples/dataflow-cloud-run/dataflowApp). Modify the pom to upload the artifact in GCS bucket or download from the artifact repository where your build system uploads the artifact(such as artifactory/JFrog).

Using Cucumber, we can specify the expected behaviour by defining features and scenarios. The feature describes a feature of your application, and the scenarios describe different ways users can use this feature.Features are defined in `.feature` files, which are stored in the `src/test/resources/` directory. In this example, we have a feature file called `dataflow-e2e-test.feature`.

Below is the snippet of the feature and the description. Based on this description, anyone can infer that the feature performs the smoke test of the Dataflow application

```
Feature: Smoke test GoBikeToGCS Dataflow
  End to End testing for the Dataflow GCS to BQ
```
## Creating a Scenario

Scenarios are added to the feature file, to define examples of the expected behaviour. These scenarios can be used to test the feature. Start a scenario with the Scenario keyword and add a brief description of the scenario. To define the scenario, you have to define all of its steps.
### Defining Steps

These all have a keyword (Given, When, and Then) followed by a step. The step is then matched to a step definition, which map the plain text step to programming code.
The plain text steps are defined in the Gherkin language. Gherkin allows developers and business stakeholders to describe and share the expected behaviour of the application.
The feature file contains the Gherkin source.
- The `Given` keyword precedes text defining the context; the known state of the system (or precondition).
- The `When` keyword precedes text defining an action.
- The `Then` keyword precedes text defining the result of the action on the context (or expected result).


Below is an example of a scenario and the steps from `dataflow-e2e-test.feature` file

```
  Background:
  Scenario: Download the jar to test
    Given A jar at URL "gs://<<bucket>>/snapshot/com/demo/dataflow-app/1.0-SNAPSHOT/bikeshare-csv-to-bq-1.0-SNAPSHOT.jar"
    When Download the jar to "data/code/" as "dataflow.jar"
    Then Check the jar is downloaded successfully
```

## Running the test
To run the tests from JUnit we need to add a runner to our project. For example in this sample the file is the `RunCucumberTest.java` in `src/test/java/e2etest` directory.

You can now run your test by running this class. Before running the test please change the parameters in `dataflow-e2e-test.feature`. Make sure the project, and service account are present then run the test. The test creates the input bucket and temp GCS bucket.

Changes required in feature file


|    Name   |   Description   |
|:-------------:|:-------------:|
|<<PROJECT_ID>> | Project Id where you are running the dataflow application |
|<<TEMP_GCS_BUCKET>> | Temporary location required by Dataflow application |
|<<INPUT_GCS_BUCKET>>| GCS bucket where the raw .csv files are uploaded |


The service account pointed by `GOOGLE_APPLICATION_CREDENTIALS` should be able invoke the dataflow and create buckets in GCS and create BigQuery dataset in the project.

 `export GOOGLE_APPLICATION_CREDENTIALS=<<file-path-service-account>`

`mvn test`