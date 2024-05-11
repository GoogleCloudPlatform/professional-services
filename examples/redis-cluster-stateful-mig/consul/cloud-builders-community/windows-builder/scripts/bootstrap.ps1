# Allow HTTPS
[Net.ServicePointManager]::SecurityProtocol = "tls12, tls11, tls"

# Upgrade Docker 
Stop-Service docker
invoke-webrequest -UseBasicparsing -Outfile docker.zip https://download.docker.com/win/static/
test/x86_64/docker-17.11.0-ce-rc3.zip
Expand-Archive docker.zip -DestinationPath $Env:ProgramFiles -Force
rm docker.zip
$newPath = "$env:ProgramFiles\docker;" + [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
[Environment]::SetEnvironmentVariable("PATH", $newPath, [EnvironmentVariableTarget]::Machine)
dockerd --register-service # not required if already installed
Start-Service docker

# Configure GCR
gcloud --quiet auth configure-Docker

# Install Git
Invoke-WebRequest -Uri https://github.com/git-for-windows/git/releases/download/v2.18.0.windows.1/MinGit-2.18.0-64-bit.zip -OutFile git.zip
Expand-Archive -Path git.zip -DestinationPath c:\Git
$env:Path += ";C:\Git\cmd"
git clone https://github.com/nof20/windows-builder.git
# Ignore errors for this, it works.
gcloud auth configure-docker

# Install Go
Invoke-WebRequest -Uri https://dl.google.com/go/go1.10.3.windows-386.msi -Outfile go.msi
go.msi /quiet
$env:Path += ";C:\Go\bin"
go version

