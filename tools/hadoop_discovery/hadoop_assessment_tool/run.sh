#!bin/bash
var=0
# Activate python environment
source $PWD/python_environment/venv/bin/activate
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Unable to activate python environment"
    exit 1
fi
#Go to the code directory
cd $PWD/python_environment/codebase/ 2>/dev/null
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Directory Issue"
	exit 1
fi
#run python file which will generate the pdf
python3 __main__.py 2>/dev/null
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Unable to run Hadoop Assessment tool, check logs for more info"
	exit 1
fi
deactivate
cd ../..