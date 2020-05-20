

# Environment Variables
PROJECT_ID = "GOOGLE_CLOUD_PROJECT"
PUBSUB_TOPIC = "TOPIC"


# Data Examples
WEBHOOK_EXAMPLE = {
  "method": "GET",
  "url": "/alooma-prod/rest/metrics",
  "queryparams": {"metrics": "INPUT_INCOMING","from": "-10min","resolution": "10sec","inputLabel": "3ab43dsgsdgsfgs3-4d6dsf1b93a"},
  "user": {"id": 314,"email": "test@alooma.com","identity_provider_id": None,"is_admin": None,
  "accounts": [
      {
        "id": 12325,
        "account_name": "alooma",
        "company_name": None,
        "partner_id": None,
        "_pivot_user_id": 4153,
        "_pivot_account_id": 1875
      },
      {
        "id": 2041,
        "account_name": "alooma-prod",
        "company_name": None,
        "partner_id": None,
        "_pivot_user_id": 4153,
        "_pivot_account_id": 2041
      }
    ]
  },
  "statusCode": 304,
  "account": "alooma-prod",
  "host": "app.alooma.com",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/24523Safari/537.36",
  "responseTime": 50.056793,
  "requestBody": {},
  "fullUrl": "http://app.alooma.com/alooma-prod/rest/metrics?metrics=INPUT_INCOMING&from=-10min&resolution=10sec&inputLabel=332423dfssdd678ae1b93a",
  "responseBody": "",
  "remoteAddress": "23.18.142.69",
  "_metadata_dataset": "alooma",
  "_metadata_table": "log_test"
}
