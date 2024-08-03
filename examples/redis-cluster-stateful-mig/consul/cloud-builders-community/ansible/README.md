# Ansible Cloud Builder
This builder is used to run ansible-playbooks or single Ansible commands.

## Usage
To execute Ansible command it need invetory which can be passed as parameters or as file inside git repository.
Playbook can also be stored in git repository.
### Single Ansible module execution
Gather facts from remote host and print hostname:
```yaml
- name: 'gcr.io/$PROJECT_ID/ansible'
  entrypoint: '/usr/bin/ansible'
  args:
  - all
  - -i
  - 192.168.22.10
  - -m
  - setup
  - -a
  - filter=ansible_hostname
```

### Playbook execution
Hosts file and the playbook must be stored in your git repository that is cloned by the builder.
In this example both host file and playbook file stored in repository root directory:
```yaml
- name: 'gcr.io/$PROJECT_ID/ansible'
  args:
  - -i
  - hosts
  - deploy.yaml
```

### Authentication
Ansible requires SSH access to remote servers which is usually done with SSH key.
This is an example of how execute playbook on servers secured with SSH key and stored in Cloud KMS ([read here how to encrypt data](https://cloud.google.com/cloud-build/docs/securing-builds/use-encrypted-secrets-credentials)). The key is stored in workspace directory to be passed between steps without using shared directory.
```yaml
# Decrypt ssh key
- name: gcr.io/cloud-builders/gcloud
  args:
  - kms
  - decrypt
  - --ciphertext-file=id_rsa.enc
  - --plaintext-file=id_rsa
  - --location=global
  - --keyring=[KEYRING-NAME]
  - --key=[KEY-NAME]
# Give correct permissions to ssh key
- name: 'gcr.io/$PROJECT_ID/ansible'
  entrypoint: 'sh'
  args:
  - -c
  - "chmod 400 id_rsa"
# Deploy configurations
- name: 'gcr.io/$PROJECT_ID/ansible'
  args:
  - -i
  - hosts
  - deploy.yaml
```
