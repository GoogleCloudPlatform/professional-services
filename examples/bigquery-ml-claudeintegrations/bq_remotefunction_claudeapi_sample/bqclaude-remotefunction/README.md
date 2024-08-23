# Sample Cloud Function HTTP Service for BigQuery remote function

This folder includes a full Java based Cloud Function HTTP service that can be used to connect a BigQuery remote function with Claude API.

In the parent folder, a couple of shell scripts are provided to take care of setting up the full solution. Refer to the Micronaut documentation to see the steps for testing and deploying this code manually.

## Micronaut 4.5.1 Documentation

- [User Guide](https://docs.micronaut.io/4.5.1/guide/index.html)
- [API Reference](https://docs.micronaut.io/4.5.1/api/index.html)
- [Configuration Reference](https://docs.micronaut.io/4.5.1/guide/configurationreference.html)
- [Micronaut Guides](https://guides.micronaut.io/index.html)
---

# Micronaut and Google Cloud Function

## Running the function locally

```cmd
./mvnw function:run
```

Now you can send an example request with:
```cmd
curl -d '{"calls":[["show me stats from klay thompson last year"]]}' \
    -H "Content-Type: application/json" \
    -X POST http://localhost:8080/
```
## Deploying the function

Preferrably, use the `setup.sh` script located in the parent folder, given that it also takes care of provisioning all the needed resources. In case of just wanting to deploy the function, follow the steps on the next section.

### Manual Deployment

First build the function with:

```bash
$ ./mvnw clean package
```

Then `cd` into the `target` directory (deployment has to be done from the location where the JAR lives):

```bash
$ cd target
```

Now run:

```bash
$ gcloud functions deploy bqclaude-remotefunction --entry-point io.micronaut.gcp.function.http.HttpFunction --runtime java17 --trigger-http
```

Choose unauthenticated access if you don't need auth.

To obtain the trigger URL do the following:

```bash
$ YOUR_HTTP_TRIGGER_URL=$(gcloud functions describe bqclaude-remotefunction --format='value(httpsTrigger.url)')
```

You can then use this variable to test the function invocation:

```bash
$ curl -i $YOUR_HTTP_TRIGGER_URL/bqclaude-remotefunction
```

- [Micronaut Maven Plugin documentation](https://micronaut-projects.github.io/micronaut-maven-plugin/latest/)
## Feature maven-enforcer-plugin documentation

- [https://maven.apache.org/enforcer/maven-enforcer-plugin/](https://maven.apache.org/enforcer/maven-enforcer-plugin/)


## Feature google-cloud-function documentation

- [Micronaut Google Cloud Function documentation](https://micronaut-projects.github.io/micronaut-gcp/latest/guide/index.html#simpleFunctions)


## Feature google-cloud-function-http documentation

- [Micronaut Google Cloud Function documentation](https://micronaut-projects.github.io/micronaut-gcp/latest/guide/index.html#httpFunctions)


## Feature micronaut-aot documentation

- [Micronaut AOT documentation](https://micronaut-projects.github.io/micronaut-aot/latest/guide/)


