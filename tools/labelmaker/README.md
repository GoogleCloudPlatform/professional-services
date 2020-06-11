# LabelMaker

_labelmaker.py_ is a tool that reads key:value pairs from a json file and labels the running instance and all attached drives accordingly. It is designed to run on boot in a startup-script or userdata. Labels show up in billing exports to BigQuery, and allows organizations to run complex cost analysis over their cloud spend.

  **NOTE:** At the time of this document, labels are only supported in the Console and API.

## Usage

The package includes a DeploymentManager configuration that:

  - Create instance and attaches different disk types
  - Installs python dependencies
  - Creates a labels json file

Best practice would be to store labelmaker in a repo or bucket, and download via a startup script.

    ## Example run on instance
    $ ./labelmaker.py /tmp/labels.json
    Labels set on instances:instance-labelmaker
    Labels set on disks:instance-labelmaker
    Labels set on disks:instance-labelmaker-2
    Labels set on disks:instance-labelmaker-3

  **NOTE:** labelmaker will overwrite labels if they exist on the resource(s)

## Helpful links

  -  https://cloud.google.com/resource-manager/docs/using-labels
  -  https://cloud.google.com/compute/docs/label-or-tag-resources
