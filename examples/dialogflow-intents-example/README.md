# Intents creation and update for Dialogflow
Intents for Dialogflow Agent can be created automatically from a CSV file using this module. The intents are created as a zip file which can then be manually imported in to the Dialogflow Project. 

## Recomended Reading
[Intents Overview](https://cloud.google.com/dialogflow/docs/intents-overview)

## Programming Language
Python 3

## Project Structure
```
.
├── BikeShopBotTrain.csv
├── README.md
├── bot_builder.py # program that builds the bot from the csv
└── df_bot.py # Helper modules
```

## Usage
python bot_builder.py --root_dir=bike_shop_bot_dir --bot_name=BikeShopBot < BikeShopBotTrain.csv

--root_dir is the parameter for specifying the output directory for all the intent json files  
--bot_name is the name of the Agent  
