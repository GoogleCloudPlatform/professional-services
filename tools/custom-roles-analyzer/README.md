<!--*
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
*-->
 
# Custom Role Analyzer

## Custom role analysis

While working with custom roles once created it is hard to find out if those roles are based out of any of the predefined roles.
In custom roles you will see a set of permissions as it is possible that many roles have common permissions.
 
This tool will provide useful insights with respect to custom roles at organization level as well as project level.
It will print results in file which contains following fields:
1. Custom Role - Name of the custom role.
2. Parent - Parent of the custom role. It can be an organization or project.
3. List of predefined roles - List of predefined roles by which this custom role is made of.
4. Additional permissions required - Any additional permission apart from predefined roles we need to rebuild this custom role.
5. No of additional permissions - Total number of additional permissions required to rebuild this custom role.
6. No of original permissions - Total number of permissions originally this custom role has.
7. Is Exact Match - If this custom role matches exactly to 1 or more predefined roles then it is set to True otherwise false.

It provides results in CSV or JSON format. Default is CSV.

## Role bindings analysis
 
To find role binding at each resource level run this tool with `--binding-analysis`. This tool will write results in separate `CSV` file which includes following fields:
1. Role - Any pre-defined or customer role.
2. Resource - Resource to which bindings are available.
3. Bindings - Bindings associated with resource and role.

 
# Getting Started
 
## Requirements:
* Java 11
* Maven 3
* GCP roles for custom role analysis - `roles/iam.organizationRoleViewer` and `roles/resourcemanager.folderViewer` at org level.
* GCP roles for bindings analysis - `roles/cloudasset.viewer` at org level.
* APIs to enable for custom role analysis - `Cloud Resource Manager API` needs to be enabled for the project from which the service account is created.
* APIs to enable for binding analysis - `Cloud Asset API` needs to be enabled for the project from which the service account is created.
 
Please set `export GOOGLE_APPLICATION_CREDENTIALS=<service-account.json>` before executing `analyze.sh` script.
 
 
 
## Building the Project
Build and package the entire project using the maven package command.
 
```
mvn clean install
```
 
This will create an executable jar inside the `target` folder which will be used from the `analyze.sh` script.
 
## Running the tool
Run following command:
```
analyze.sh --org <org_id> --format <format> --role-analysis --binding-analysis
```
Parameters: \
--org       : GCP Organization Id (mandatory parameter). \
--format    : Result format (optional parameter; defaults to csv and supports json). \
--role-analysis      : Run custom role analysis (Optional parameter; default to custom role analysis). \
--binding-analysis   : Run role binding analysis (Optional parameter; default to custom role analysis).
You can simply run as follows to get default format and custom role analysis:
```
analyze.sh --org <org_id>
```
 
You can run tool as follows to find the role bindings:
 
```
analyze.sh --org <org_id> --binding-analysis
```
 
To run both customer role analysis and binding analysis:
 
```
analyze.sh --org <org_id> --role-analysis --binding-analysis
```


## Assumptions
* It is assumed that custom roles do not have any "TESTING" stage permissions. If it does then those will be shown as `Additional permissions required` column in the result and `Is Exact Match` will be set to false.
