SELECT  

count(principalEmail) as principalEmailCount,
count(serviceName) as serviceNameCount,
count(jobId) as jobIdCount,
count(date) as dateCount,
count(*)

from `data-analytics-pocs.audit.bigquery_audit_log` as FinalTable



UNION ALL

SELECT  

count(principalEmail),
count(serviceName),
count(jobId),
count(date),
count(*)

from `data-analytics-pocs.audit.bq_copy_audit` as CopyTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(CopyTable.startTime), month) <= 12 

UNION ALL 

SELECT  

count(principalEmail),
count(serviceName),
count(jobId),
count(date),
count(*)

from `data-analytics-pocs.audit.bq_extract_audit` as ExtractTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(ExtractTable.startTime), month) <= 12 

UNION ALL

SELECT  

count(principalEmail),
count(serviceName),
count(jobId),
count(date),
count(*)

from `data-analytics-pocs.audit.bq_load_audit` as LoadTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(LoadTable.startTime), month) <= 12 

UNION ALL

SELECT  

count(principalEmail),
count(serviceName),
count(jobId),
count(date),
count(*)

from `data-analytics-pocs.audit.bq_query_audit` as QueryTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(QueryTable.startTime), month) <= 12 
