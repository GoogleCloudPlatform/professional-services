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

rem Replaces the OAuth Client Id in the configuration of the Chrome extension

rem Check if number of arguments is correct
if "%~1%"=="" (
  echo Error: Please provide a client id as an argument.
  echo Usage: clientIdUpdater.bat "111111111111-aaaaaa11a111aaa111aaaaaaaaaa1a11a.apps.googleusercontent.com"
  exit /B 1
)

set CLIENT_ID=%~1

rem Set the project Id in the chrome extension
echo Using client id %CLIENT_ID% for the Chrome Extension...

rem Perform in-place replacement using FINDSTR with escape character (^)
powershell -Command "(Get-Content ..\manifest.json) -replace '__CLIENT_ID__', '%CLIENT_ID%' | Set-Content ..\manifest.json"

echo Client id updated successfully.

set CLIENT_ID=
