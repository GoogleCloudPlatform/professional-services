# BigQuery-Tink Toolkit

## Overview
BigQuery offers [field-level AEAD encryption](https://cloud.google.com/bigquery/docs/reference/standard-sql/aead-encryption-concepts) using various [SQL encryption functions](https://cloud.google.com/bigquery/docs/reference/standard-sql/aead_encryption_functions). BigQuery implements this encryption using [Tink](https://developers.google.com/tink), a Google-created open source cryptography library. 

This toolkit provides a way to achieve interoperability between data encrypted in BigQuery and on-prem, or in other GCP analytics services (such as Dataproc). More specifically, this library provides utilities and examles on using Tink in a way that is compatible with BigQuery's AEAD encryption, for both deterministic and non-deterministic.

These samples assume that 1) Tink keysets (DEKs) are wrapped with GCP KMS keys (KEKs), and 2) these wrapped keysets are maintained a BigQuery lookup table. 

If on-prem systems are unable to query the BigQuery keysets lookup table, or are unable to call KMS to unwrap the keysets, then the on-prem systems must have some way to have the same keyset/DEK available in some other keystore.

While this toolkit uses Python, Tink has libraries for a number of [other langauges](https://github.com/google/tink#current-status). This toolkit can serve as a guide for implementing similar functionality in another language as required.

Important note: The code here is provided as a reference and should not be considered production-ready.

## Provided files

### tink_key_gen_and_upload.py
This script 1) generates a new Tink keyset, 2) encrypts it using a KMS KEK, and 3) uploads the resulting wrapped keyset to a BigQuery table. See the BigQuery documentation on [SQL column-level encryption with Cloud KMS keys](https://cloud.google.com/bigquery/docs/column-key-encrypt) for more.

Before use: set the values for SECURITY_DATASET and KEYSET_TABLE to the name of the BigQuery dataset and table where the wrapped keysets will be stored.

Assumed keysets table schema:
  ```
  kms_resource STRING,
  first_level_keyset BYTES,
  dataset_name STRING,
  table_name STRING,
  column_name STRING,
  associated_data STRING,
  permitted_access ARRAY<STRING>
```

Usage:
```
python tink_key_gen_and_upload.py \
--project="<PROJECT_ID>" \
--location="<LOCATION_ID>" \
--is_deterministic \
--key_ring_id="<KEYRING_ID>" \
--key_id="<KEY_ID>" \
--dataset_name="<DATASET_WHERE_THE_KEY_IS_USED_FOR_COLUMN_ENCRYPTION>" \
--table_name="<TABLE_WHERE_THE_KEY_IS_USED_FOR_COLUMN_ENCRYPTION>" \
--column_name="<COLUMN_TO_ENCRYPT>" \
--associated_data="<ASSOCIATED_DATA_VALUE>" \
--permitted_users="<COMMA_SEPARATED_LIST_OF_PERMITTED_USERS>"
```

### crypto_util.py 
This includes 2 utility classes - CipherManager and ColumnCipher. CipherManager is the recommended class to use. It acts as a wrapper for ColumnCipher objects, allowing the use of a single CipherManager to hold the Tink ciphers for multiple columns for a given table.

ColumnCipher unwraps the KMS-encrypted keysets and holds the Tink ciphers to use for encrypting or decrypting values using the `encrypt` and `decrypt` methods. It supports both deterministic and non-deterministic algorithms as supported by BigQuery. Ciphers are initialized upon first use of encrypy/decrypt. This is done so that xxxxxxxx. Note that after this point, the DEKs are held in a private var in the object and should be handled carefully.

CipherManager calls an [authorized table-valued function](https://cloud.google.com/bigquery/docs/reference/standard-sql/table-functions#authorized_table_functions) (TVF) in BigQuery to look up the retrieve the required keysets. An authorized function is used so that the querying system does not need to have access to the full base keysets table. The querying user is checked against the `permitted_access` array so that only permitted rows are returned. The TVF's SQL definition can be found in `CipherManager._retrieve_keysets`.


### spark_aead_example.py
A PySpark script that shows encrypting a couple of columns before writing them to BigQuery, as well as reading the table and decrypting the columns in Spark. The ColumnManager object is broadcast to reduce repeated instantiation. Variables for target BigQuery tables should first be set in file. 

Clusters will need to have the following Pip packages installed on creation: `tink, google-cloud-kms, google-cloud-bigquery`. The sample shows use of the BigQuery Storage Write API (not required) - at present, the [Spark-BigQuery connector](https://github.com/GoogleCloudDataproc/spark-bigquery-connector#direct-write-using-the-bigquery-storage-write-api) only supports this for Spark 2.4, so the supplied `image-version` should include Spark 2.4.

Sample creation command:
```
gcloud dataproc clusters create "cluster-abcd"
--region ${REGION}
--metadata 'PIP_PACKAGES=tink google-cloud-kms google-cloud-bigquery'
--initialization-actions gs://goog-dataproc-initialization-actions-${REGION}/python/pip-install.sh
--no-address
--single-node
--scopes='cloud-platform'
--image-version 1.5-debian10  # includes Spark 2.4
```

When submitting the PySpark job, `crypto_util.py` needs to be supplied along with the Spark file. As mentioned above, since the example uses the Write API, the Spark 2.4 version of the connector is specified.

Sample submit command:
```
gcloud dataproc jobs submit pyspark dataproc_aead_sample.py
--cluster "cluster-abcd"
--region=${REGION}
--jars gs://spark-lib/bigquery/spark-2.4-bigquery-0.23.2-preview.jar
--py-files crypto_util.py
```

