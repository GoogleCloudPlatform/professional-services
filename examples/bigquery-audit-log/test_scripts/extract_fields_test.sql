SELECT  

count(FinalTable.extract) as extractCount,
sum(numExtracts) as sumNumExtracts

from `data-analytics-pocs.audit.bigquery_audit_log` as FinalTable
where FinalTable.eventName = 'extract_job_completed'

UNION ALL

SELECT  

count(ExtractTable.extract) as extractCount,
sum(numExtracts) as sumNumExtracts

from `data-analytics-pocs.audit.bq_extract_audit` as ExtractTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(ExtractTable.startTime), month) <= 12 
