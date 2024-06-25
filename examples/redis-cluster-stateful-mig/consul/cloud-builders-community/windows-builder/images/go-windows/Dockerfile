# escape=`
FROM mcr.microsoft.com/windows/servercore:1809 as builder

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

ADD git.zip .
ADD go.zip .

RUN Expand-Archive -Path git.zip -DestinationPath c:\Git -Force
RUN setx PATH '%PATH%;C:\Git\cmd'

RUN Expand-Archive -Path go.zip -DestinationPath c:\ -Force
RUN setx PATH '%PATH%;C:\go\bin'

ENTRYPOINT C:\go\bin\go.exe
