# escape=`
FROM microsoft/windowsservercore:1803 as builder

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

ENV DOCKER_DOWNLOAD_URL https://download.docker.com/win/static/test/x86_64/docker-17.11.0-ce-rc3.zip
RUN Invoke-WebRequest -Uri $env:DOCKER_DOWNLOAD_URL -OutFile 'docker.zip'
RUN Expand-Archive -Path docker.zip -DestinationPath .

FROM microsoft/windowsservercore:1803
USER ContainerAdministrator

COPY --from=builder ["docker\\docker.exe", "C:\\Program Files\\docker\\docker.exe"]

RUN setx PATH "%PATH%;C:\Program Files\docker"

ENTRYPOINT docker.exe
