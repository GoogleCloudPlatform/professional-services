# ALL Sparks Extension

## Description

This extension, named "ALL Saprks", facilitates code convertion between Databases and interact with APIs within Visual Studio Code.

## Features

1. Calling API Command : This Extension contributes a command named 'ALL Sparks.apiCall' that allows users to interact with APIs.
2. Webview Panel : Upon executing the 'ALL Sparks.apiCall' command, a webview panel titled "ALL Sparks" opens up in the editor.
3. Supports selection of programming language, source database, target language, and input code.
4. Displays API call results in the webview.


## Pre-requisites
You need to have node and npm installed on your system to run the examples. It is recommended to use the node version used for VS Code development itself which is documented here
* Npm commands to install (fs,express cros,express,path,child process).
* gcloud auth library and google cloud SDK to install.
* If you run the "npm install" the all dependencies of npm pacakage is to be installed.

## Usage

1. Open the command palette by pressing `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).
2. Type `ALL Sparks.apiCall` and press Enter to activate the extension.
3. Execute gcloud command : Click on the "execute gcloud command" button to initiate the authentication process and fetch an access token.
4. Conversion :
    - choose the desired options for programming language, source databse, target language, project ID, and location.
    - Enter code to bje converted into the provided textarea.
    - Click the "Submit" button to convert the code using the selected options.

The output of the conversion will be displayed below the form.

## Requirements

- Visual Studio Code : This extension is built for use with Visual studio code version 1.88.0 and above.

## Installation

1. Launch Visual Studio Code.
2. Go to the Extensions view by clicking on the square icon in the Sidebar.
3. Search for "ALL Sparks" extension and click Install.
4. Reload Visual Studio Code when prompted.

## Known Issues

There are currently no known issues.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## How It Works
![alt text](<ALL Sparks.gif>)

**Enjoy!**
