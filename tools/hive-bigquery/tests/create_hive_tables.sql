USE DEFAULT;
DROP TABLE text_nonpartitioned;
CREATE TABLE IF NOT EXISTS text_nonpartitioned( int_column INT,
                                                float_column FLOAT,
                                                double_column DOUBLE,
                                                decimal_column DECIMAL(10,2),
                                                string_column STRING,
                                                varchar_column VARCHAR(6),
                                                timestamp_column TIMESTAMP,
                                                boolean_column BOOLEAN,
                                                array_column ARRAY<INT>,
                                                map_column MAP<STRING,INT>,
                                                struct_column STRUCT<id:INT,season:STRING>,
                                                date_column DATE,
                                                string_categorical_column STRING
                                            )
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t' COLLECTION ITEMS TERMINATED BY ',' MAP KEYS TERMINATED BY ':' LINES TERMINATED BY '\n' STORED AS TEXTFILE;
LOAD DATA LOCAL INPATH '/tmp/generated_data.txt'
OVERWRITE INTO TABLE text_nonpartitioned;
SELECT * FROM text_nonpartitioned LIMIT 10;
SHOW CREATE TABLE text_nonpartitioned;


CREATE TABLE IF NOT EXISTS avro_nonpartitioned like text_nonpartitioned STORED AS AVRO;
INSERT OVERWRITE TABLE avro_nonpartitioned SELECT * FROM text_nonpartitioned;
SELECT * FROM avro_nonpartitioned LIMIT 10;
SHOW CREATE TABLE avro_nonpartitioned;

CREATE TABLE IF NOT EXISTS orc_nonpartitioned like text_nonpartitioned STORED AS ORC;
INSERT OVERWRITE TABLE orc_nonpartitioned SELECT * FROM text_nonpartitioned;
SELECT * FROM orc_nonpartitioned LIMIT 10;
SHOW CREATE TABLE orc_nonpartitioned;

CREATE TABLE IF NOT EXISTS parquet_nonpartitioned like text_nonpartitioned STORED AS PARQUET;
INSERT OVERWRITE TABLE parquet_nonpartitioned SELECT * FROM text_nonpartitioned;
SELECT * FROM parquet_nonpartitioned LIMIT 10;
SHOW CREATE TABLE parquet_nonpartitioned;


CREATE TABLE IF NOT EXISTS text_partitioned(  int_column INT,
                                float_column FLOAT,
                                double_column DOUBLE,
                                decimal_column DECIMAL(10,2),
                                string_column STRING,
                                varchar_column VARCHAR(6),
                                timestamp_column TIMESTAMP,
                                boolean_column BOOLEAN,
                                array_column ARRAY<INT>,
                                map_column MAP<STRING,INT>,
                                struct_column STRUCT<id:INT,season:STRING>
) PARTITIONED BY (date_column DATE, string_categorical_column STRING)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t' COLLECTION ITEMS TERMINATED BY ',' MAP KEYS TERMINATED BY ':' LINES TERMINATED BY '\n' STORED AS TEXTFILE;
set hive.exec.dynamic.partition.mode=nonstrict;
INSERT OVERWRITE TABLE text_partitioned PARTITION(date_column , string_categorical_column) SELECT * FROM text_nonpartitioned;
SELECT * FROM text_partitioned limit 10;
SHOW CREATE TABLE text_partitioned;
SHOW PARTITIONS text_partitioned;


CREATE TABLE IF NOT EXISTS avro_partitioned like text_partitioned STORED AS AVRO;
INSERT OVERWRITE TABLE avro_partitioned PARTITION(date_column , string_categorical_column) SELECT * FROM text_nonpartitioned;
SELECT * FROM avro_partitioned LIMIT 10;
SHOW CREATE TABLE avro_partitioned;
SHOW PARTITIONS avro_partitioned;

CREATE TABLE IF NOT EXISTS orc_partitioned like text_partitioned STORED AS ORC;
INSERT OVERWRITE TABLE orc_partitioned PARTITION(date_column , string_categorical_column) SELECT * FROM text_nonpartitioned;
SELECT * FROM orc_partitioned LIMIT 10;
SHOW CREATE TABLE orc_partitioned;
SHOW PARTITIONS orc_partitioned;

CREATE TABLE IF NOT EXISTS parquet_partitioned like text_partitioned STORED AS PARQUET;
INSERT OVERWRITE TABLE parquet_partitioned PARTITION(date_column , string_categorical_column) SELECT * FROM text_nonpartitioned;
SELECT * FROM parquet_partitioned LIMIT 10;
SHOW CREATE TABLE parquet_partitioned;
SHOW PARTITIONS parquet_partitioned;