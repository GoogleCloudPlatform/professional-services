SELECT  

count(FinalTable.load) as loadCount,
sum(numLoads) as sumNumLoads

from `data-analytics-pocs.audit.bigquery_audit_log` as FinalTable
where FinalTable.eventName = 'load_job_completed'

UNION ALL

SELECT  

count(LoadTable.load) as loadCount,
sum(numLoads) as sumNumLoads

from `data-analytics-pocs.audit.bq_load_audit` as LoadTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(LoadTable.startTime), month) <= 12 
