SELECT  

count(tableCopy) as tableCopyCount,
sum(numCopies) as sumNumCopies

from `data-analytics-pocs.audit.bigquery_audit_log` as FinalTable
where FinalTable.eventName = 'table_copy_job_completed'

UNION ALL

SELECT  

count(tableCopy) as tableCopyCount,
sum(numCopies) as sumNumCopies

from `data-analytics-pocs.audit.bq_copy_audit` as CopyTable
WHERE DATE_DIFF( CURRENT_DATE(), DATE(CopyTable.startTime), month) <= 12 
