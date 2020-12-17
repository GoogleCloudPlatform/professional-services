from flask import Flask
import pymysql

app = Flask(__name__)
@app.route('/query', methods=['GET'])
# @app.route('/test', methods=['get'])
def querymysql():
    timeout = 10

    connection = pymysql.connect(
        charset="utf8mb4",
        connect_timeout=timeout,
        cursorclass=pymysql.cursors.DictCursor,
        db="spear",
        host="mysql-2ef1f049-liao-bbdb.aivencloud.com",
        password="umc1glg56wiukcjn",
        read_timeout=timeout,
        port=16651,
        ssl={"ca": "./ca.pem"},
        user="avnadmin",
        write_timeout=timeout,
    )  
    try:
        ###############query data
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            #pymysql.cursors.DictCursor:convert query data to dictionary
            # Read a single record
            sql = "SELECT * FROM test"
            cursor.execute(sql)
            result = cursor.fetchall()
            print(result)
            return str(result)
    finally:
        connection.close()




