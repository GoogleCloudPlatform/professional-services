CREATE TABLE `test-datahub.test1.Enterprise_Data_Catalog_Master_Landing`
(
  projectName STRING,
  datasetName STRING,
  tableName STRING,
  columnName STRING,
  level STRING,
  tagTemplate STRING,
  tagFlag BOOL,
  activeFlag BOOL,
  mode STRING,
  tag ARRAY<STRUCT<key STRING, value STRING>>,
  createTimestamp TIMESTAMP,
  UpdateTimestamp TIMESTAMP,
  id STRING OPTIONS(description=""md5 hash of primary columns"")
);

CREATE TABLE `test-datahub.test1.Enterprise_Data_Catalog_Master`
(
  projectName STRING,
  datasetName STRING,
  tableName STRING,
  columnName STRING,
  level STRING,
  tagTemplate STRING,
  tagFlag BOOL,
  activeFlag BOOL,
  mode STRING,
  tag ARRAY<STRUCT<key STRING, value STRING>>,
  createTimestamp TIMESTAMP,
  UpdateTimestamp TIMESTAMP,
  id STRING
);
