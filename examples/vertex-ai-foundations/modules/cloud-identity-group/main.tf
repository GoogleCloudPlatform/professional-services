/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

resource "google_cloud_identity_group" "group" {
  display_name = var.display_name
  parent       = var.customer_id
  description  = var.description

  group_key {
    id = var.name
  }

  labels = {
    "cloudidentity.googleapis.com/groups.discussion_forum" = ""
  }
}

# resource "google_cloud_identity_group_membership" "owners" {
#   group    = google_cloud_identity_group.group.id
#   for_each = toset(var.owners)
#   preferred_member_key { id = each.key }
#   roles { name = "OWNER" }
#   roles { name = "MEMBER" }
#   roles { name = "MANAGER" }
# }

resource "google_cloud_identity_group_membership" "managers" {
  group    = google_cloud_identity_group.group.id
  for_each = toset(var.managers)
  preferred_member_key { id = each.key }
  roles { name = "MEMBER" }
  roles { name = "MANAGER" }
}

resource "google_cloud_identity_group_membership" "members" {
  group    = google_cloud_identity_group.group.id
  for_each = toset(var.members)
  preferred_member_key { id = each.key }
  roles { name = "MEMBER" }
  depends_on = [google_cloud_identity_group_membership.managers]
}
