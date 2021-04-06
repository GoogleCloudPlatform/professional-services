# ------------------------------------------------------------------------------
# Main module will decide the program flow. It will connect with the
# cloudera manager and it checks for the installed cloudera version.
# According to the version, program flow will proceed and generate the PDF
# report.
# ------------------------------------------------------------------------------

# Importing required libraries
from imports import *
from PdfGenerator import *

cur_date = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

# Creating logger object
logger = get_logger(cur_date)

# Get Cloudera Distribution and Hadoop Version
hversion = os.popen("hadoop version").read()

# Direct code to respective function based on cloudera version
# Get User Input
if "CDH-7" in hversion:
    inputs = get_input(7)
    inputs["logger"] = logger
    inputs["cur_date"] = cur_date
    obj = PdfGenerator(inputs)
    obj.run()
elif "cdh6" in hversion:
    inputs = get_input(6)
    inputs["logger"] = logger
    inputs["cur_date"] = cur_date
    obj = PdfGenerator(inputs)
    obj.run()
elif "cdh5" in hversion:
    inputs = get_input(5)
    inputs["logger"] = logger
    inputs["cur_date"] = cur_date
    obj = PdfGenerator(inputs)
    obj.run()
else:
    inputs = get_input(0)
    inputs["logger"] = logger
    inputs["cur_date"] = cur_date
    obj = PdfGenerator(inputs)
    obj.run()

if os.path.exists("../../hadoop_assessment_report_{}.pdf".format(cur_date)):
    response = "\nHadoop Assessment tool has been successfully executed and report is available in the following location: \n{}".format(
        os.path.abspath("../../hadoop_assessment_report_{}.pdf".format(cur_date))
    )
else:
    if os.path.exists("../../hadoop_assessment_tool_{}.log".format(cur_date)):
        response = "\nUnable to generate PDF report, check logs for more details and log is available in the following location: \n{}".format(
            os.path.abspath("../../hadoop_assessment_tool_{}.log".format(cur_date))
        )
    else:
        response = "\nUnable to generate PDF report"
print(response)
