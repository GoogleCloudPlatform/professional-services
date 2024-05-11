#! /usr/bin/bash
echo "Installing custom packages..."
apt-get -y update
apt-get install python-dev python-pip -y
pip install numpy
echo "Successfully installed custom packages."