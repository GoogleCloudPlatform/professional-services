from locust import HttpLocust, TaskSet, task
import random
import string
import json


class MyTaskSet(TaskSet):
    min_wait = 5000
    max_wait = 15000

    def on_start(self):
        languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'af', 'ar']
        prefix = ''.join(random.sample(string.ascii_lowercase, 8))
        number_of_user = 4 #The number of users that this test is going to talk about
        self.__user_details = [{'username': prefix + str(i), 'language': x} for i, x in enumerate(random.sample(languages, 5))]
        for user in self.__user_details:
            headers = {'content-type': 'application/json','Chat-Recipient': user["username"], 'Chat-Language': user["language"]}
            self.client.post("/chat/login/",  headers=headers)


    @task(1)
    def send(self):
        users = random.sample(self.__user_details,2)
        sender = users[0]
        recipient = users[1]
        payload = {"sender": sender["username"], "message": "Test Message", "language": sender["language"], "recipient": recipient["username"]}
        headers = {'content-type': 'application/json'}
        self.client.post("/chat/message", data=json.dumps(payload), headers=headers)

    @task(3)
    def receive(self):
        users = random.sample(self.__user_details,1)
        recipient = users[0]
        headers = {'Chat-Recipient': recipient["username"], 'Chat-Language': recipient["language"]}
        get_url = "/chat/message/"
        self.client.get(get_url,headers=headers )


class MyLocust(HttpLocust):
    task_set = MyTaskSet