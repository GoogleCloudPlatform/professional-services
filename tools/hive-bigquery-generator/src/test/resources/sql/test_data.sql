
drop table hive_ext_complex;
CREATE EXTERNAL TABLE hive_ext_complex (
  numeric_int int,
  complex_arr_integer array<integer>,
  complex_arr_string array<string>,
  complex_arr_timestamp array<timestamp>,
  complex_struct struct<numeric_integer: integer, numeric_double: double, dt_timestamp: timestamp, str_col: string, bool_col: boolean>,
  complex_arr_struct array<struct<numeric_integer: integer, str_col: string>>
)
PARTITIONED BY (
  day date,
  ts timestamp
)
 STORED AS ORC
 LOCATION
   'gs://fk-data-validation-demo-warehouse-1/reference/hive_ext_complex';

insert into hive_ext_complex values
    (1,array(1,2,3),array("1"),array(current_timestamp()),named_struct("numeric_integer", 1,"numeric_double",cast(1 as double),"dt_timestamp", current_timestamp(),"str_col","1","bool_col",true),array(named_struct("numeric_integer",1,"str_col", "1")),"2014-12-12","2014-12-12 12:34:56");


