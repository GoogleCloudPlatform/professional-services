$projectID = gcloud config get-value project

[Net.ServicePointManager]::SecurityProtocol = "tls12, tls11, tls"
$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = "Stop"

function Get-GitURL {
    Invoke-RestMethod -Uri https://api.github.com/repos/git-for-windows/git/releases/latest `
    | Select-Object -ExpandProperty "assets" `
    | Where-Object { $_.name -match "^MinGit-\d+\.\d+\.\d+-64-bit.zip$" } `
    | Select-Object -First 1 -ExpandProperty "browser_download_url"
}
$git_url=Get-GitURL

Write-Host "Downloading Git ($git_url)"
Invoke-WebRequest -Uri $git_url -OutFile git.zip

function Get-GoTags {
    for ($page=0;; $page++) {
        $resp = Invoke-RestMethod -Uri https://api.github.com/repos/golang/go/tags?page=$page
        If ($resp.Length -eq 0) {
            # Ran out of pages, bail.
            break
        }

        $resp | Select-Object -Property name `
        | Foreach-Object { if ($_ -match 'go(1\.\d+\.\d+)') { $matches[1]} }
    }
}

$latest_go = Get-GoTags | Sort-Object -Descending {[version] $_} | Select-Object -First 1
$go_url = "https://dl.google.com/go/go$latest_go.windows-386.zip"
Write-Host "Downloading Go $latest_go ($go_url)"
Invoke-WebRequest -Uri $go_url -Outfile go.zip

gcloud --quiet auth configure-docker

Write-Host "Running Docker build"
docker build -t gcr.io/$projectID/go-windows .
if ($?) {
    docker push gcr.io/$projectID/go-windows
    if ($?) {
        Write-Host "Successfully pushed!"
    } else {
        Write-Host "Failed to push..."
        exit 1
    }
} else {
    Write-Host "Failed to build docker image"
    exit 1
}
