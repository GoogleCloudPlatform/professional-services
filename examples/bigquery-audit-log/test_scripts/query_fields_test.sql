SELECT  

count(FinalTable.query) as queryCount,
count(FinalTable.referencedTables) as referencedTablesCount,
count(FinalTable.referencedViews) as referencedViews

from `data-analytics-pocs.audit.bigquery_audit_log` as FinalTable
where FinalTable.eventName = 'query_job_completed'

UNION ALL

SELECT  

count(QueryTable.query) as queryCount,
count(QueryTable.referencedTables) as referencedTablesCount,
count(QueryTable.referencedViews) as referencedViews

from `data-analytics-pocs.audit.bq_query_audit` as QueryTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(QueryTable.startTime), month) <= 12 
