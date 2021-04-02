/*
  -- Copyright 2021 Google Inc. All Rights Reserved.

  -- Licensed under the Apache License, Version 2.0 (the "License");
  -- you may not use this file except in compliance with the License.
  -- You may obtain a copy of the License at

  --   http://www.apache.org/licenses/LICENSE-2.0

  -- Unless required by applicable law or agreed to in writing, software
  -- distributed under the License is distributed on an "AS IS" BASIS,
  -- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  -- See the License for the specific language governing permissions and
  -- limitations under the License.
*/

/*
Helper functions to extract information or columns for dashbaord purposes.
  Supported services
    Compute Engine
    Cloud Storage
    Bigquery

NOTE:
1. Assumes that current project contains a dataset named 'dashboard' and creates
        the functions in that dataset. Replace with correct name if that is not desired.
*/


-- Extract 'Category' or re-categorize 'Category' from taxonomy data and sku description.
CREATE OR REPLACE FUNCTION dashboard.Recategorize(
  service STRING, category STRING, taxonomy STRING, sku STRING
)
AS (
  CASE
    -- Compute Engine
    WHEN service = 'Compute Engine' and category = 'Compute'
      THEN(
        CASE
          WHEN REGEXP_CONTAINS(taxonomy, r'ingress|egress|network other')
            THEN 'Network'
          WHEN REGEXP_CONTAINS(taxonomy, r'premium image') THEN 'Premium Image'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms|vm image storage') THEN 'VM'
          WHEN REGEXP_CONTAINS(taxonomy, r'gpus->gpus') THEN 'GPU'
          WHEN REGEXP_CONTAINS(taxonomy, r'persistent disk|local ssd')
            THEN 'Persistent Disk'
          -- fallback
          ELSE category
          END
      )
    -- Compute Engine Network
    WHEN service = 'Compute Engine' and category = 'Network' THEN 'Network'
    -- Compute Engine Marketplace Services
    WHEN service = 'Compute Engine' and category = 'Marketplace Services'
      THEN 'Marketplace Services'
    -- Compute Engine Analytics|Dataproc
    WHEN service = 'Compute Engine' and category = 'Analytics'
      THEN(
        CASE
          WHEN REGEXP_CONTAINS(taxonomy, r'analytics->(cloud dataflow)')
            THEN 'Cloud Dataflow'
          WHEN REGEXP_CONTAINS(taxonomy, r'analytics->cloud dataproc')
            THEN 'Cloud Dataproc'
          -- fallback
          ELSE category
          END
      )
    -- Cloud storage Network - NOTE: Nothing to recategorize
    WHEN service = 'Cloud Storage' and category = 'Network' THEN 'Network'
    WHEN service = 'Cloud Storage' and category = 'Storage'
      THEN(
        CASE
          -- Cloud Storage Retrieval
          WHEN REGEXP_CONTAINS(sku, r'data retrieval') THEN 'Data Retrieval'
          -- Cloud Storage Operations
          WHEN REGEXP_CONTAINS(taxonomy, r'gcs->ops') THEN 'Operations'
          WHEN REGEXP_CONTAINS(taxonomy, r'early delete') THEN 'Early Deletes'
          -- fallback
          ELSE 'Data Storage'
          END
      )
    -- Bigquery
    WHEN
        service IN (
          'BigQuery', 'BigQuery Reservation API', 'BigQuery Storage API'
        )
      THEN category
    -- Catch all other cases
    ELSE '_PARSE_ERROR'
    END
);


