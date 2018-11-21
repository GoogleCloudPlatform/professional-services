# Extracts the BQ schema by flattening the nested fields
# Sample schema
'''
schema=[
      {
        "mode": "REPEATED", 
        "name": "_c0", 
        "type": "INTEGER"
      }, 
      {
        "fields": [
          {
            "mode": "REQUIRED", 
            "name": "key", 
            "type": "STRING"
          }, 
          {
            "mode": "REPEATED", 
            "name": "value", 
            "type": "INTEGER"
          }
        ], 
        "mode": "REPEATED", 
        "name": "_c1", 
        "type": "RECORD"
      }, 
      {
        "fields": [
          {
            "mode": "REQUIRED", 
            "name": "key", 
            "type": "STRING"
          }, 
          {
            "fields": [
              {
                "mode": "REQUIRED", 
                "name": "key", 
                "type": "STRING"
              }, 
              {
                "mode": "REPEATED", 
                "name": "value", 
                "type": "INTEGER"
              }
            ], 
            "mode": "REPEATED", 
            "name": "value", 
            "type": "RECORD"
          }
        ], 
        "mode": "REPEATED", 
        "name": "_c2", 
        "type": "RECORD"
      }
    ]
'''

import json,os,sys
columns = []
col_types=[]

def append_schema(schema,main_col):
  for item in schema:
    name=main_col+item['name']
    if item['mode']=='REPEATED':
      col_type=item['type']+'_'+item['mode']
    else:
      col_type=item['type']

    columns.append(name)
    col_types.append(col_type)

    if "RECORD" in col_type:
      schema2=item['fields']
      append_schema(schema2,name+'__')

def get_schema(dataset,bq_table):
  os.system('bq show --format=prettyjson {}.{} >bq_schema.json'.format(dataset,bq_table))

  with open('bq_schema.json','rb') as file:
    schema=json.load(file)

  os.remove('bq_schema.json')
  schema = schema['schema']['fields']

  append_schema(schema,'')

  my_dict = {}

  list_tuple = zip(columns,col_types)

  for item in list_tuple:
    if item[0] in my_dict.keys():
      print("error")
    else:
      my_dict[item[0]] = item[1]
  print(my_dict)

  return my_dict

if __name__=="__main__":
  get_schema(sys.argv[1],sys.argv[2])

