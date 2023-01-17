# Google Cloud Billing Budget Module

This module allows creating a Cloud Billing budget for a set of services and projects.

To create billing budgets you need one of the following IAM roles on the target billing account:

* Billing Account Administrator
* Billing Account Costs Manager

## Examples

### Simple email notification

Send a notification to an email when a set of projects reach $100 of spend.

```hcl
module "budget" {
  source          = "./fabric/modules/billing-budget"
  billing_account = var.billing_account_id
  name            = "$100 budget"
  amount          = 100
  thresholds = {
    current    = [0.5, 0.75, 1.0]
    forecasted = [1.0]
  }
  projects = [
    "projects/123456789000",
    "projects/123456789111"
  ]
  email_recipients = {
    project_id = "my-project"
    emails     =  ["user@example.com"]
  }
}
# tftest modules=1 resources=2
```

### Pubsub notification

Send a notification to a PubSub topic the total spend of a billing account reaches the previous month's spend.


```hcl
module "budget" {
  source          = "./fabric/modules/billing-budget"
  billing_account = var.billing_account_id
  name            = "previous period budget"
  amount          = 0
  thresholds = {
    current    = [1.0]
    forecasted = []
  }
  pubsub_topic = module.pubsub.id
}

module "pubsub" {
  source     = "./fabric/modules/pubsub"
  project_id = var.project_id
  name       = "budget-topic"
}

# tftest modules=2 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [billing_account](variables.tf#L23) | Billing account id. | <code>string</code> | ✓ |  |
| [name](variables.tf#L50) | Budget name. | <code>string</code> | ✓ |  |
| [thresholds](variables.tf#L85) | Thresholds percentages at which alerts are sent. Must be a value between 0 and 1. | <code title="object&#40;&#123;&#10;  current    &#61; list&#40;number&#41;&#10;  forecasted &#61; list&#40;number&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [amount](variables.tf#L17) | Amount in the billing account's currency for the budget. Use 0 to set budget to 100% of last period's spend. | <code>number</code> |  | <code>0</code> |
| [credit_treatment](variables.tf#L28) | How credits should be treated when determining spend for threshold calculations. Only INCLUDE_ALL_CREDITS or EXCLUDE_ALL_CREDITS are supported. | <code>string</code> |  | <code>&#34;INCLUDE_ALL_CREDITS&#34;</code> |
| [email_recipients](variables.tf#L41) | Emails where budget notifications will be sent. Setting this will create a notification channel for each email in the specified project. | <code title="object&#40;&#123;&#10;  project_id &#61; string&#10;  emails     &#61; list&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [notification_channels](variables.tf#L55) | Monitoring notification channels where to send updates. | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [notify_default_recipients](variables.tf#L61) | Notify Billing Account Administrators and Billing Account Users IAM roles for the target account. | <code>bool</code> |  | <code>false</code> |
| [projects](variables.tf#L67) | List of projects of the form projects/{project_number}, specifying that usage from only this set of projects should be included in the budget. Set to null to include all projects linked to the billing account. | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [pubsub_topic](variables.tf#L73) | The ID of the Cloud Pub/Sub topic where budget related messages will be published. | <code>string</code> |  | <code>null</code> |
| [services](variables.tf#L79) | List of services of the form services/{service_id}, specifying that usage from only this set of services should be included in the budget. Set to null to include usage for all services. | <code>list&#40;string&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [budget](outputs.tf#L17) | Budget resource. |  |
| [id](outputs.tf#L22) | Budget ID. |  |

<!-- END TFDOC -->
