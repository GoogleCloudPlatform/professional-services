# Spring Boot based Hello World app with Oauth2

This sample shows how to run a [Spring Boot][spring-boot] application on [Google
Cloud Platform][cloud-java] with Oauth2. It uses the [Google App Engine flexible
environment][App Engine-flexible].

[App Engine-flexible]: https://cloud.google.com/appengine/docs/flexible/
[cloud-java]: https://cloud.google.com/java/
[spring-boot]: http://projects.spring.io/spring-boot/


## Before you begin

This sample assumes you have [Java 8][java8] installed.

[java8]: http://www.oracle.com/technetwork/java/javase/downloads/

### Download Maven

These samples use the [Apache Maven][maven] build system. Before getting
started, be sure to [download][maven-download] and [install][maven-install] it.
When you use Maven as described here, it will automatically download the needed
client libraries.

[maven]: https://maven.apache.org
[maven-download]: https://maven.apache.org/download.cgi
[maven-install]: https://maven.apache.org/install.html

### Create a Project in the Google Cloud Platform Console

If you haven't already created a project, create one now. Projects enable you to
manage all Google Cloud Platform resources for your app, including deployment,
access control, billing, and services.

1. Open the [Cloud Platform Console][cloud-console].
1. In the drop-down menu at the top, select **Create a project**.
1. Give your project a name.
1. Make a note of the project ID, which might be different from the project
   name. The project ID is used in commands and in configurations.

[cloud-console]: https://console.cloud.google.com/

### Enable billing for your project.

If you haven't already enabled billing for your project, [enable
billing][enable-billing] now.  Enabling billing allows the application to
consume billable resources such as running instances and storing data.

[enable-billing]: https://console.cloud.google.com/project/_/settings

### Install the Google Cloud SDK.

If you haven't already installed the Google Cloud SDK, [install and initialize
the Google Cloud SDK][cloud-sdk] now. The SDK contains tools and libraries that
enable you to create and manage resources on Google Cloud Platform.

[cloud-sdk]: https://cloud.google.com/sdk/

### Install the Google App Engine SDK for Java


```
gcloud components update app-engine-java
gcloud components update
```

### Configure the `app.yaml` descriptor

The [`app.yaml`][app-yaml] descriptor is used to describe URL
dispatch and resource requirements.  This example sets
[`manual_scaling`][manual-scaling] to 1 to minimize possible costs.
Dont change the manual scaling to anything other than 1 , unless you refactor to code to have a shared session store.
These settings should be revisited for production use.

[app-yaml]: https://cloud.google.com/appengine/docs/flexible/java/configuring-your-app-with-app-yaml
[manual-scaling]: https://cloud.google.com/appengine/docs/flexible/java/configuring-your-app-with-app-yaml#manual-scaling
[oauth-steps]: https://cloud.google.com/java/getting-started/authenticate-users

## Change the OAuth client settings
Follow the instructions as described [here][oauth-steps]

Also add `http://[YOUR_PROJECT_ID].appspot.com/login`, `https://[YOUR_PROJECT_ID].appspot.com/login` and `http://localhost:8080/login` the Authorized redirect URIs 

Change the clientId and clientSecret in `src/main/resources/application.yml` 

## Run the application locally

1. Set the correct Cloud SDK project via `gcloud config set project
   YOUR_PROJECT` to the ID of your application.
1. Run `mvn spring-boot:run`
1. Visit http://localhost:8080

## Deploy to App Engine flexible environment

1. `mvn appengine:deploy`
1. Visit `http://YOUR_PROJECT.appspot.com`.
* if this is the first deployment, the above mvn command will fail. 
  You will need to run `gcloud app create --region <region>` or create the app from the console , to create the app first and rerun the above maven command.
 Ig you encounter issue, try running `gcloud init` and follow the steps.

Note that deployment to the App Engine flexible environment requires the new
[`com.google.cloud.tools:appengine-maven-plugin` plugin][new-maven-plugin].

[new-maven-plugin]: https://cloud.google.com/appengine/docs/flexible/java/using-maven

Java is a registered trademark of Oracle Corporation and/or its affiliates.