-- Extract Type information from taxonomy data and sku description.
CREATE OR REPLACE FUNCTION dashboard.Type(service STRING, taxonomy STRING, sku STRING)
AS (
  CASE
    -- Compute Engine
    WHEN service = 'Compute Engine'
      THEN(
        CASE
          -- Cores
          WHEN REGEXP_CONTAINS(taxonomy, r'vms on demand->cores')
            THEN 'Cores On-demand'
          WHEN REGEXP_CONTAINS(taxonomy, r'vms preemptible->cores')
            THEN 'Cores Preemptible'
          WHEN REGEXP_CONTAINS(taxonomy, r'cores') THEN 'Cores'
          -- RAM
          WHEN REGEXP_CONTAINS(taxonomy, r'vms on demand->memory')
            THEN 'RAM On-demand'
          WHEN REGEXP_CONTAINS(taxonomy, r'vms preemptible->memory')
            THEN 'RAM Preemptible'
          WHEN REGEXP_CONTAINS(taxonomy, r'memory') THEN 'RAM'
          -- PD/SSD
          WHEN REGEXP_CONTAINS(taxonomy, r'local ssd->on demand')
            THEN 'SSD Local On-demand'
          WHEN REGEXP_CONTAINS(taxonomy, r'local ssd') THEN 'SSD Local'
          WHEN REGEXP_CONTAINS(taxonomy, r'disk->ssd->capacity')
            THEN 'SSD Capacity'
          WHEN REGEXP_CONTAINS(taxonomy, r'disk->standard->capacity')
            THEN 'Capacity'
          WHEN REGEXP_CONTAINS(taxonomy, r'disk->standard->snapshot')
            THEN 'Snapshot'
          WHEN REGEXP_CONTAINS(taxonomy, r'vm image storage')
            THEN 'Image Storage'
          -- Compute Engine Storage Requests
          WHEN REGEXP_CONTAINS(taxonomy, r'persistent disk->diskops')
            THEN 'IO Requests'
          -- Compute Engine Licenses
          WHEN REGEXP_CONTAINS(taxonomy, r'premium image') THEN 'Licensing fee'
          -- Compute Engine GPU
          WHEN REGEXP_CONTAINS(taxonomy, r'gpus on demand')
            THEN 'GPUs On-demand'
          WHEN REGEXP_CONTAINS(taxonomy, r'gpus preemptible')
            THEN 'GPUs Preemptible'
          WHEN REGEXP_CONTAINS(taxonomy, r'gpus') THEN 'GPUs'
          -- Compute Network
          -- Ingress
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'gce->ingress->premium|ingress->gce->premium'
              )
            THEN 'Ingress Premium'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress->standard')
            THEN 'Ingress Standard'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress->inter-zone')
            THEN 'Ingress Inter-zone'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress->intra-zone')
            THEN 'Ingress Intra-zone'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress->inter-region')
            THEN 'Ingress Inter-region'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress->standard')
            THEN 'Ingress'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->ingress') THEN 'Ingress'
          -- Egress
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'gce->egress->premium|egress->gce->premium'
              )
            THEN 'Egress Premium'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->egress->standard')
            THEN 'Egress Standard'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->egress->inter-zone')
            THEN 'Egress Inter-zone'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->egress->intra-zone')
            THEN 'Egress Intra-zone'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->egress->inter-region')
            THEN 'Egress Inter-region'
          WHEN REGEXP_CONTAINS(taxonomy, r'gce->egress') THEN 'Ingress'
          WHEN REGEXP_CONTAINS(taxonomy, r'network->egress->gce') THEN 'Egress'
          -- Other
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'cloud vpn->vpninter(region|net)ingress'
              )
            THEN 'Ingress VPN Inter-region/Internet'
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'cloud vpn->vpninter(region|net)egress'
              )
            THEN 'Egress VPN Inter-region/Internet'
          WHEN REGEXP_CONTAINS(taxonomy, r'interconnect->ingress')
            THEN 'Ingress Interconnect'
          WHEN REGEXP_CONTAINS(taxonomy, r'interconnect->egress')
            THEN 'Egress Interconnect'
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'interconnect->peeringorinterconnectegress'
              )
            THEN 'Egress Peering/Interconnect'
          -- LB
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud lb->lb traffic') THEN 'LB'
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud lb->forwarding rule')
            THEN 'LB Forwarding rule'
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud lb->internal')
            THEN 'LB Internal'
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud lb->other') THEN 'LB Other'
          -- CDN
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud cdn->cache fill')
            THEN 'CDN Cache fill'
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud cdn->other') THEN 'CDN Other'
          -- Cloud armor
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud armor->') THEN 'Cloud Armor'
          -- VPN
          WHEN REGEXP_CONTAINS(taxonomy, r'cloud vpn->vpntunnel')
            THEN 'VPN tunnel'
          -- External IP
          WHEN REGEXP_CONTAINS(taxonomy, '->ip address') THEN 'IP Address'
          WHEN REGEXP_CONTAINS(taxonomy, 'vpn->ip address')
            THEN 'IP Address VPN'
          -- Interconnect
          WHEN REGEXP_CONTAINS(taxonomy, '->interconnect')
            THEN 'Interconnect Partner/Dedicated'
          -- NAT Gateway
          WHEN REGEXP_CONTAINS(taxonomy, '->nat gateway') THEN 'NAT Gateway'
          -- FLow logs
          WHEN REGEXP_CONTAINS(taxonomy, '->vpc flow logs') THEN 'VPC flow logs'
          -- Compute Engine Dataflow
          -- Licensing
          WHEN
              REGEXP_CONTAINS(
                taxonomy, 'licenses->dataflow streaming|licenses->dataproc'
              )
            THEN 'Licensing fee'
          ELSE '_PARSE_ERROR'
          END
      )
    -- Cloud Storage
    WHEN service = 'Cloud Storage'
      THEN(
        CASE
          -- Cloud Storage Network
          WHEN REGEXP_CONTAINS(taxonomy, r'cdn->cache fill')
            THEN 'CDN Cache fill'
          WHEN REGEXP_CONTAINS(taxonomy, r'egress->gae->premium')
            THEN 'Egress GAE/Firebase Premium'
          WHEN REGEXP_CONTAINS(taxonomy, r'egress->gcs->(inter-region|premium)')
            THEN 'Egress Inter-Region/Premium'
          WHEN REGEXP_CONTAINS(taxonomy, r'interconnect->egress')
            THEN 'Egress Peered/Interconnect'
          -- Cloud Storage Operations|Early Deletes|Storage
          -- DRA
          WHEN REGEXP_CONTAINS(taxonomy, r'dra->regional and dual-regional')
            THEN 'DRA Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'dra') THEN 'DRA'
          -- Standard
          WHEN
              REGEXP_CONTAINS(
                taxonomy, r'standard->multi-regional and dual-regional'
              )
            THEN 'Standard Mutli-Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'standard->multi-regional')
            THEN 'Standard Mutli-Regional'
          WHEN
              REGEXP_CONTAINS(taxonomy, r'standard->regional and dual-regional')
            THEN 'Standard Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'standard->regional')
            THEN 'Standard Regional/Dual-Regional'
          -- Archive
          WHEN REGEXP_CONTAINS(taxonomy, r'archive->regional and dual-regional')
            THEN 'Archive Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'archive->multi-regional')
            THEN 'Archive Mutli-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'archive') THEN 'Archive'
          -- Coldline
          WHEN REGEXP_CONTAINS(taxonomy, r'coldline->multi-regional')
            THEN 'Coldline Multi-Regional'
          WHEN
              REGEXP_CONTAINS(taxonomy, r'coldline->regional and dual-regional')
            THEN 'Coldline Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'coldline') THEN 'Coldline'
          -- Nearline
          WHEN REGEXP_CONTAINS(taxonomy, r'storage->nearline->multi-regional')
            THEN 'Nearline Multi-Regional'
          WHEN
              REGEXP_CONTAINS(taxonomy, r'nearline->regional and dual-regional')
            THEN 'Nearline Regional/Dual-Regional'
          WHEN REGEXP_CONTAINS(taxonomy, r'nearline') THEN 'Nearline'
          -- fallback
          ELSE '_PARSE_ERROR'
          END
      )
    -- BigQuery
    WHEN service = 'BigQuery'
      THEN(
        CASE
          -- BigQuery Analysis
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->analysis->on demand')
            THEN 'Analysis On-demand'
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->analysis') THEN 'Analysis'
          -- BigQuery Streaming
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->streaming')
            THEN 'Streaming Inserts'
          -- BigQuery Storage
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->storage->active')
            THEN 'Storage Active'
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->storage->long term')
            THEN 'Storage Long-term'
          WHEN REGEXP_CONTAINS(taxonomy, r'gbq->storage') THEN 'Storage'
          -- catch all
          ELSE '_PARSE_ERROR'
          END
      )
      WHEN service = 'BigQuery Reservation API'
        THEN(
          CASE
            -- BQ Reservation API
            WHEN REGEXP_CONTAINS(taxonomy, r'reservation api->flat rate flex') THEN 'Flat rate flex'
            WHEN REGEXP_CONTAINS(taxonomy, r'reservation api->flat rate') THEN 'Flat rate'
            -- catch all
            ELSE '_PARSE_ERROR'
          END
        )
      WHEN service = 'BigQuery Storage API'
        THEN(
          CASE
            -- BQ Storage API
            WHEN REGEXP_CONTAINS(taxonomy, r'gbq->streaming') AND sku LIKE '%api - read' THEN 'Streaming Read'
            ELSE '_PARSE_ERROR'
          END
        )          
    -- catch all for unsupported services
    ELSE '_PARSE_ERROR'
    END
);


