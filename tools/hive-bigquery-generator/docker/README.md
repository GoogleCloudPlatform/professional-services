# Docker Deployment

This application can be containerized using following command:

```
./run.sh
```

If above command finishes successfully, following command would show a new image with the latest version of data
validation application.

```buildoutcfg
docker images
```

Once your confirm that image of the data validation is available. You can run following command to run data validation
tool as a docker container. These commands are part of the above run script as well.

```buildoutcfg
 docker run -v ~/.config/:/root/.config --rm nikunjbhartia/hive-to-bigquery:latest -h
```
**Please note:** ~/.config/:/root/.config in above command mounts your VM's local .config directory with container's
.config directory. This allows users to store GCP service account as well as connection information needed by the tool on a VM.