#!bin/bash
var=0
python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))' | grep -E '3.3|3.4|3.5|3.9'  > /dev/null
var=$?
if [ $var -eq 0 ]
then
    echo "ERROR - Python version not satisfied"
    exit 1
fi
if [ $var -eq 1 ]
then
    echo "*****************************************************************"
    echo "INFO - Python version satisfied"
    echo "*****************************************************************"
fi
echo "Python version "$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')" detected"
python3 --version &>/dev/null
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Python version error"
    exit 1
fi
flag=0
hat_check=0
touch hat_file.txt
echo $hat_check > hat_file.txt
val=$?
if [ $var -eq 127 ]
then
    if [ $val -eq 0 ]
    then
        python3.8 os_package_installer.py
        check=$?
        if [ $check -eq 0 ]
        then
            value="0"
            if [ -e hat_latest_flag.txt ]
            then
                value=$(<hat_latest_flag.txt)
            fi
            rm -rf hat_latest_flag.txt
            if [ $value -eq "1" ]
            then
                echo "ERROR - OS Packages not Installed Successfully"
                exit 1
            fi
        fi
    fi
    flag=8
else
    if [ $val -eq 0 ]
    then
        python3 os_package_installer.py
        check=$?
        if [ $check -eq 0 ]
        then
            value="0"
            if [ -e hat_latest_flag.txt ]
            then
                value=$(<hat_latest_flag.txt)
            fi
            rm -rf hat_latest_flag.txt
            if [ $value -eq "1" ]
            then
                echo "ERROR - OS Packages not Installed Successfully"
                exit 1
            fi
        fi
    fi
    flag=6
fi
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Packages are not Installed"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "INFO - OS Dependencies Installed "
    echo "###########################################################################################################"
    echo "During python installation, some error messages might pop up , but those can be ignored if last message says,"
    echo "Python Dependencies Installed Successfully"
    echo "############################################################################################################"
fi
# remove old environment directory
rm -rf python_environment
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Old environment not removed - Directory Issue"
    exit 1
fi
# create a new directory for python virtual environment
mkdir python_environment
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cannot create a new Directory"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "*****************************************************************"
    echo "INFO - New Directory created for python environment"
fi
if [ $flag -eq 6 ]
then
    python3 python_package_installer.py
fi
if [ $flag -eq 8 ]
then
    python3.8 python_package_installer.py
fi
var=$?
if [ $var -eq 1 ]
then
    echo "*****************************************************************"
    echo "ERROR - Virtual Environment is not created"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "*****************************************************************"
    echo "INFO - Virtual Environment created successfully"
fi
# Activate python environment
source $PWD/python_environment/venv/bin/activate
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Source not found"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "*****************************************************************"
    echo "INFO - Python environment activated"
fi
# Copy offline packages into new virtual environment for installation
cp -r $PWD/packages $PWD/python_environment/packages
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cannot copy package folder in new environment"
    exit 1
fi
if [ $var -eq 0 ]
then
echo "*****************************************************************"
echo "INFO - Packages moved to python environment"
fi
pip3 install pip==21.0.1 --no-index --no-deps --find-links $PWD/python_environment/packages/
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cannot update pip in python environment"
    exit 1
fi
if [ $var -eq 0 ]
then
echo "*****************************************************************"
echo "INFO - Pip updated in python environment"
fi
pip3 install wheel --no-index --no-deps --find-links $PWD/python_environment/packages/
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cannot install wheel in python environment"
    exit 1
fi
if [ $var -eq 0 ]
then
echo "*****************************************************************"
echo "INFO - Wheel installed in python environment"
fi
# Install all the offline packages into the virtual environment
pip3 wheel wheel -w packages/ cryptography==3.4.7 --no-binary :all
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cryptocurrency package not unpacked"
    exit 1
fi
pip3 install -f packages/ --no-index cryptography==3.4.7
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cryptocurrency package not installed"
    exit 1
fi
pip3 install -r $PWD/python_environment/packages/requirements.txt --no-index --no-deps --find-links $PWD/python_environment/packages/
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Requirements are not installed completely"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "*****************************************************************"
    echo "INFO - Python Dependencies Installed Successfully"
fi
# copy codebase into the new virtual environment
cp -a $PWD/codebase/ $PWD/python_environment/
var=$?
if [ $var -eq 1 ]
then
    echo "ERROR - Cannot copy source into new environment"
    exit 1
fi
if [ $var -eq 0 ]
then
    echo "*****************************************************************"
    echo "INFO - Hadoop Assessment Tool Deployed Successfully"
    echo "*****************************************************************"
    echo "NEXT STEP - Run 'sudo bash run.sh' to generate the PDF report"
    echo "*****************************************************************"
fi
rm -rf hat_file.txt