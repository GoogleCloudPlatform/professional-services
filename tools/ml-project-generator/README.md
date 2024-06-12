python3 -m cookiecutter .

# AI/ML Project Boilerplate

## What's Included?
* Standard Template for any AI/ML Project 
* All necessary tools for Dev & Test
* Best Practices implemented
* Use virtualenv for local dev as well as Workbench
* Creates Project as a Python Library & installs in Dev mode
* Only Packages necesaary for Production are in requirements.txt, rest in setup.py
* Use pre-commit hooks for clean code practices & checks.
* Precommit will auto-format code & check for license files [can add custom checks]
* pyproject.toml file has settings for all packages
* gitignore has all necessary rules for git
* Config files are in YAML and config.py handles basic setup including logging
* main.py is the entrypoint and can be run from CLI directly using Fire library
* mkdocs for creating documentation from Docstrings
* pytest executes all tests in the _tests folder


## How to Use?
* Install [Cookiecutter](https://github.com/cookiecutter/cookiecutter) globally:
```bash
python3 -m pip install cookiecutter
```
* Option 1 - Use directly from Github:
```bash
python3 -m cookiecutter git+<github path to template>
```
* Option 2 - Download template and run:
```bash
python3 -m cookiecutter <local path to template>
```
* Anser the questions that are prompted
* On completion you get a fully setup Project
* Navigate to the README.md in the Project folder and execute the steps

## Examples?
* Check out the Examples directory for Sample projects using thi Project structure
