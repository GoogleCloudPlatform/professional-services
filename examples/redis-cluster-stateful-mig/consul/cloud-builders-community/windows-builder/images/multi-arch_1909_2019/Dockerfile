# escape=`
ARG version
FROM mcr.microsoft.com/windows/servercore:${version}

SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop'; $ProgressPreference = 'SilentlyContinue';"]

RUN Set-Content C:\greeting.txt \"Hello container\"

CMD Get-Content C:\greeting.txt
