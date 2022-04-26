# Using with Cloud Storage

## gsutil cp 

This command is the only one which differs significantly from the non-mainframe version of the utility. The implementation of gsutil cp included with the BQSH interpreter requires a COBOL copybook to be provided with the COPYBOOK DD and a COBOL data file to be provided via the INFILE DD. The utility will open a configurable number of parallel connections to the Cloud Storage API and transcode the COBOL dataset to the columnar and GZIP compressed ORC file format on the fly. Users can expect about 35% compresstion ratio.

### Example JCL
```
//STEP01 EXEC BQSH
//INFILE DD DSN=<HLQ>.DATA.FILENAME,DISP=SHR
//COPYBOOK DD DISP=SHR,DSN=<HLQ>.COPYBOOK.FILENAME
//STDIN DD *
BUCKET=my-long-bucket-name-1234
gsutil cp --replace gs://$BUCKET/tablename.orc
/*
```


### Help text for gsutil cp
```
gsutil (gszutil-1.0.0)
Usage: gsutil [cp|rm] [options] destinationUri

  --help                   prints this usage text
Command: cp [options]
Upload Binary MVS Dataset to GCS
  --replace                delete before uploading
  --partSizeMB <value>     target part size in megabytes (default: 256)
  --batchSize <value>      blocks per batch (default: 1000)
  -p, --parallelism <value>
                           number of concurrent writers (default: 6)
  --timeOutMinutes <value>
                           timeout in minutes (default: 60)
```

## gsutil rm 

### Example JCL
```
//STEP01 EXEC BQSH
//INFILE DD DSN=<HLQ>.DATA.FILENAME,DISP=SHR
//COPYBOOK DD DISP=SHR,DSN=<HLQ>.COPYBOOK.FILENAME
//STDIN DD *
BUCKET=my-long-bucket-name-1234
gsutil cp --replace gs://$BUCKET/tablename.orc
/*
//COND02 IF (STEP01.RC = 0) THEN
//STEP02 EXEC BQSH
//STDIN DD *
PROJECT=my-long-project-name-1234
bq load --project_id=$PROJECT \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
//COND03 IF (STEP02.RC = 0) THEN
//STEP03 EXEC BQSH
//QUERY DD DSN=<HLQ>.QUERY.FILENAME,DISP=SHR 
//STDIN DD *
PROJECT=my-long-project-name-1234
bq query --project_id=$PROJECT \
  myproject:DATASET.TABLE \
  gs://bucket/tablename.orc/*
/*
```


### Help text for gsutil rm:
```
Usage: gsutil [cp|rm] [options] destinationUri

  --help                   prints this usage text
 Command: rm [options]
Delete objects in GCS
  -r, --recursive          delete directory
  -f, --force              delete without use interaction (always true)
  destinationUri           Destination URI (gs://bucket/path)
  --dataset_id <value>     The default dataset to use for requests. This flag is ignored when not applicable. You can set the value to [PROJECT_ID]:[DATASET] or [DATASET]. If [PROJECT_ID] is missing, the default project is used. You can override this setting by specifying the --project_id flag. The default value is ''.
  --location <value>       A string corresponding to your region or multi-region location.
  --project_id <value>     The project ID to use for requests. The default value is ''.
  --allow_non_ascii        allow non ascii characters
  --stats_table <value>    tablespec of table to insert stats
  --max_error_pct <value>  job failure threshold for row decoding errors (default: 0.0)
```






