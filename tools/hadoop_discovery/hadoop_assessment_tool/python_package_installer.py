import os

pyversion = os.popen("python3 -V | awk '{print $2}'").read()
pyversion = pyversion.replace("\n", "")
if pyversion >= "3.8.0":
    os.popen("python3.8 -m venv $PWD/python_environment/venv").read()
else:
    os.popen("python3 -m venv $PWD/python_environment/venv").read()
