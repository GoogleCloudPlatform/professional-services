# Firewall Enforcer

Automatic firewall removal.  This tool watches all new firewall rules, and if a rule has an illegal pattern, it gets deleted immediately.

# To deploy

Fill out the `.tfvars` file, and then apply the Terraform:

```bash
terraform init
terraform apply -var-file .tfvars
```

This will deploy:

- Asset Inventory Feed
- Cloud Function
- PubSub Topic
- Org IAM for the Cloud Function to perform firewall deletion (roles/compute.securityAdmin)

# Design

A Cloud Asset Inventory Feed watches for newly created firewall rules.  Each creation will trigger a Cloud Function that inspects the firewall rule.  If the rule has an illegal pattern, the Cloud Function will log it & delete it.

# Configuration

Implement the function in `main.py`: `should_delete(fw_rule: dict) -> bool`.  The current reference implementation will return `True` for any firewall rule that allows `0.0.0.0/0` in its source IP range. 
