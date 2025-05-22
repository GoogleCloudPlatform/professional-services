from google.cloud import secretmanager
from github import Github
from github import Auth
import vertexai
from vertexai.generative_models import (GenerativeModel)
import json
import os


def get_secret(secret_id, project_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    secret_payload = response.payload.data.decode("UTF-8")
    return json.loads(secret_payload)


def create_files(repo, file_name, commit_comment, file_content, branch):
    try:
        repo.create_file(file_name, commit_comment, file_content, branch=branch)
        print(f"File {file_name} created")
    except:
        contents = repo.get_contents(file_name, ref=branch)
        repo.update_file(contents.path,
                         commit_comment,
                         file_content,
                         contents.sha,
                         branch=branch)
        print(f"File {file_name} updated")


def main(request):
    request_json = request.get_json(silent=True)

    read_repo_name = request_json["read_repo_name"]
    read_branch = request_json["read_branch"]
    write_repo_name = request_json["write_repo_name"]
    write_branch = request_json["write_branch"]
    paths = request_json["paths"]
    model_id = request_json["model_id"]
    system_instruction = request_json["system_instruction"]
    question = request_json["question"]

    github_token = get_secret("github_token",
                              os.environ.get("PROJECT_ID"))["github_token"]
    auth = Auth.Token(github_token)
    g = Github(auth=auth)

    read_repo = g.get_repo(read_repo_name)
    write_repo = g.get_repo(write_repo_name)

    #Initializing Vertex
    vertexai.init(project=os.environ.get("PROJECT_ID"), location="us-east4")
    # Set Context
    MODEL_ID = model_id
    model = GenerativeModel(MODEL_ID, system_instruction=system_instruction)

    for path in paths:
        file_content=read_repo.\
            get_contents(path,ref=read_branch)\
                .decoded_content.decode("UTF-8")
        print("Path reviewed")

        # Set the prompt
        prompt = f"""
                    Questions: {question}

                    Code:

                    {file_content}"""
        contents = [prompt]

        # Generate text using non-streaming method
        response = model.generate_content(contents)\
            .text.removeprefix("```sql\n")\
                .replace("```","")\
                    .removeprefix("lookml").\
                        removeprefix("python")
        create_files(repo=write_repo,
                     file_name=path,
                     commit_comment="Code translation proposal",
                     file_content=response,
                     branch=write_branch)
        print("Process completed for given file")

    print("Request received")
    return "Successful Execution!"
