** Frontend setup only **
1) Install python 3.7 or above
2) Install pip
```bash
sudo apt install python3 python-pip -y
```

3) Get dependencies and requirements 
```bash
cd frontend/
pip3 install -r requirements.txt --user
```

4) Run the server (replace the variables with your instance names)
```bash
python3 app.py \
  ${PROJECT_ID} \
  ${BIGTABLE_INSTANCE_NAME} \
  ${BIGTABLE_TABLE_NAME} \
  ${BIGTABLE_FAMILY_NAME}

This will get the `localhost:5000/stream` or `externalip:5000/stream` running and you will abe to see this 

![Real time chart](https://media.giphy.com/media/238teoXcI17pu3YOSP/giphy.gif)
