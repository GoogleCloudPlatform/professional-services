# Copyright 2022 Google. This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

output "user1_password" {
  value     = module.db.user_passwords
  sensitive = true
}
