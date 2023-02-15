# Google Cloud Artifact Registry Module

This module simplifies the creation of a Binary Authorization policy, attestors and attestor IAM bindings.

## Example

### Binary Athorization

```hcl
module "binauthz" {
  source     = "./fabric/modules/binauthz"
  project_id = "my_project"
  global_policy_evaluation_mode = "DISABLE"
  default_admission_rule = {
    evaluation_mode  = "ALWAYS_DENY"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    attestors        = null
  }
  cluster_admission_rules = {
    "europe-west1-c.cluster" = {
        evaluation_mode  = "REQUIRE_ATTESTATION"
        enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
        attestors = [ "test" ]
    }
  }
  attestors_config = {
    "test": {
        note_reference  = null
        pgp_public_keys = [
            <<EOT
            mQENBFtP0doBCADF+joTiXWKVuP8kJt3fgpBSjT9h8ezMfKA4aXZctYLx5wslWQl
            bB7Iu2ezkECNzoEeU7WxUe8a61pMCh9cisS9H5mB2K2uM4Jnf8tgFeXn3akJDVo0
            oR1IC+Dp9mXbRSK3MAvKkOwWlG99sx3uEdvmeBRHBOO+grchLx24EThXFOyP9Fk6
            V39j6xMjw4aggLD15B4V0v9JqBDdJiIYFzszZDL6pJwZrzcP0z8JO4rTZd+f64bD
            Mpj52j/pQfA8lZHOaAgb1OrthLdMrBAjoDjArV4Ek7vSbrcgYWcI6BhsQrFoxKdX
            83TZKai55ZCfCLIskwUIzA1NLVwyzCS+fSN/ABEBAAG0KCJUZXN0IEF0dGVzdG9y
            IiA8ZGFuYWhvZmZtYW5AZ29vZ2xlLmNvbT6JAU4EEwEIADgWIQRfWkqHt6hpTA1L
            uY060eeM4dc66AUCW0/R2gIbLwULCQgHAgYVCgkICwIEFgIDAQIeAQIXgAAKCRA6
            0eeM4dc66HdpCAC4ot3b0OyxPb0Ip+WT2U0PbpTBPJklesuwpIrM4Lh0N+1nVRLC
            51WSmVbM8BiAFhLbN9LpdHhds1kUrHF7+wWAjdR8sqAj9otc6HGRM/3qfa2qgh+U
            WTEk/3us/rYSi7T7TkMuutRMIa1IkR13uKiW56csEMnbOQpn9rDqwIr5R8nlZP5h
            MAU9vdm1DIv567meMqTaVZgR3w7bck2P49AO8lO5ERFpVkErtu/98y+rUy9d789l
            +OPuS1NGnxI1YKsNaWJF4uJVuvQuZ1twrhCbGNtVorO2U12+cEq+YtUxj7kmdOC1
            qoIRW6y0+UlAc+MbqfL0ziHDOAmcqz1GnROg
            =6Bvm
            EOT
        ]
        pkix_public_keys = null
        iam = {
            "roles/viewer" = ["user:user1@my_org.com"]
        }
    }
  }
}
# tftest modules=1 resources=4

```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L17) | Project ID. | <code>string</code> | ✓ |  |
| [admission_whitelist_patterns](variables.tf#L28) | An image name pattern to allowlist | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [attestors_config](variables.tf#L58) | Attestors configuration | <code title="map&#40;object&#40;&#123;&#10;  note_reference  &#61; string&#10;  iam             &#61; map&#40;list&#40;string&#41;&#41;&#10;  pgp_public_keys &#61; list&#40;string&#41;&#10;  pkix_public_keys &#61; list&#40;object&#40;&#123;&#10;    id                  &#61; string&#10;    public_key_pem      &#61; string&#10;    signature_algorithm &#61; string&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |
| [cluster_admission_rules](variables.tf#L48) | Admission rules | <code title="map&#40;object&#40;&#123;&#10;  evaluation_mode  &#61; string&#10;  enforcement_mode &#61; string&#10;  attestors        &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |
| [default_admission_rule](variables.tf#L34) | Default admission rule | <code title="object&#40;&#123;&#10;  evaluation_mode  &#61; string&#10;  enforcement_mode &#61; string&#10;  attestors        &#61; list&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  evaluation_mode  &#61; &#34;ALWAYS_ALLOW&#34;&#10;  enforcement_mode &#61; &#34;ENFORCED_BLOCK_AND_AUDIT_LOG&#34;&#10;  attestors        &#61; null&#10;&#125;">&#123;&#8230;&#125;</code> |
| [global_policy_evaluation_mode](variables.tf#L22) | Global policy evaluation mode. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [attestors](outputs.tf#L22) | Attestors. |  |
| [id](outputs.tf#L17) | Binary Authorization policy ID |  |
| [notes](outputs.tf#L30) | Notes. |  |

<!-- END TFDOC -->
