# Schema Converter
Converts Oracle schema to BigQuery json schema. Later, json schemas are used by terraform to create the tables.
This code, 
1. reads table schemas from an oracle database
2. converts the datatypes to BigQuery types
3. generates BigQuery schema files in JSON
4. generates terraform variables to be used by the [BigQuery module](https://github.com/terraform-google-modules/terraform-google-bigquery) to be inserted in [terraform.tfvars](https://github.com/terraform-google-modules/terraform-google-bigquery/blob/master/examples/multiple_tables/terraform.tfvars)


## Edit terraform_table_variable.jinja2 
If you need labels on tables  or any other modification you can edit in terraform_table_variable.jinja2
After creating the schemas as well as the terraform variables, you can edit those before applying via terraform.

## Usage
We have added a dockerfile to ease setting up the environment. 
You may use that if you don't have time to install oracle client libraries.

```sh
# If you don't want to spend time to install oracle client libraries use our dockerfile
docker build -t ora2bq:latest .
# the below command runs the container and opens a bash shell
docker run -v $PWD:/schema_converter --rm -it ora2bq:latest

#either continue from the docker container or from your commandline if you have oracle client installed.
pipenv install
pipenv shell

# to see the help
python ora2bq_convert.py --help

# example runs with connection string
python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s HR -t D% -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars
python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s H% -t % -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars
python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s % -t % -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars
python ora2bq_convert.py -c 'db_username/db_password@IP_or_HOSTNAME/DB_SERVICE_NAME' -s HR -t "DEPARTMENTS,TEST,REGIONS,JOBS" -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tf

# an example run if you need to provide SID
# first fill the dsn.txt
python ora2bq_convert.py --dsn-file dsn.txt -u db_username -p db_password -s HR -t D% -o example_terraform_dir/schemas -tf example_terraform_dir/terraform.tfvars 
```

Note that db_username needs select access on ALL_TABLES and ALL_TAB_COLUMNS views.

After generating the [terraform.tfvars](./example_terraform_dir/terraform.tfvars), you need to change the relative path with a simple find and replace of  text `CHANGE_ME`.

## Mac Users
If you get "xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /<br/>Library/Developer/CommandLineTools/usr/bin/xcrun" error run:<br/>
``` sudo xcode-select --install ```<br/>
or<br/>
``` sudo xcode-select --reset ```<br/>
<br/>
In macOS, You might see the following error :<br/>
sqlalchemy.exc.DatabaseError: (cx_Oracle.DatabaseError) ORA-21561: OID generation failed<br/>
This is caused by the macOS hostname under “sharing” not matching the name in /etc/hosts<br/>
Run hostname to get the name of the mac :<br/>
Synerty-256:build-web jchesney$ hostname<br/>
syn256.local<br/>
Confirm that it matches the hostnames for 127.0.0.1 and ::1 in /etc/hosts :<br/>
Synerty-256:build-web jchesney$ cat /etc/hosts<br/>
```
##
# Host Database
#
# localhost is used to configure the loopback interface
# when the system is booting.  Do not change this entry.
##
127.0.0.1       localhost syn256.local
255.255.255.255 broadcasthost
::1             localhost syn256.local
```