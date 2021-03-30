# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


CREATE TEMP FUNCTION
  ratio(numerator float64,
    denominator float64) AS (
  IF
    (denominator = 0,
      0,
      numerator / denominator));

 (
  WITH
  billing_export_table AS (
    SELECT
      b.*
    FROM
      `{{params.billing_export_table_name }}` b
    WHERE
      CAST(DATETIME(usage_start_time, "America/Los_Angeles") AS DATE) >= "2018-09-20"),

  project_label_credit_breakout AS (
    SELECT
      *
    FROM
      `{{ params.project_id }}.{{ params.corrected_dataset_id }}.{{ params.project_label_credit_breakout_table }}`),

  project_commitments AS (
    SELECT id,
      commit_start_date,
      commit_end_date,
      ARRAY_AGG(DISTINCT TRIM(p))  project_ids,
      STRUCT <region STRING,cud_type STRING,unit_type STRING,amount FLOAT64>
            (ANY_VALUE(commitments_region),
            ANY_VALUE(commitments_cud_type),
            ANY_VALUE(commitments_unit_type),
            ANY_VALUE(commitments_amount)) commitments
    FROM
    (
      SELECT
        TRIM(CAST(csv.id AS STRING)) AS id,
        commit_start_date,
        commit_end_date,
        ARRAY_AGG(DISTINCT b.project_id ignore nulls) project_ids,
        TRIM(csv.commitments_region) AS commitments_region,
        TRIM(csv.commitments_cud_type) AS commitments_cud_type,
        TRIM(csv.commitments_unit_type) AS commitments_unit_type,
        csv.commitments_amount
      FROM
      (SELECT DISTINCT
        project.id AS project_id,
        project.ancestry_numbers AS ancestry_numbers
      FROM
        billing_export_table ) AS b,
      `{{ params.project_id}}.{{ params.corrected_dataset_id }}.{{ params.temp_commitments_table_name }}`  csv
      LEFT JOIN UNNEST(SPLIT(folder_ids,",")) f
      WHERE
        regexp_contains(b.ancestry_numbers, f)
        AND f not in ("")
      GROUP BY 1,2,3,5,6,7,8

      UNION ALL

      SELECT
        TRIM(cast(csv.id AS STRING)) AS id,
        commit_start_date,
        commit_end_date,
        ANY_VALUE(SPLIT(TRIM(project_ids),",")) project_ids,
        TRIM(csv.commitments_region) AS commitments_region,
        TRIM(csv.commitments_cud_type) AS commitments_cud_type,
        TRIM(csv.commitments_unit_type) AS commitments_unit_type,
        csv.commitments_amount
      FROM
         `{{ params.project_id }}.{{ params.corrected_dataset_id }}.{{ params.temp_commitments_table_name }}` csv
      WHERE
        project_ids is not null
      GROUP BY 1,2,3,5,6,7,8
    ), UNNEST(project_ids) p
    GROUP BY 1,2,3
    ORDER BY 1
    ),

  PG_purchased_commitments AS (
    SELECT
      pc.id AS pg_id,
      usage_date,
      pc.commit_start_date AS commit_start_date,
      pc.commit_end_date AS commit_end_date,
      p.region AS region,
      p.cud_type AS cud_type,
      p.unit_type AS unit_type,
      ANY_VALUE(project_ids) AS project_ids,
      ANY_VALUE(commitments.amount) AS PG_purchased_committments,
      LEAST(ANY_VALUE(commitments.amount), SUM(p.usage_amount)) AS PG_purchased_committments_usage,
      SUM(p.usage_amount) AS PG_all_eligible_usage,
      SUM(p.commitment_cost) AS commitment_cost,
      SUM(p.cud_credit_cost) AS cud_credit_cost,
      SUM(p.sud_credit_cost) AS sud_credit_cost
    FROM
      project_label_credit_breakout p
    JOIN
      project_commitments pc
    ON
      p.project_id IN UNNEST(pc.project_ids)
      AND p.region = commitments.region
      AND p.cud_type = commitments.cud_type
      AND p.unit_type = commitments.unit_type
      AND usage_date BETWEEN commit_start_date
      AND commit_end_date
    GROUP BY 1,2,3,4,5,6,7),

  BA_credit_breakdown AS(
    SELECT
      p.usage_date AS usage_date,
      p.region AS region,
      p.cud_type AS cud_type,
      p.unit_type AS unit_type,
      SUM(p.usage_amount) AS eligible_usage,
      SUM(p.usage_amount - p.cud_credit_usage_amount) AS sud_credit_usage_amount,
      SUM(p.cud_credit_usage_amount) AS cud_credit_usage_amount,
      SUM(p.commitment_cost) AS commitment_cost,
      SUM(p.cud_credit_cost) AS cud_credit_cost,
      SUM(p.sud_credit_cost) AS sud_credit_cost
    FROM
      project_label_credit_breakout p
    GROUP BY 1, 2, 3, 4),

  BA_purchased_credit_breakout_temp AS (
    SELECT
      pgc.usage_date AS usage_date,
      pgc.region AS region,
      pgc.cud_type AS cud_type,
      pgc.unit_type AS unit_type,
      SUM(pgc.PG_purchased_committments) AS BA_purchased_committments,
      SUM(pgc.PG_purchased_committments_usage) AS BA_purchased_committments_usage,
      SUM(pgc.PG_all_eligible_usage) AS BA_all_eligible_usage,
      SUM(pgc.PG_purchased_committments_usage) AS BA_usage_amount,
      ANY_VALUE(b.commitment_cost) as BA_commitment_cost_a,
      --(ANY_VALUE(b.commitment_cost) * LEAST(1, ratio(SUM(pgc.PG_purchased_committments_usage),
      --       ANY_VALUE(b.cud_credit_usage_amount)))) AS BA_commitment_cost_b,
      (ANY_VALUE(b.cud_credit_cost) * LEAST(1, ratio(SUM(pgc.PG_purchased_committments_usage),
            ANY_VALUE(b.cud_credit_usage_amount)))) AS BA_cud_credit_cost,
      ANY_VALUE(b.cud_credit_usage_amount) *(LEAST(1, ratio(SUM(pgc.PG_purchased_committments_usage),
            ANY_VALUE(b.cud_credit_usage_amount)))) AS BA_cud_credit_usage,
      ANY_VALUE(b.sud_credit_cost) AS BA_sud_credit_cost
    FROM
      PG_purchased_commitments pgc
    JOIN
      BA_credit_breakdown b
    ON
      pgc.usage_date = b.usage_date
      AND pgc.region = b.region
      AND pgc.cud_type = b.cud_type
      AND pgc.unit_type = b.unit_type
    GROUP BY 1, 2, 3, 4),

  BA_unpurchased_credit_breakout AS (
    SELECT
      b.usage_date AS usage_date,
      b.region AS region,
      b.cud_type AS cud_type,
      b.unit_type AS unit_type,
      SUM(usage_amount) AS eligible_usage,
      SUM(usage_amount) - ANY_VALUE(
      IF
        (pcb.BA_usage_amount IS NULL,
          0,
          pcb.BA_usage_amount)) AS BA_unpurchased_usage,
      SUM(cud_credit_usage_amount) - ANY_VALUE(
      IF
        (pcb.BA_usage_amount IS NULL,
          0,
          pcb.BA_usage_amount)) AS BA_usage_amount,
      0 as BA_commitment_cost_a,
      --commitment cost * Ratio of its credit usage over total cud purchase commitment usage
      ANY_VALUE(pcb.BA_commitment_cost_a) * ratio(
      SUM(b.cud_credit_usage_amount) - ANY_VALUE(
      IF (pcb.BA_cud_credit_usage is NULL,
          0,
         pcb.BA_cud_credit_usage)), ANY_VALUE(pcb.BA_purchased_committments)) as BA_commitment_cost_b,
      SUM(b.cud_credit_cost) - ANY_VALUE(
      IF
        (pcb.BA_cud_credit_cost IS NULL,
          0,
          pcb.BA_cud_credit_cost)) AS BA_cud_credit_cost,
      ANY_VALUE(pcb.BA_sud_credit_cost) AS BA_sud_credit_cost,
      SUM(b.cud_credit_usage_amount) - ANY_VALUE(
      IF (pcb.BA_cud_credit_usage is NULL,
          0,
         pcb.BA_cud_credit_usage)) AS cud_credit_usage_amount
    FROM
      project_label_credit_breakout b
    LEFT JOIN
      BA_purchased_credit_breakout_temp pcb
    ON
      pcb.usage_date = b.usage_date
      AND pcb.region = b.region
      AND pcb.cud_type = b.cud_type
      AND pcb.unit_type = b.unit_type

    GROUP BY 1, 2, 3, 4),

  BA_purchased_credit_breakout AS (
      SELECT ba_p.*,
      b.commitment_cost - ba_u.BA_commitment_cost_b AS BA_commitment_cost_b
      FROM
        BA_purchased_credit_breakout_temp as ba_p
      JOIN
         BA_unpurchased_credit_breakout as ba_u
      ON
       ba_p.usage_date = ba_u.usage_date
        AND ba_p.region = ba_u.region
        AND ba_p.cud_type = ba_u.cud_type
        AND ba_p.unit_type = ba_u.unit_type
      JOIN
        BA_credit_breakdown b
      ON
        ba_p.usage_date = b.usage_date
        AND ba_p.region = b.region
        AND ba_p.cud_type = b.cud_type
        AND ba_p.unit_type = b.unit_type
      ),

  PG_purchased_credit_breakout AS (
    SELECT
      pg_id,
      pg.usage_date AS usage_date,
      pg.commit_Start_date AS commit_start_date,
      pg.commit_end_date AS commit_end_date,
      pg.region AS region,
      pg.cud_type AS cud_type,
      pg.unit_type AS unit_type,
      pg.project_ids AS project_ids,
      pg.PG_purchased_committments_usage AS PG_purchased_committments_usage,
      pg.PG_all_eligible_usage AS PG_all_eligible_usage,
      b.BA_usage_amount * ratio(PG_purchased_committments_usage,
        b.BA_usage_amount) AS PG_usage_amount,
      b.BA_commitment_cost_a * ratio(PG_purchased_committments,
        b.BA_purchased_committments) AS PG_commitment_cost_a,
      b.BA_commitment_cost_b * ratio(PG_purchased_committments,
        b.BA_purchased_committments) AS PG_commitment_cost_b,
      b.BA_cud_credit_cost * ratio(PG_purchased_committments_usage,
        b.BA_usage_amount) AS PG_cud_credit_cost,
      b.BA_sud_credit_cost * ratio(PG_purchased_committments_usage,
        b.BA_usage_amount) AS PG_sud_credit_cost,
      b.BA_cud_credit_usage * ratio(PG_purchased_committments_usage,
        b.BA_usage_amount) AS PG_cud_credit_usage
    FROM
      PG_purchased_commitments AS pg
    JOIN
      BA_purchased_credit_breakout AS b
    ON
      pg.usage_date = b.usage_date
      AND pg.region = b.region
      AND pg.cud_type = b.cud_type
      AND pg.unit_type = b.unit_type),

  final_cud_credits_data_purchased AS (
    SELECT
      billing_account_id,
      usage_date,
      service_id,
      cost_type,
      service_description,
      region,
      unit_type,
      cud_type,
      project_id,
      project_name,
      ancestry_numbers,
      labels,
      SUM(usage_amount) AS usage_amount,
      SUM(P_sud_eligible_usage) AS P_sud_eligible_usage,
      SUM(P_alloc_commitment_cost_a) AS P_alloc_commitment_cost_a,
      SUM(P_alloc_commitment_cost_b) AS P_alloc_commitment_cost_b,
      SUM(P_alloc_usage) AS P_alloc_usage,
      SUM(P_alloc_cud_credit_cost) AS P_alloc_cud_credit_cost
    FROM (
      SELECT
        p.billing_account_id,
        p.usage_date AS usage_date,
        p.service_id AS service_id,
        p.cost_type AS cost_type,
        p.service_description AS service_description,
        p.region AS region,
        p.unit_type AS unit_type,
        p.cud_type AS cud_type,
        p.project_id AS project_id,
        p.project_name AS project_name,
        p.ancestry_numbers AS ancestry_numbers,
        labels,
         p.usage_amount AS usage_amount,
--       we take the usage amount and remove the current usage, which gives us the potential
--       sud usage.
--       Note that this calculates sud credit for total remaining, so it does not take into account
--       some usage that will get cud allocated as part of unpurchased tranche. That is okay, because
--       we remove that part of cud usage from the sud_eligible_usage downstream
        p.usage_amount - ratio(p.usage_amount, pgc.PG_all_eligible_usage)* pgc.PG_cud_credit_usage AS P_sud_eligible_usage,
        ratio(p.usage_amount, pgc.PG_all_eligible_usage) * pgc.PG_purchased_committments_usage AS P_alloc_usage,
        ratio(p.usage_amount, pgc.PG_all_eligible_usage) * pgc.PG_cud_credit_cost AS P_alloc_cud_credit_cost,
        ratio(p.usage_amount, pgc.PG_all_eligible_usage) * pgc.PG_commitment_cost_a AS P_alloc_commitment_cost_a,
        ratio(p.usage_amount, pgc.PG_all_eligible_usage) * pgc.PG_commitment_cost_b AS P_alloc_commitment_cost_b
      FROM
        project_label_credit_breakout AS p
      JOIN
        PG_purchased_credit_breakout AS pgc
      ON
        p.usage_date = pgc.usage_date

      JOIN
        BA_purchased_credit_breakout AS ba
      ON
        p.usage_date = ba.usage_date
      JOIN BA_credit_breakdown AS bacb
      ON p.usage_date = bacb.usage_date
        AND p.region = bacb.region
        AND p.unit_type = bacb.unit_type
        AND p.cud_type = bacb.cud_type
        AND p.region = ba.region
        AND p.unit_type = ba.unit_type
        AND p.region = pgc.region
        AND p.cud_type = pgc.cud_type
        AND p.unit_type = pgc.unit_type
        AND p.project_id IN UNNEST(pgc.project_ids)
      GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18)
    GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12),

  final_cud_credits_data_unpurchased AS (

    SELECT
      p.billing_account_id,
      p.usage_date AS usage_date,
      p.service_id AS service_id,
      p.cost_type AS cost_type,
      p.service_description AS service_description,
      p.region AS region,
      p.unit_type AS unit_type,
      p.cud_type AS cud_type,
      p.project_id AS project_id,
      p.project_name as project_name,
      p.ancestry_numbers as ancestry_numbers,
      p.labels,
      0 as usage_amount,

      --If cud_credit_usage_amount for this unpurchased group is 0 and there was no sud eligible usage from purchased group,
      --then all of usage_amount is  sud eligible.
      --If there is some credit usage in this unpurchased group, then we do the following,
      -- If there was no eligible sud eligible usage from purchased group, then we just subtract the cud usage from the total usage amount.
      -- If, however, there was some sud eligible usage from purchased group, then we just remove the previous cud usage amount from
      -- current usage and multiply by -1 to get a negative number that can be removed from all sud eligible from purchased group
	    IF(b.cud_credit_usage_amount = 0,
	    	 if (fdp.P_sud_eligible_usage is null, p.usage_amount , 0),
	    	 IF (fdp.P_sud_eligible_usage is NOT NULL,
	      			-1*(ratio((p.usage_amount - (fdp.usage_amount - fdp.P_sud_eligible_usage)),
	            		BA_unpurchased_usage) * BA_usage_amount),
	         		p.usage_amount - ( ratio(p.usage_amount, BA_unpurchased_usage) * BA_usage_amount ) ) )   as P_sud_eligible_usage,
      0 AS P_alloc_commitment_cost_a,
       ratio((p.usage_amount -
            IF(fdp.P_alloc_usage IS NULL,
              0,
              fdp.P_alloc_usage)),
            BA_unpurchased_usage) * b.BA_commitment_cost_b as P_alloc_commitment_cost_b,
      0 AS P_alloc_usage,
      ratio((p.usage_amount -
            IF(fdp.P_alloc_usage IS NULL,
              0,
              fdp.P_alloc_usage)),
            BA_unpurchased_usage) * BA_cud_credit_cost AS P_alloc_cud_credit_cost

    FROM
      project_label_credit_breakout AS p
    JOIN
      BA_unpurchased_credit_breakout AS b
    ON
      p.usage_date = b.usage_date
      AND p.region = b.region
      AND p.cud_type = b.cud_type
      AND p.unit_type = b.unit_type
    JOIN BA_credit_breakdown AS bacb
      on p.usage_date = bacb.usage_date
      AND p.region = bacb.region
      AND p.unit_type = bacb.unit_type
      AND p.cud_type = bacb.cud_type
    LEFT JOIN
      final_cud_credits_data_purchased fdp
    ON
      fdp.project_id = p.project_id
      AND fdp.labels = p.labels
      AND fdp.usage_date = p.usage_date
      AND fdp.region = p.region
      AND fdp.cud_type = p.cud_type
      AND fdp.unit_type = p.unit_type

    GROUP BY  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18),

    final_cud_credits_data_all AS (
     SELECT
      billing_account_id,
      usage_date AS usage_date,
      service_id AS service_id,
      cost_type AS cost_type,
      service_description AS service_description,
      region AS region,
      unit_type AS unit_type,
      cud_type AS cud_type,
      project_id AS project_id,
      project_name AS project_name,
      ancestry_numbers AS ancestry_numbers,
      labels AS labels,
      sum(P_sud_eligible_usage) AS P_sud_eligible_usage,
      sum(P_alloc_commitment_cost_a) AS P_alloc_commitment_cost_a,
      sum(P_alloc_commitment_cost_b) AS P_alloc_commitment_cost_b,
      sum(P_alloc_cud_credit_cost) AS P_alloc_cud_credit_cost
      FROM (
        SELECT
          *
        FROM
          final_cud_credits_data_purchased
        UNION ALL
        SELECT
          *
        FROM
          final_cud_credits_data_unpurchased
      )
      GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12),

      final_data AS (
        SELECT
          *
        FROM
          (SELECT
            p.billing_account_id,
            p.usage_date AS usage_date,
            p.service_id AS service_id,
            p.cost_type AS cost_type,
            p.service_description AS service_description,
            p.region AS region,
            p.unit_type AS unit_type,
            p.cud_type AS cud_type,
            p.project_id AS project_id,
            p.project_name AS project_name,
            p.ancestry_numbers AS ancestry_numbers,
            p.labels,
            p.P_sud_eligible_usage * ratio(bacb.sud_credit_cost , bacb.sud_credit_usage_amount) as P_alloc_sud_credit_cost,
            p.P_alloc_cud_credit_cost,
            p.P_alloc_commitment_cost_a,
            p.P_alloc_commitment_cost_b
          FROM
             final_cud_credits_data_all AS p
          JOIN BA_credit_breakdown AS bacb
            ON p.usage_date = bacb.usage_date
            AND p.region = bacb.region
            AND p.unit_type = bacb.unit_type
            AND p.cud_type = bacb.cud_type
          )
        WHERE P_alloc_sud_credit_cost <> 0
          OR P_alloc_cud_credit_cost <> 0
          OR P_alloc_commitment_cost_a <> 0
          OR P_alloc_commitment_cost_b <> 0)

    SELECT
      *
    FROM
      final_data)