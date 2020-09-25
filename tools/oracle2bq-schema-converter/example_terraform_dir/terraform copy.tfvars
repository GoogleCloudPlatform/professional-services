project_id                  = "project_id"
  default_table_expiration_ms = null
  dataset_labels = {
    env      = "dev"
    workload = "hr"
    owner    = "sametkaradag"
  }

tables = [
  {
    table_id = "COUNTRIES",
    schema   = "schemas/COUNTRIES.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "DEPARTMENTS",
    schema   = "schemas/DEPARTMENTS.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "EMPLOYEES",
    schema   = "schemas/EMPLOYEES.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "JOBS",
    schema   = "schemas/JOBS.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "JOB_HISTORY",
    schema   = "schemas/JOB_HISTORY.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "LOCATIONS",
    schema   = "schemas/LOCATIONS.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
  {
    table_id = "REGIONS",
    schema   = "schemas/REGIONS.json",
    time_partitioning = null
    expiration_time = null,
    clustering      = null,
    labels = {
      env      = "dev"
      workload = "hr"
      owner    = "sametkaradag"
    },
  },
]