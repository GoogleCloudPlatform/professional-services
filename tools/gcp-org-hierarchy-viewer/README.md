# GCP Organization Hierarchy Viewer

This tool, called `gcpohv` (for GCP org hierarchy viewer), displays an organization structure in your CLI, and also includes IDs for easy reference.  It starts from a node in the hierarchy–either an organization or a folder.

## Requirements

* Python 3.5+
* UTF-8-capable terminal

The running user/service account will need to have at least the following roles granted:

* Folder Viewer
* Organization Viewer

## Installation

#### Installing directly from GitHub with pip

```bash
pip3 install 'git+https://github.com/GoogleCloudPlatform/professional-services.git#egg=gcp-org-hierarchy-viewer&subdirectory=tools/gcp-org-hierarchy-viewer'
```

#### Installing from a local clone

Clone the repository, `cd` in, and install:

```bash
git clone https://github.com/GoogleCloudPlatform/professional-services.git
```

```bash
cd tools/gcp-org-hierarchy-viewer
```

```bash
pip3 install .
```

## Use

Run `gcpohv` on your org:

```text
gcpohv -o example.com
```

```text
gcpohv -o example.com
🏢 example.com (1234567890)
 +-- 📁 foo (0987654321)
 |   +-- 📦 ham-project
 |   +-- 📦 spam-project
 |   +-- 📦 eggs-project
 +-- 📁 bar (0987654321)
     +-- 📦 bread-project
     +-- 📦 mustard-project
     +-- 📁 baz (0987654321)
     |   +-- 📁 quux (0987654321)
     |   |   +-- 📦 ketchup-project
     |   +-- 📁 flux (0987654321)
     |       +-- 📦 dijon-project
     |       +-- 📦 mayonaise-project
     |       +-- 📦 coffee-project
     |       +-- 📦 sugar-project
     +-- 📦 pickles-project
     +-- 📦 ham-sandwiches-project
```

If you need some help:

```bash
gcpohv --help
```

```text
usage: gcpohv [-h] [-k KEY_FILE] [--use-id] [-o ORGANIZATION | -f FOLDER]

optional arguments:
  -h, --help            show this help message and exit
  -k KEY_FILE, --key-file KEY_FILE
                        Path to service account credentials. If you chose to
                        omit this, SDK will fall back to default credentials
                        and possibly spew warnings.
  --use-id              if supplied, searches on org id instead of name
  -o ORGANIZATION, --organization ORGANIZATION
                        organization name to use for search
  -f FOLDER, --folder FOLDER
                        folder ID to use for search
```
