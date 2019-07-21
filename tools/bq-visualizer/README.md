# BigQuery Visualiser

This utility provides a web application which can be used to visualise the flow of execution stages within a BigQuery job. This may be useful in identifying problematic stages and provides greater usability for large query plans than the default query plan explanation in the Google Cloud Console.

## Manual

### Overview
BigQuery Visualiser displays a Bigquery Queryplan document. It has two displays:

* Query Tree
* Task Gant Chart

### Hosting BqVisualiser
BqVisualiser is a single page web app  written in angular. 
Simply copy the compiled output to a webserver and you are good to go.

### Authentication
On opening the page, the app will attempt to authenticate you with your Google account. Once done you will be able to access 
your projects.

### Downloading Query Plans
On the 'Select Job' tab there are two options:

* Download from Google Cloud

Under the card with this title:

1. Select a project from the listbox 
2. Click on 'List Jobs'
3. Scroll through the list of jobs and click on the Get button of the job you are interested in

* Upload from Computer

Assuming you have previously downloaded the query plan using the `bq show -j <jobid>i --format prettyjson` command to a local file, 
click on this card the 'Select File to upload' button, navigate to the file and select it. To start uploading click the
Upload button.

### The Tree Tab

The Tree tab shows the query plan as a directed graph. 

* DB icons represent BQ tabkes
* all other icons represent actual query stages (input, compute, aggregate, etc.)

All nodes can be selected. On selection the right hand side tabs called 'Stage Details' and 'Step Details' provide in depth information.

At the bottom a number of tabs show overall plan information:

* Overview (jobId etc)
* Status (running, completed)
* SQL used
* Timings
* Statistics
* Settings

### The Timing Tab
The timing Tab displaus a Gantt style view to quickly show how long the indivudal stages take.


## Known Limits

The application will only display graphs for queries. Load jobs etc do not result in query stages being output.
