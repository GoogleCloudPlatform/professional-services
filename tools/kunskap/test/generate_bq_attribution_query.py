""" Copyright 2018 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.i
"""

from string import Template

file = open("../sql/query_for_bq_attribution_daily_basis.sql","r")
bq_query_template = Template(file.read())
bq_query = bq_query_template.substitute(bq_billing_breakdown_table='bipin-dev.bq_spotify_ds.project_breakdown',
										 bq_billing_table='billing-data-2.DailyBillingExport.gcp_billing_export_v1_01EB05_B1778F_D20612',
										 service_description='BigQuery',
										 sku_description='BigQuery Reserved Capacity Fee',
 										 extracted_day = '2018-08-01')
print bq_query

