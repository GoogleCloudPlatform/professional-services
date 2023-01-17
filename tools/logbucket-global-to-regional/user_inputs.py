
log_bucket_region = ""  # Region where new log bucket needs to be created. Eg: us-central1
log_bucket_name = "Default"  # Log bucket name for new log bucket, generally "Default".

organization_id = "123456789"  # Organization ID

list_projects = True  # If False: list_all_projects won't run. Provide the list of projects in projectListFile below.

# If you don't want certain folders to be scanned for projects, you can skip.
# exclude_folders = {"123456", "123455678"}
exclude_folders = {""}  # A set. Folder IDs to skip during listing

# If you don't want certain projects to be listed, you can skip.
# exclude_projects = {"project_id1", "project_id2"}
exclude_projects = {""}  # A set. Project IDs to skip during listing

# If you already have a project list, provide the  projects list file location. See sample_projectid.txt
projectListFile = "sample_projectid.txt"

log_level = "INFO" # Log levels: INFO, DEBUG, etc., 