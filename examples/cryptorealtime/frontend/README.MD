** Frontend setup only **
1) Install pip3 or above
2) Install pip
```
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py
sudo pip3 install virtualenv
virtualenv -p python3 venv
source venv/bin/activate
sudo apt -y --allow-downgrades install openjdk-8-jdk git maven google-cloud-sdk=271.0.0-0 google-cloud-sdk-cbt=271.0.0-0

```

3) Get dependencies and requirements
cd frontend/
pip install -r requirements.txt --user

4) Run the server (replace the variables with your instance names)
python app.py ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BIGTABLE_TABLE_NAME} ${BIGTABLE_FAMILY_NAME}

This will get the localhost:5000/stream or externalip:5000/stream running and you will abe to see this

![Real time chart](https://media.giphy.com/media/238teoXcI17pu3YOSP/giphy.gif)
