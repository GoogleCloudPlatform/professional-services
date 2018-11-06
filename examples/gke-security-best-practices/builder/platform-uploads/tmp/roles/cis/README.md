# Ansible role for hardening Ubuntu 14.04

```Based on CIS  CIS Ubuntu Linux 14.04 LTS Benchmark v2.0.0 - 09-30-2016
2018 prepared by Gordon Young gjyoung1974@gmail.com
```

## Manual installation

Install dependencies on your host (on Ubuntu 14.04):

```bash
$ sudo apt-get install python-pip git python-dev
$ sudo pip install ansible markupsafe
```

Create a placeholder to describe your machine:

```bash
$ mkdir -p ansible/roles-ubuntu/roles
$ cd ansible/roles-ubuntu
$ git clone https://github.com/gjyoung1974/cis-ubuntu-14-04-2-0.git roles/cis
```

Create a playbook in the _roles-ubuntu_ folder:

```bash
$ cat >>  playbook.yml << 'EOF'
---
- hosts: all
  roles:
    - cis
EOF
```

### Running the role

Replace the target information (USER, IPADDRESS) and run the playbook with a version of ansible higher than 1.8:

   $ ansible-playbook -C -b -u <Username> -b --ask-become-pass -i 'IPADDR,' playbook.yml

Note that this command will perform modifications on the target. Add the `-C` option to only check for modifications and audit the system. However, some tasks cannot be audited as they need to register a variable on the target and thus modify the system.

