


def get_params_from_msg(last_user_message):
    # e.g.: project_id=your-project-id,dataset_id=your_dataset,gcs_folder=20250807102755
    params = last_user_message.split(",")
    project_id, dataset_id, gcs_folder = None, None, None
    if len(params) != 3:
        return project_id, dataset_id, gcs_folder
    for param in params:
        if "=" not in param:
            break
        if param.split("=")[0] == "project_id":
            project_id = param.split("=")[1]
            continue
        if param.split("=")[0] == "dataset_id":
            dataset_id = param.split("=")[1]
            continue
        if param.split("=")[0] == "gcs_folder":
            gcs_folder = param.split("=")[1]
            continue
    print("project_id, dataset_id, gcs_folder", project_id, dataset_id, gcs_folder)
    return project_id, dataset_id, gcs_folder
