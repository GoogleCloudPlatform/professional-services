/*in subs_daily_dm view it contains only one day data */
SELECT 
    col1,
    col2,
    to_timestamp_tz('{data_interval_end}','YYYY-MM-DD HH24:MI:SS.FF6TZH:TZM') as processing_dttm
   FROM table_name;
   
 