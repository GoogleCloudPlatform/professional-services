from google.cloud import storage

GCS_CLIENT = storage.Client()

def create_bucket():
    pass

def delete_file(file_path:str):
    bucket_name = file_path.split("/")[2]
    bucket = GCS_CLIENT.bucket(bucket_name)
    blob_path = ''.join(file_path.split("/")[3:])
    blob = bucket.blob(blob_path)
    blob.delete()

def read_file(file_path:str):
    bucket_name = file_path.split("/")[2]
    bucket = GCS_CLIENT.bucket(bucket_name)
    blob_path = ''.join(file_path.split("/")[3:])
    blob = bucket.blob(blob_path)

    data = ""

    with blob.open("r") as f:
        data = f.read()
    
    return data

def upload_file(bucket_name: str, file_path:str, destination_name: str):
    bucket = GCS_CLIENT.bucket(bucket_name)
    blob = bucket.blob(destination_name)
    blob.upload_from_filename(file_path)
    print("Uploaded to", destination_name)