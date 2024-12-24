from airflow.decorators import task


@task
def get_filenames(file_dict, table_name):
    return file_dict[table_name]


def empty_function_for_result_push():
    return


def attach_tags(config_list: list[dict]) -> list[dict]:
    for c in config_list:
        tags = []
        if c.get("database_type"):
            tags.append(c.get("database_type"))
        else:
            tags.append("sftp")
        tags.append("dynamic_dag")
        c["tags"] = tags
    return config_list
