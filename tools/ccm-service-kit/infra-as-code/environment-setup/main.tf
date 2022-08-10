terraform {
    backend "gcs" {
        #TODO: Set bucket to store tfstate
        # bucket  = ""
        prefix  = "terraform_setup/state"
    }
}

module "ccm_base" {
    source = "../modules/ccm-base"

    project_id              = var.project_id
    project_number          = var.project_number
    region                  = var.region
    zone                    = var.zone

    bigquery = {
        location        = var.bigquery_location
        final_dataset_iam_members = [
            {
                role        = "roles/bigquery.dataEditor"
                member      = "serviceAccount:${module.ccm_base.ccm_service_account}"
            }
        ]
        staging_dataset_iam_members = [
            {
                role        = "roles/bigquery.dataEditor"
                member      = "serviceAccount:${module.ccm_base.ccm_service_account}"
            }
        ]
    }
    ccm-trigger-pubsub-topic = var.ccm-trigger-pubsub-topic
    ccm-delete-pubsub-topic = var.ccm-delete-pubsub-topic
    ccm-scheduler-trigger-name = var.ccm-scheduler-trigger-name
    ccm-scheduler-trigger-frecuency = var.ccm-scheduler-trigger-frecuency
}