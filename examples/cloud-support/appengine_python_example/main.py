import os

from flask import Flask, render_template, request, redirect

import googleapiclient.discovery

from flask_bootstrap import Bootstrap

app = Flask(__name__)
bootstrap = Bootstrap(app)

SERVICE_NAME = "cloudsupport"
API_VERSION = "v2beta" 
API_DEFINITION_URL = ""
ORGANIZATION_ID = '1234567890' #TODO add organization ID: 
ORGANIZATION_AS_PARENT = 'organizations/' + ORGANIZATION_ID
API_DEFINITION_URL = "https://cloudsupport.googleapis.com/$discovery/rest?version=" + API_VERSION

#The snippet below generates the Support API client library from the API Discovery Document. 
supportApiService = googleapiclient.discovery.build(
    serviceName=SERVICE_NAME,
    version=API_VERSION,
    discoveryServiceUrl=API_DEFINITION_URL)

print("fetched Cloud Support API ")


@app.route("/")
def entry_point():
    return redirect('/index')

#The route below is the default home page, which uses a template to render the web form.

@app.route("/index")
def index():
    
    # The method below will log the "List Cases" method when the page loads.
    # This means that if the page loads successfully, the setup steps have been configured correctly.
    
    case_list = supportApiService.cases().list(parent=ORGANIZATION_AS_PARENT).execute()
    print("case list:" + str(case_list))
    return render_template('index.html', title="page")

# The route below is what is reached after you submit the webform, where 
# the Support API attempts to create a Support Case with the data from the form. 

@app.route("/create_support_case", methods=["POST"])
def create_support_case():
    component = request.form['component']
    project = request.form['project']
    impact = request.form['impact']
    googlemeet_link = request.form['googlemeet_link']
    subscribers = request.form['subscribers']
    comments = request.form['comments']

    app.logger.info("Calling API to create Support Case for "
                    "component=[%s], "
                    "project=[%s], "
                    "impact=[%s], "
                    "googlemeet_link=[%s], "
                    "subscribers=[%s], "
                    "comments=[%s]",
                    component, project, impact, googlemeet_link, subscribers, comments)

    # This try block attempts to create a page. If there aren't errors, a confirmation page is loaded.
    try:
        response_message = call_create_support_case_api(component, project, impact, googlemeet_link, subscribers, comments)
        return render_template('created_support_case.html', title="page",
                               created_meeting_id=googlemeet_link,
                               response_message=response_message["level"],
                               organization_id=ORGANIZATION_ID,
                               project_id=project,
                               case_id=response_message["case_id"],
                               error_message=response_message["error_message"])
    except Exception as e:
        error_message = "Exception occurred: can't create Support Case with input parameters " \
                        "component=[" + component + "], " \
                        "project=[" + project + "], " \
                        "impact=[" + impact + "], " \
                        "googlemeet_link=[" + googlemeet_link + "], " \
                        "subscribers=[" + subscribers + "], " \
                        "comments=[" + comments + "], because " + e.error_details
        print(e)
        return render_template('index.html', title="page", error_message=error_message)


# The method below actually calls the Create Case method from the Support API.
# It builds the JSON request body from the fields submitted from the web form.
def call_create_support_case_api(component, project, impact, googlemeet_link, subscribers, comments):
    display_name = "TEST CASE - Please Join Google Meet Link: " + googlemeet_link + " ASAP"

    if impact:
        display_name += " - " + impact

    if not comments:
        comments += display_name
    
    """
    The request_body below contains the details used when creating a support case. 

    Note that "testCase" is set to True. Cases with this flag won't be assigned to Google Support Engineers. 

    More details on possible fields can be found in our documentation here: https://cloud.google.com/support/docs/reference/rest/v2beta/cases

    """
    
    request_body = {
        'display_name': display_name,
        'description': build_description_value(project, impact, googlemeet_link, comments, ''),
        'classification': {
            
            'id': component
        },
        'time_zone': "-06:00",
        'testCase': True,        
        'subscriber_email_addresses': [email.strip() for email in subscribers.split(',')] if subscribers else [],
        'severity': "S3"
    }

    error_message = ""
    
    # If the project field was filled out in the form, it will create a case with the project as the "parent".
    # Otherwise, it will create the case with the "Organization" as the parent. 

    if project:
        try:
            create_case_response = supportApiService.cases()\
                .create(parent='projects/' + project, body=request_body)\
                .execute()

            return build_response(project, create_case_response)
        except Exception as e:
            error_message = "There was an issue creating the support case for project " + project + ", " \
                            "because: " + e.error_details + ". The Support Case will be created on org level."
            request_body['description'] = build_description_value(project, impact, googlemeet_link, comments, error_message)

    # The Create Case method from the Support API is called below.  
    create_case_response = supportApiService.cases()\
        .create(parent=ORGANIZATION_AS_PARENT, body=request_body)\
        .execute()

    result = build_response("organization", create_case_response)
    result["error_message"] = error_message

    return result


def build_response(level, create_case_response):
    return {
        "level": level,
        "case_id": create_case_response["name"].split('/')[3],
        "error_message": ""
    }

# The function below builds the string to be used for the Support Cases' description.
# The description is a required field, so in this example, it will be populated 
# even when multiple web form fields are empty. 
def build_description_value(project, impact, googlemeet_link, comments, error_message):
    description = ""
    if project:
        description += "Project Number: " + project + "\n"
    if impact:
        description += "Impact: " + impact + "\n"
    if googlemeet_link:
        description += "googlemeet Link: " + googlemeet_link + "\n"
    if comments:
        description += "Comments: " + comments + ". "

    if error_message:
        description += error_message

    return description

# The snippet below is boilerplate code for App Engine Standard applications.

if __name__ == '__main__':

    app.run(host='127.0.0.1', port=8080, debug=True)
