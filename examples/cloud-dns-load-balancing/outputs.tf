/**
 * Copyright 2024 Google LLC
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

output "l7_gxlb_cr_ip" {
    value = google_compute_global_address.xlb-ipv4-ext.address
}

output "l7_gxlb_cr_fqdn" {
    value = google_dns_record_set.a_l7_gxlb_hello.name
}

output "l4_rilb_mig_ip" {
    value = {
        for k, l in module.l4-rilb : k => l.lb_ip_address
    }
}

output "l4_rilb_mig_fqdn" {
    value = google_dns_record_set.a_l4_rilb_mig_hello.name
}

output "l7_rilb_cr_ip" {
    value = {
        for k, l in module.l7-rilb-cr : k => l.lb_ip_address
    }
}

output "l7_rilb_cr_fqdn" {
    value = google_dns_record_set.a_l7_rilb_cr_hello.name
}

output "l7_rilb_mig_ip" {
    value = {
        for k, l in module.l7-rilb-mig : k => l.lb_ip_address
    }
}

output "l7_rilb_mig_fqdn" {
    value = google_dns_record_set.a_l7_rilb_mig_hello.name
}

output "l7_crilb_cr_ip" {
    value = module.l7-crilb-cr.lb_ip_address
}

output "l7_crilb_cr_fqdn" {
    value = google_dns_record_set.a_l7_crilb_cr_hello.name
}

output "l7_crilb_mig_ip" {
    value = module.l7-crilb-mig.lb_ip_address
}

output "l7_crilb_mig_fqdn" {
    value = google_dns_record_set.a_l7_crilb_mig_hello.name
}
