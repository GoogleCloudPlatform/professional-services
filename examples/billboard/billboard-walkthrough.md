# Billboard Overview
This code implements billboard dataset using standard and detailed billing exports and creates necessary BQ views.

Datastudio template report/dashboard is used to show prebuilt reports based on the BQ views.



## Environment set-up

You can set-up the right python environment as follows:
```
 cd examples/billboard
 rm -rf bill-env
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
 -se standard billing export dataset
 -de detailed billing export dataset 
 -bb billboard dataset to be created
```

python billboard.py -pr <project id> -se <standard billing ds> -de <detailed billing ds> -bb <billboard_ds>

```
## Clean up ( optional for removing BQ Billboard Views if you want to remove Billboard )

```

python billboard.py -pr <project id> -se <standard billing ds> -de <detailed billing ds> -bb <billboard_ds> -clean yes

```
