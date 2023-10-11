FROM python:3.10 
WORKDIR /usr/src/app 

RUN apt-get update && apt-get install -y 
RUN apt-get install ffmpeg -y
COPY requirements.txt ./ 
RUN pip install --no-cache-dir -r requirements.txt 
COPY . . 
EXPOSE 8080
CMD [ "python", "./app/main.py" ] 