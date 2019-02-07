This is how to guide:

1) Install python 2.7 or above
2) Install pip
3) Get dependencies and requirements 
cd frontend/
pip install -r requirements.txt --user

4) Run the show
python app.py ${PROJECT_ID} ${BIGTABLE_INSTANCE_NAME} ${BIGTABLE_TABLE_NAME} ${BIGTABLE_FAMILY_NAME}

This will get the localhost:5000 running and ready for rumble
