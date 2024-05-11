# [JMeter](https://jmeter.apache.org/) Container builder
This builder can be used to execute Apache JMeter tests 

## Building this builder
Run command below to build this builder

```bash
gcloud builds submit . --config=cloudbuild.yaml
```

## To execute a Apache JMeter tests
Create a cloud builder yaml file, see example below

```yaml
steps:
  - name: 'gcr.io/$PROJECT_ID/jmeter:latest'
    args:
    - '-n'
    - '-t'
    - 'sample.jmx'
```

In the example above sample.jmx file refers to Apache JMeter test plan. To execute the tests simply run command below. Note be sure to specify the yaml file name created in previous step

```bash
gcloud builds submit . --config={yaml}
```


