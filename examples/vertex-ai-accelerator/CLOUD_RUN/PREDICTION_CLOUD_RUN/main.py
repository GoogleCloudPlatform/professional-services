from flask import Flask, request
import json
import logging
from google.cloud import aiplatform
from google.protobuf import json_format
from google.protobuf.struct_pb2 import Value

app = Flask(__name__)

class RedisSingletonClass():
    redis_instance = None
    def get_intance(self):
        import redis
        if self.redis_instance is None:
            redis_host = '10.96.176.3'
            redis_port = int(6379)
            redis_client = redis.StrictRedis(host=redis_host, port=redis_port)
            self.redis_instance = redis_client
        return self.redis_instance

class PredictionServiceSingletonClass():
    prediction_service_instance = None
    def get_intance(self):
        if self.prediction_service_instance is None:
            api_endpoint="us-central1-aiplatform.googleapis.com"
            client_options = {"api_endpoint": api_endpoint}
            prediction_service_instance = aiplatform.gapic.PredictionServiceClient(client_options=client_options)
            self.prediction_service_instance = prediction_service_instance
        return self.prediction_service_instance

class FeatureStoreSingletonClass():
    feature_store_service_instance = None
    def get_intance(self):
        if self.feature_store_service_instance is None:
            from google.cloud import aiplatform
            PROJECT_ID="mlops-experiment-v2"
            REGION="us-central1"
            FEATURESTORE_ID="mlops_experiment_feature_store"
            aiplatform.init(project=PROJECT_ID, location=REGION)
            my_entity_type = aiplatform.featurestore.EntityType(
                    entity_type_name='graph', featurestore_id=FEATURESTORE_ID
            )
            self.feature_store_service_instance = my_entity_type
        return self.feature_store_service_instance



redis_instance=RedisSingletonClass()
redis_client=redis_instance.get_intance()

prediction_service_instance=PredictionServiceSingletonClass()
prediction_service_instance_client=prediction_service_instance.get_intance()

feature_store_service_instance=FeatureStoreSingletonClass()
feature_store_service_instance_client=feature_store_service_instance.get_intance()

project="1038839645731"
endpoint_id="7855355271529365504"
location="us-central1"


@app.route('/', methods=['POST'])
def index():
    logging.info('new request..')
    try:
        request_data=request.json
        redis_client=redis_instance.get_intance()
        prediction_service_instance_client=prediction_service_instance.get_intance()
        feature_store_service_instance_client=feature_store_service_instance.get_intance()
        
        entity_ids =json.loads(redis_client.get(request_data['location']))
                
        instances_data=[]
        for index in range(0,len(entity_ids),100):
            my_dataframe = feature_store_service_instance_client.read(entity_ids=entity_ids[index:index+100], feature_ids=["feature_1_score", "feature_2_score", "feature_3_score","feature_4_score", "feature_5_score", "feature_6_score","feature_7_score", "feature_8_score", "feature_9_score", "feature_10_score"])
            my_dataframe=my_dataframe[["feature_1_score", "feature_2_score", "feature_3_score","feature_4_score", "feature_5_score", "feature_6_score","feature_7_score", "feature_8_score", "feature_9_score", "feature_10_score"]]
            instances_data.extend(my_dataframe.to_dict('records'))
         
        parameters_dict = {}
        parameters = json_format.ParseDict(parameters_dict, Value())
        endpoint = prediction_service_instance_client.endpoint_path(
            project=project, location=location, endpoint=endpoint_id
        )
        response = prediction_service_instance_client.predict(
            endpoint=endpoint, instances=instances_data, parameters=parameters
        )
        predictions = response.predictions
        result_data=[]
        for index in range(0,len(predictions)):
            result_data.append({"entity_id":entity_ids[index],"prediction":predictions[index]})
        
        return str(json.dumps(result_data)), 200
    except Exception as e:
        logging.info("error",e)
        return str(e), 500

app.config['DEBUG'] = True

if __name__ == '__main__':
    
    app.run()
    
# Sample CURL Request
# curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" https://online-prediction-cloud-run-ubpi2omhja-uc.a.run.app -X POST  -H 'Content-Type: application/json' -d '{\"location\":\"A\""}'