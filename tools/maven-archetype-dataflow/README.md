# Maven Archetype Dataflow

This archetype bootstraps a Dataflow project with common plugins pre-configured
to help maintain high code quality.


## Plugins
[Maven Checkstyle Plugin](https://maven.apache.org/plugins/maven-checkstyle-plugin) - Generates a report
regarding the code style used by the developers

[Maven Dependency Plugin](https://maven.apache.org/plugins/maven-dependency-plugin) - Analyzes the
dependencies of the project and determines which are: used and declared; used and undeclared; unused
and declared.

[Maven Enforcer Plugin](https://maven.apache.org/enforcer/maven-enforcer-plugin) - Provides goals to
control certain environmental constraints such as Maven version, JDK version and OS family along with
many more built-in rules and user created rules.

[Maven License Plugin](https://www.mojohaus.org/license-maven-plugin/index.html) - Manages the license
of the project and its dependencies (update file headers, download dependencies licenses, check
third-party licenses, ...)

[Maven Site Plugin](https://maven.apache.org/plugins/maven-site-plugin) - The Site Plugin is used to
generate a site for the project. The generated site also includes the project's reports
that were configured in the POM.

[Maven Surefire Plugin](https://maven.apache.org/surefire/maven-surefire-plugin) - The Surefire Plugin is used
during the test phase of the build lifecycle to execute the unit tests of an application. It generates
reports in two different file formats Plain text files (.txt) XML files (.xml)

[Maven Versions Plugin](http://www.mojohaus.org/versions-maven-plugin) - The Versions Plugin is used to
manage the versions of artifacts in a project's POM.

[OpenClover](http://openclover.org/index) - The OpenClover plugin measures code coverage for Java and
Groovy and collects over 20 code metrics. It not only shows you untested areas of your application
but also combines coverage and metrics to find the most risky code.

[PMD](https://pmd.github.io) - The PMD plugin is a source code analyzer. It finds common programming
flaws like unused variables, empty catch blocks, unnecessary object creation, and so forth.

[Spotbugs](http://spotbugs.readthedocs.io/en/stable) - The Spotbugs plugin uses static
analysis to look for bugs in Java code. This check is run at compile time and will block the build if
potential bugs are found.


## Getting Started

### Requirements

* Java 8
* Maven 3

### Installing the archetype

Builds the archetype and installs into the local archetype catalog.
```sh
# Clone the repo
git clone https://github.com/GoogleCloudPlatform/professional-services.git

# Change directory into the archetype project
cd professional-services/tools/maven-archetype-dataflow

# Install the archetype into your local archetype catalog
mvn clean install archetype:update-local-catalog
```

### Using the archetype

Bootstraps a new project using the archetype.
```sh
mvn archetype:generate                             \
  -DarchetypeGroupId=com.google.cloud.pso          \
  -DarchetypeArtifactId=maven-archetype-dataflow   \
  -DarchetypeVersion=1.2                           \
  -DgroupId=<groupId>                              \
  -DartifactId=<artifactId>
```

### Running verifications

Execute the following command in the root of your new project to run all
verification checks. It is recommended to use this command as
part of your CI/CD process or within your development workflow so code is
verified before it is officially admitted into the master branch of your repo.
```sh
mvn verify
```


## License Generation

By default, the projects which this archetype generates will include a plugin
which attaches the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
license to every source file.

### Changing the License

To change the default license which the archetype generates:

1. Change the [LICENSE](src/main/resources/archetype-resources/LICENSE) file to
the desired license
1. Change the license header generated on source files by modifying the
[license-header.txt](src/main/resources/archetype-resources/src/license/license-header.txt)
file within the archetype-resources

### Removing License Generation

If your organization doesn't require licenses on source files, you can remove
the licensing from archetype generation entirely:

1. Remove the [LICENSE](src/main/resources/archetype-resources/LICENSE) file
from the archetype-resources
1. Remove the [src/license](src/main/resources/archetype-resources/src/license)
folder
1. Remove the `license-maven-plugin` from the
[pom.xml](src/main/resources/archetype-resources/pom.xml) file


## Code Coverage

The archetype includes a plugin for [OpenClover](http://openclover.org/index)
which by default will check that code coverage is above a target percentage of
`70%`. For some projects this may not be achievable. If you would like to change
the code coverage target, modify the `project.test.coverage.targetPercentage`
property within the [pom.xml](src/main/resources/archetype-resources/pom.xml)
file in archetype-resources or within the generated pom.xml file.




