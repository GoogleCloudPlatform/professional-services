@echo off

rem Configures the Oauth screen and client in the GCP project to use with the Chrome Extension
rem
rem Copyright 2024 Google LLC. All Rights Reserved.
rem
rem Licensed under the Apache License, Version 2.0 (the "License");
rem you may not use this file except in compliance with the License.
rem You may obtain a copy of the License at
rem
rem    http://www.apache.org/licenses/LICENSE-2.0
rem
rem Unless required by applicable law or agreed to in writing, software
rem distributed under the License is distributed on an "AS IS" BASIS,
rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
rem See the License for the specific language governing permissions and
rem limitations under the License.

rem Configures the OAuth screen and client in the GCP project to use with the Chrome Extension
rem Requirements:
rem - gcloud installed and authentication configured

:GETOPS
    if "%~1"=="" GOTO ENDGETOPS
    if "%~1"=="--account" (set ACCOUNT=%~2)    
    if "%~1"=="--project" (set PROJECT_ID=%~2)
    shift
    GOTO GETOPS
:ENDGETOPS

setlocal EnableDelayedExpansion

rem Check if a project ID argument is provided
if "!PROJECT_ID!"=="" (
    rem If no argument, try to get default project ID from gcloud
    @set PROJECT_ID=
    for /f %%a in ('gcloud config get-value project') do @set PROJECT_ID=%%a

    echo obtained project ID: !PROJECT_ID! 
    rem Check if a default project ID was found
    if "!PROJECT_ID!"=="" (
        echo Error: Please provide a project ID as an argument or set a default project in gcloud.
        exit /b 1
    ) 
)

rem Validate the project ID (basic format check)
echo Validating project ID: !PROJECT_ID!
if not "!PROJECT_ID!"=="%PROJECT_ID:[a-z0-9-]=%" (
    echo Error: Invalid project ID format.
    exit /b 1
)

rem Check if the account argument is provided
if "!ACCOUNT!"=="" (
    rem If no argument, try to get default account from gcloud
    for /f %%b in ('gcloud config get-value account') do @set ACCOUNT=%%b

    echo obtained account: !ACCOUNT! 
    rem Check if a default account was found
    if "!ACCOUNT!"=="" (
        echo Error: Please provide an account as an argument or set a default account in gcloud.
        exit /b 1
    ) 
)

rem Check if IAP API is Enabled
gcloud services list --enabled --project !PROJECT_ID! | findstr "iap.googleapis.com" >nul
if %errorlevel% neq 0 (
    echo IAP API is not enabled. Enabling...
    CALL gcloud services enable iap.googleapis.com --project !PROJECT_ID!
)

rem Set the project Id in the chrome extension
echo Using project !PROJECT_ID! for the Chrome Extension...
powershell -Command "(Get-Content ..\scripts\gcpApiCall.js) -replace '__PROJECT_ID__', '!PROJECT_ID!' | Set-Content ..\scripts\gcpApiCall.js"


rem Create IAP OAuth consent screen using gcloud
echo Creating IAP OAuth consent screen for project: !PROJECT_ID!
set CREATE_CONSENT_SCREEN=gcloud iap oauth-brands create --application_title="all-spark" --support_email=!ACCOUNT! --project=!PROJECT_ID!
!CREATE_CONSENT_SCREEN!
rem Check the exit code of the gcloud command
if %errorlevel% neq 0 (
    echo Error: Failed to create IAP OAuth consent screen. Check the gcloud output for details.
    exit /b 1
)

echo OAuth configuration created successfully in GCP project %PROJECT_ID%.

endlocal

set PROJECT_ID=
set ACCOUNT=
set CREATE_CONSENT_SCREEN=
