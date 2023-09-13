```
Copyright 2023 Google. This software is provided as-is, without warranty or
representation for any use or purpose. Your use of it is subject to your
agreement with Google.
```

# Running voice-activated chatBot on Linux

# Enable APIs on GCP
The following is a list of the APIs that need to be enabled in GCP
- Speech-to-text API.
- Secret Manager API

## Install Libraries
```
$ sudo apt-get install python3-pip python-dev
$ sudo apt-get install ffmpeg
```

## Install Dependencies
```
$ pip install gradio==3.38.0 --use-deprecated=legacy-resolver
$ pip install --upgrade google-cloud-speech==2.21.0
$ pip install torch
```

If you face space issue try increasing CPU and Memory or you can create temp folder to cache torch in different folder as shown below:
```
$ pip install --cache-dir=/home/user/tmp torch
```

```
$ pip3 install google-cloud-secret-manager==2.10.0
$ pip3 install google-cloud-speech==2.21.0
```

## Service Account Access
The service account you're using to run the application shpuld have below IAM roles:
- Secret Manager Aecret Accessor
- Cloud Run Invoker (required to call LLM middleware if middleware is deployed in Cloud Run)

## Replace following parameters in ./app/config.ini to your value
```
SECRET_ID_IN_SECRET_MANAGER_FOR_PASSWORD: this is the secret id for the password secret created in the secret manager.
SECRET_MANAGER_PROJECT_ID: gcp project id where the application will load secrets from.
LLM_MIDDLEWARE_HOST_URL: host url for LLM middleware. URL looks like https://llm-middleware-sdnkdn12.a.run.app if the application is deployed in Cloud Run.
```

## How to run the application 
From the frontend/app folder run the following command
```
$ python3 main.py
```
## How to enable SSL and expose the application outside of VM
To enable SSL encryption and expose the application port outside of the VM, use the following launch command 
in main.py:

```
$ bot_interface.launch(server_name="0.0.0.0", 
      share=False,
      ssl_certfile="localhost.crt", 
      ssl_keyfile="localhost.key", 
      ssl_verify=False)
```