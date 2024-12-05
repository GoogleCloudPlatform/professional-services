from google.cloud import eventarc_v1

def create_gcs_trigger(trigger_name: str, bucket_name:str,
    cloud_run_service: str, cloud_run_region: str, service_account: str,
    project_name: str, project_region: str, trigger_id: str):

    client = eventarc_v1.EventarcClient()

    trigger = eventarc_v1.Trigger()
    trigger.name = trigger_name
    trigger.event_filters = [
        {'attribute':'type','value':'google.cloud.storage.object.v1.finalized'},
        {'attribute':'bucket','value': bucket_name}]
    trigger.destination={"cloud_run":
        {'service': cloud_run_service,
        'region': cloud_run_region
        }
    }
    trigger.service_account = service_account

    request = eventarc_v1.CreateTriggerRequest(
        parent='projects/'+ project_name + '/locations/' + project_region,
        trigger=trigger,
        trigger_id=trigger_id,
        validate_only=False,
    )

    operation = client.create_trigger(request=request)
    return operation.result()