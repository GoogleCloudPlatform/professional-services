from kfp import dsl

from config import IMAGE

@dsl.component(base_image=IMAGE)
def upload_model(
    project_id: str,
    region: str,
    model: dsl.Input[dsl.Model],
    display_name: str,
    serving_image: str,
    parent_model: str,
    uploaded_model: dsl.Output[dsl.Artifact],
    run: str,
    run_id: str
):
    from google.cloud import aiplatform
    import logging

    logging.info(f"Upload model for run {run} and run ID {run_id}")

    model_path = '/'.join(model.uri.split('/')[:-1]) # remove filename after last / - send dir rather than file

    vertex_model = aiplatform.Model.upload(
        project=project_id,
        location=region,
        display_name=display_name,
        artifact_uri=model_path,
        serving_container_image_uri=serving_image,
        parent_model=parent_model,
        labels={
            'run': run,
            'run_id': run_id
        }
    )

    uploaded_model.metadata['resourceName'] = f'{vertex_model.resource_name}@{vertex_model.version_id}'
    uploaded_model.uri = f'https://{region}-aiplatform.googleapis.com/v1/{vertex_model.resource_name}@{vertex_model.version_id}'

