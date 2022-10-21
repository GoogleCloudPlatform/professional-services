# service account for reddit VM
resource "google_service_account" "reddit_service_account" {
  account_id   = "${var.service_account_name}"
  display_name = "Reddit VM Service Account"
}

resource "google_project_iam_binding" "reddit_vm_compute" {
  project = "${var.project_id}"
  role    = "roles/compute.admin"
  members = [
    "serviceAccount:${google_service_account.reddit_service_account.email}"
  ]
}

resource "google_project_iam_binding" "reddit_vm_dataflow" {
  project = "${var.project_id}"
  role    = "roles/dataflow.admin"
  members = [
    "serviceAccount:${google_service_account.reddit_service_account.email}"
  ]
}

resource "google_project_iam_binding" "reddit_vm_pubsub" {
  project = "${var.project_id}"
  role    = "roles/pubsub.admin"
  members = [
    "serviceAccount:${google_service_account.reddit_service_account.email}"
  ]
}


resource "google_compute_instance" "reddit_vm" {
  name         = "reddit-data-collector-1"
  machine_type = "e2-micro"
  zone         = "us-central1-a"


  boot_disk {
    initialize_params {
      image = "centos-cloud/centos-7"
    }
  }

  network_interface {
    network = "default"

    access_config {
      // Ephemeral public IP
    }
  }

  metadata_startup_script = <<EOF
    echo \"install python and git...\"
    yum install python3 -y
    yum install git -y
    echo \"installing pip...\"
    curl https://bootstrap.pypa.io/pip/3.6/get-pip.py -o get-pip.py
    python3 get-pip.py
    python3 -m pip install --upgrade pip
    echo \"importing python libraries...\"
    python3 -m pip install praw
    python3 -m pip install pandas
    python3 -m pip install textblob
    python3 -m pip install better_profanity
    python3 -m pip install google-cloud-dataflow-client
    python3 -m pip install textstat
    python3 -m textblob.download_corpora
    python3 -m pip install google-cloud-pubsub
    echo \"downloads complete...\"
    echo \"creating dirs for git repo...\"
    mkdir reddit
    cd reddit
    git init
    git clone https://github.com/CYarros10/reddit-streaming-application.git
    echo \"git clone complete...\"
    cd reddit-streaming-application/app/
    echo \"current dir:\"
    pwd
    echo \"changing permissions\"
    chmod 777 comment-stream-detailed-gcp.py
    chmod 777 praw.ini
    echo \"updating scripts with custom info\"
    sed -i -r 's/<insert-project-id-here>/${var.project_id}/g' comment-stream-detailed-gcp.py
    sed -i -r 's/<insert-topic-id-here>/${var.pubsub_topic_name}/g' comment-stream-detailed-gcp.py
    sed -i 's/<insert-client-id-here>/${var.reddit_client_id}/g' praw.ini
    sed -i 's/<insert-client-secret-here>/${var.reddit_client_secret}/g' praw.ini
    sed -i 's/<insert-username-here>/${var.reddit_username}/g' praw.ini
    sed -i 's/<insert-password-here>/${var.reddit_password}/g' praw.ini
    echo \"starting stream\"
    python3 comment-stream-detailed-gcp.py funny askreddit todayilearned science worldnews pics iama gaming videos movies aww blog music news explainlikeimfive askscience books television mildlyinteresting lifeprotips space showerthoughts diy jokes sports gadgets nottheonion internetisbeautiful photoshopbattles food history futurology documentaries dataisbeautiful listentothis upliftingnews personalfinance getmotivated oldschool cool philosophy art writingprompts fitness technology bestof adviceanimals politics atheism europe &>> logs.txt
  EOF

  service_account {
    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    email  = "${google_service_account.reddit_service_account.email}"
    scopes = ["cloud-platform"]
  }
}

resource "google_pubsub_topic" "pubsub-topic" {
  name = "${var.pubsub_topic_name}"
  message_retention_duration = "86600s"
}

resource "google_bigquery_dataset" "comments" {
  dataset_id                  = "${var.bq_dataset_name}"
  friendly_name               = "${var.bq_dataset_name}"
  description                 = "Contains contents of reddit stream"
  location                    = "US"
}

resource "google_bigquery_table" "stream_raw" {
  dataset_id = google_bigquery_dataset.comments.dataset_id
  table_id   = "${var.bq_table_name}"
  deletion_protection = false
  schema = <<EOF
[
  {
    "name": "comment_id",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "subreddit",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "author",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_text",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "distinguished",
    "type": "BOOLEAN",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "submitter",
    "type": "BOOLEAN",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "total_words",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "reading_ease_score",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "reading_ease",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "reading_grade_level",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "sentiment_score",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "censored",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "positive",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "neutral",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "negative",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "subjectivity_score",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "subjective",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "url",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_date",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_timestamp",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_hour",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_year",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_month",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  },
  {
    "name": "comment_day",
    "type": "STRING",
    "mode": "NULLABLE",
    "description": ""
  }
]
EOF

}

resource "google_storage_bucket" "app_bucket" {
    name          = "${var.app_bucket}"
    location      = "US"
    force_destroy = true
}

resource "google_dataflow_job" "pubsub_stream" {
    name = "ps-to-bq-${var.pubsub_topic_name}"
    template_gcs_path = "gs://dataflow-templates-us-central1/latest/PubSub_to_BigQuery"
    temp_gcs_location = "gs://${google_storage_bucket.app_bucket.name}/dataflow/tmp"
    region = "us-central1"
    enable_streaming_engine = true
    parameters = {
      inputTopic = "${google_pubsub_topic.pubsub-topic.id}"
      outputTableSpec = "${var.project_id}:${var.bq_dataset_name}.${var.bq_table_name}"
    }
    on_delete = "cancel"
}
