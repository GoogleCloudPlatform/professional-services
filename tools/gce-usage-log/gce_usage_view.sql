#standardSQL
SELECT
  inserted,
  deleted,
  preemptible,
  instance_id,
  instance_log.project_id as project_id,
  instance_log.zone AS zone,
  machine_type,
  usage.cores AS cores,
  usage.memory_mb as memory_mb,
  pd_standard_size_gb,
  pd_ssd_size_gb,
  local_ssd_size_gb,
  tags,
  labels
FROM (
  SELECT
    inserted.insert_timestamp AS inserted,
    deleted.delete_timestamp AS deleted,
    inserted.preemptible AS preemptible,
    inserted.project_id AS project_id,
    inserted.instance_id AS instance_id,
    zone,
    machine_type,
    CASE # https://cloud.google.com/compute/docs/machine-types
      WHEN STARTS_WITH(machine_type, 'custom-') OR STARTS_WITH(machine_type, 'n2-custom-') THEN
        STRUCT<cores FLOAT64, memory_mb FLOAT64>(
          CAST(
            SPLIT(LTRIM(LTRIM(machine_type, 'n2-'), 'custom-'), '-')[ORDINAL(1)]
          as FLOAT64),
          CAST(
            SPLIT(LTRIM(LTRIM(machine_type, 'n2-'), 'custom-'), '-')[ORDINAL(2)]
          as FLOAT64)
        )
      WHEN machine_type = 'f1-micro' THEN STRUCT(0.2, .6 * 1024)
      WHEN machine_type = 'g1-small' THEN STRUCT(0.5, 1.7 * 1024)
      ELSE
        STRUCT<cores FLOAT64, memory_mb FLOAT64>(
          CAST(
            SPLIT(machine_type, '-')[ORDINAL(3)]
          as FLOAT64),
          CAST(
            CASE
              WHEN STARTS_WITH(machine_type, 'n1-standard') THEN 3.75 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'n2-standard') THEN 4 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'c2-standard') THEN 4 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'n1-highmem') THEN 6.5 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'n2-highmem') THEN 8 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'n1-highcpu') THEN 0.9 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN STARTS_WITH(machine_type, 'n2-highcpu') THEN 1 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN SPLIT(machine_type, '-')[ORDINAL(2)] = 'ultramem' THEN 24.025 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              WHEN SPLIT(machine_type, '-')[ORDINAL(2)] = 'megamem' THEN 14.9333333 * 1024 * CAST(SPLIT(machine_type, '-')[ORDINAL(3)] as FLOAT64)
              ELSE 0
            END
          as FLOAT64)
        )
    END as usage,
    pd_standard_size_gb,
    pd_ssd_size_gb,
    local_ssd_size_gb,
    tags,
    labels
  FROM (SELECT instance_id, insert_timestamp, project_id, zone, machine_type, preemptible, pd_standard_size_gb, pd_ssd_size_gb, local_ssd_size_gb, ANY_VALUE(labels) as labels, ANY_VALUE(tags) as tags FROM ((
      SELECT
        timestamp AS insert_timestamp,
        resource.labels.instance_id AS instance_id,
        resource.labels.project_id AS project_id,
        resource.labels.zone AS zone,
        REGEXP_EXTRACT(protopayload_auditlog.request_instances_insert.machinetype,r"([^/]+)$") AS machine_type,
        protopayload_auditlog.request_instances_insert.scheduling.preemptible AS preemptible,
        (
          SELECT
            SUM(CAST(disk.initializeparams.disksizegb as FLOAT64))
          FROM
            UNNEST(protopayload_auditlog.request_instances_insert.disks) AS disk
          WHERE
            ENDS_WITH(disk.initializeparams.disktype, 'pd-standard')
        ) AS pd_standard_size_gb,
        (
          SELECT
            SUM(CAST(disk.initializeparams.disksizegb as FLOAT64))
          FROM
            UNNEST(protopayload_auditlog.request_instances_insert.disks) AS disk
          WHERE
            ENDS_WITH(disk.initializeparams.disktype, 'pd-ssd')
        ) AS pd_ssd_size_gb,
        (
          SELECT
            COUNT(1) * 375
          FROM
            UNNEST(protopayload_auditlog.request_instances_insert.disks) AS disk
          WHERE
            ENDS_WITH(disk.initializeparams.disktype, 'local-ssd')
        ) AS local_ssd_size_gb,
        ARRAY(
          SELECT
            STRUCT(label.key,
              label.value)
          FROM
            UNNEST(protopayload_auditlog.request_instances_insert.labels) AS label
        ) AS labels,
        protopayload_auditlog.request_instances_insert.tags.tags AS tags
      FROM
        `_PROJECT_.gce_usage_log.cloudaudit_googleapis_com_activity_*`
      WHERE
        protopayload_auditlog.response_operation.operationtype = "insert"
        AND resource.type = "gce_instance")
    UNION ALL (
      SELECT
        insert_timestamp,
        CAST(instance_id AS STRING) AS instance_id,
        project_id,
        zone,
        machine_type,
        preemptible,
        pd_standard_size_gb,
        pd_ssd_size_gb,
        local_ssd_size_gb,
        ARRAY(
        SELECT
          STRUCT(label.key,
            label.value)
        FROM
          UNNEST(labels) AS label) AS labels,
        tags
      FROM
        `_PROJECT_.gce_usage_log._initial_vm_inventory` )) GROUP BY insert_timestamp, instance_id, project_id, zone, machine_type, preemptible, pd_standard_size_gb, pd_ssd_size_gb, local_ssd_size_gb) AS inserted
  LEFT JOIN (
    SELECT
      timestamp AS delete_timestamp,
      resource.labels.instance_id AS instance_id,
      operation.first AS deleted
    FROM
      `_PROJECT_.gce_usage_log.cloudaudit_googleapis_com_activity_*`
    WHERE
      protopayload_auditlog.response_operation.operationtype = "delete"
      AND resource.type = "gce_instance") AS deleted
  USING
    (instance_id)
) AS instance_log
