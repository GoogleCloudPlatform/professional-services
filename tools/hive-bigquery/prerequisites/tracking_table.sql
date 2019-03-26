CREATE TABLE IF NOT EXISTS tracking_table_info (
hive_database VARCHAR(255),
hive_table VARCHAR(255),
bq_table VARCHAR(1024),
tracking_table_name VARCHAR(64),
inc_col_present BOOLEAN,
inc_col_name VARCHAR(255),
inc_col_type VARCHAR(25)
)