-- Extract SubType information from taxonomy data and sku description.
CREATE OR REPLACE FUNCTION dashboard.SubType(service STRING, taxonomy STRING, sku STRING)
AS (
  CASE
    -- Compute Engine Cores
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'^commit.*cpu') THEN
      IFNULL(REGEXP_EXTRACT(sku, r'commit.*: (.*) cpu .*'), 'Standard')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'^commit.*core') THEN
      IFNULL(REGEXP_EXTRACT(sku, r'commit.*: (.*) core .*'), 'Standard')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'^preemptible .* instance') THEN
      REGEXP_EXTRACT(sku, r'^preemptible(.*) instance .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'^preemptible .* core') THEN
      REGEXP_EXTRACT(sku, r'^preemptible(.*) core .*')    
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'premium') THEN
      REGEXP_EXTRACT(sku, r'(.*) premium .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'instance') THEN
      REGEXP_EXTRACT(sku, r'(.*) instance .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)cores:') and REGEXP_CONTAINS(sku, r'core') THEN
      REGEXP_EXTRACT(sku, r'(.*) core .*')
    -- Compute Engine RAM
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'^commit') THEN
      IFNULL(REGEXP_EXTRACT(sku, r'commit.*: (.*) ram .*'), 'Standard')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'^preemptible .* instance') THEN
      REGEXP_EXTRACT(sku, r'^preemptible(.*) instance .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'^preemptible .* ram') THEN
      REGEXP_EXTRACT(sku, r'^preemptible(.*) ram .*')    
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'premium') THEN
      REGEXP_EXTRACT(sku, r'(.*) premium .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'instance') THEN
      REGEXP_EXTRACT(sku, r'(.*) instance .*')
    WHEN REGEXP_CONTAINS(taxonomy, r'gce->vms(.*)memory:') and REGEXP_CONTAINS(sku, r'ram') THEN
      REGEXP_EXTRACT(sku, r'(.*) ram .*')
    -- Cloud Storage
    WHEN service = 'Cloud Storage' THEN ''
    -- BQ
    WHEN service LIKE 'BigQuery%' THEN ''
    -- catch all
    ELSE ''
    END
);


