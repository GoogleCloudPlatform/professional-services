from kfp import dsl
from google_cloud_pipeline_components.types.artifact_types import VertexEndpoint

from config import IMAGE

@dsl.component(base_image=IMAGE)
def model_monitoring(
    project_id: str,
    region: str,
    endpoint: dsl.Input[VertexEndpoint],
    pipeline_id: str,
    bq_train_data: str, # bq://mco-mm.bqmlga4.train
    skew_threshold: float,
    sampling_rate: float,
    monitoring_interval_hours: int,
    user_emails: list
):
    
    from google.cloud import aiplatform
    from google.cloud.aiplatform import model_monitoring
    from train import TARGET_COLUMN
    import logging

    bq_train_data = "bq://" + bq_train_data

    skew_config = model_monitoring.SkewDetectionConfig(
        data_source= bq_train_data,
        skew_thresholds=skew_threshold, # pass float to set one value across all featues, or dict to vary threshold by feature.
        target_field=TARGET_COLUMN,
    )

    objective_config = model_monitoring.ObjectiveConfig(skew_detection_config=skew_config)


    # Create sampling configuration
    random_sampling = model_monitoring.RandomSampleConfig(sample_rate=sampling_rate)

    # Create schedule configuration
    schedule_config = model_monitoring.ScheduleConfig(monitor_interval=monitoring_interval_hours)

    # Create alerting configuration.
    alerting_config = model_monitoring.EmailAlertConfig(
        user_emails=user_emails, enable_logging=True
    )

    endpoint_uri = endpoint.metadata['resourceName']
    logging.info("Endpoint URI is " + endpoint_uri)
    logging.info("Using google_cloud_aiplatform " + aiplatform.__version__)
    logging.info("Training data: " + bq_train_data)

    # Create the monitoring job.
    job = aiplatform.ModelDeploymentMonitoringJob.create(
        display_name=pipeline_id + "-monitoring",
        logging_sampling_strategy=random_sampling,
        schedule_config=schedule_config,
        alert_config=alerting_config,
        objective_configs=objective_config,
        project=project_id,
        location=region,
        endpoint=endpoint_uri
    )
    logging.info("Job: " + job)