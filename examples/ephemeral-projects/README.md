# Google Ephemeral Projects

* [python/](./python) 
  * [.python-version](./python/.python-version)
  * [bindings.json](./python/bindings.json)
  * [main.py](./python/main.py)
  * [project_deletion_example.py](./python/project_deletion_example.py)
  * [project_deployment_example.py](./python/project_deployment_example.py)
  * [requirements.txt](./python/requirements.txt)
* [.gitignore](./.gitignore)
* [README.md](./README.md)

## python/
The python folder contains the EphemeralInstance module and associated usage examples. The EphemeralInstance module can be used to deploy and destroy projects, enable services, and bind principles to the deployed projects.

Available methods:
* various get methods for project metadata
* deploy_project() - creates an ephemeral project. Requires project owner information, gcp credentials, and an organization id. Optionally a project_id can be passed in to override the random project id generation.
* destroy_project() - deletes an ephemeral project. Requires project owner information, project name/number, gcp credentials, and an organization id.
* set_owner() - sets the owner email of the project and assigns a highly privledged role to the owner. Requires project owner information, project name/number, gcp credentials, and an organization id.
* add_iam() - adds an arbitrary number of role bindings to the project. Requires project owner information, project name/number, gcp credentials, add_iam_bindings_json, and an organization id.
* remove_iam() - removes an arbitrary number of role bindings to the project. Requires project owner information, project name/number, gcp credentials, remove_iam_bindings_json, and an organization id.
* enable_services() - enables gcp services on the project. Expects a list of strings. Requires project owner information, project name/number, gcp credentials, and an organization id. 