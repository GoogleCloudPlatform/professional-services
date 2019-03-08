** Frontend setup only **
1) Install python 2.7 or above
2) Install pip
```sudo apt install python2.7 python-pip -y```

3) Get dependencies and requirements 
cd frontend/
pip install -r requirements.txt --user

4) Run the server (replace the variables with your instance names)
python app.py ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BIGTABLE_TABLE_NAME} ${BIGTABLE_FAMILY_NAME}

This will get the localhost:5000/stream or externalip:5000/stream running and you will abe to see this 

![Real time chart](https://media.giphy.com/media/238teoXcI17pu3YOSP/giphy.gif)