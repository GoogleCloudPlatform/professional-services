# This file contains dependencies to be installed

set -e 
sudo apt-get update
sudo apt-get install imagemagick
sudo apt-get install --yes poppler-utils
sudo apt-get upgrade -y

pip3 install google-api-python-client
pip3 install google-cloud-bigquery
pip3 install google-cloud-vision
pip3 install google-cloud-storage
pip3 install google-cloud-automl

pip3 install pyyaml
pip3 install pdf2image
pip3 install wand
pip3 install numpy==1.16.4
pip3 install pandas
pip3 install pillow
pip3 install pandas-gbq
pip3 install tensorflow
pip3 install gcsfs
pip3 install ghostscript

echo ""
echo "Done!"
echo "All requirements have been installed."