-- Extract UsageType information from taxonomy data
CREATE OR REPLACE FUNCTION dashboard.UsageType(taxonomy STRING)
AS (
  CASE
    -- Compute Engine
    WHEN REGEXP_CONTAINS(taxonomy, 'offline') THEN 'Commitment'
    WHEN REGEXP_CONTAINS(taxonomy, 'gce->vms commit') THEN 'Commitment'
    -- Compute Engine GPUS
    WHEN REGEXP_CONTAINS(taxonomy, 'gpus->gpus commit') THEN 'Commitment'
    -- Compute Engine Storage
    WHEN REGEXP_CONTAINS(taxonomy, 'commit') THEN 'Commitment'
    ELSE 'Usage'
    END
);


-- Extract the following fields from taxonomy data and sku description
-- 1. Category
-- 2. Type
-- 3. SubType
-- 4. UsageType
CREATE OR REPLACE FUNCTION dashboard.ItemSpec(
  service STRING, category STRING, taxonomy STRING, sku STRING
)
AS (
  STRUCT(
    dashboard.Recategorize(service, category, taxonomy, sku) as pricing_category,
    dashboard.Type(service, taxonomy, sku) as pricing_type,
    dashboard.SubType(service, taxonomy, sku) as pricing_sub_type,
    dashboard.UsageType(taxonomy) as pricing_usage_type
  )
);
