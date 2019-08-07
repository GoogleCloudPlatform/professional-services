# This file contains dependencies to be installed

set -e 

pip install google-cloud-vision
pip install google-cloud-storage
pip install pyyaml

pip install pdf2image
pip install --upgrade google-cloud-automl
pip install wand
pip install pandas
pip install -e automl-v1beta1_2
pip install pillow
pip install pandas-gbq
pip install tensorflow

sudo apt-get update
sudo apt-get install imagemagick
sudo apt install --yes poppler-utils

echo ""
echo "Done!"
echo "All requirements have been installed."
