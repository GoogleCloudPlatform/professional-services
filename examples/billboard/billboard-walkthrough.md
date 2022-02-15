# Billboard Overview
This code implements billboard dataset for standard and detailed billing



## Environment set-up

You can set-up the right python environment as follows:
```
 pip install virtualenv
 virtualenv bill-env
 source bill-env/bin/activate
 pip install -r requirements.txt
```
This step includes the following:
- Install Python local env
- Launch local env
- Install dependencies

## To see options
```
python billboard.py -h
```
## Create billboard dataset
 -se  standard billing export dataset
 
 -bb billboard dataset to be created
```
python billboard.py -pr <project id> -se <standard billing ds> -bb <billboard_ds>
```
## Clean up
```
python billboard.py -pr <project id> -se <standard billing ds> -bb <billboard_ds> -clean yes

```
