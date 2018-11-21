# Extracts the HIVE schema by flattening the nested fields
import json,os,sys
columns=[]
col_types=[]
my_dict = {}
from collections import OrderedDict

def check_correct(struct_item):
    if struct_item.count('<') == struct_item.count('>'):
        return True
    else:
        return False
def do_recursive(name,item_type):
    if '<' in item_type:
        col_type=item_type.split('<')[0]
        if col_type == 'array':
            columns.append(name)
            col_types.append('array')
            # '<'.join(x.split('<')[1:])[:-1]
            do_recursive(name,'<'.join(item_type.split('<')[1:])[:-1])
        elif col_type== 'map':
            columns.append(name)
            col_types.append('map')
            columns.append(name+'__key')
            col_types.append('string')

            do_recursive(name+'__value',','.join('<'.join(item_type.split('<')[1:])[:-1].split(',')[1:]))
        elif col_type=="uniontype":
            columns.append(name)
            col_types.append('union')

        elif col_type == 'struct':
            columns.append(name)
            col_types.append('struct')
            structure = '<'.join(item_type.split('<')[1:])[:-1]
            rand = []
            y=structure.split(',')
            for i in range(len(y)):
                struct_item=y[i]
                if check_correct(struct_item):
                    rand.append(struct_item)
                else:
                    y[i+1] = ','.join([y[i],y[i+1]])
            # print(rand)
            for item in rand:
                struct_item_key = item.split(':')[0]
                do_recursive(name+'__'+struct_item_key,':'.join(item.split(':')[1:]))

    else:
        columns.append(name)
        col_types.append(item_type)



def append_schema(schema):
        for item in schema:
                name = item['name']
                item_type = item['type']
                do_recursive(name,item_type)

def get_schema(database,table_name):

    os.system('hive -e "set hive.ddl.output.format=json;desc {}.{};" > schema.json'.format(database,table_name))

    with open('schema.json','rb') as file:
        schema=json.load(file)

    os.remove('schema.json')
    append_schema(schema['columns'])

    list_tuple = zip(columns,col_types)
    print(my_dict)
    for item in list_tuple:
        if item[0] in my_dict.keys():
            my_dict[str(item[0])].append(str(item[1]))
        else:
            my_dict[str(item[0])] = [str(item[1])]
        print(my_dict)

    def reduce_to_one(the_list):
        s=''
        count = the_list.count('array')
        for i in range(count):
            s += "array_"
        l= [value for value in the_list if value != 'array']
        s+= l[0]
        return s

    for key,value in my_dict.iteritems():
        if len(value)>=2:
            my_dict[key] = reduce_to_one(value)
        else:
            my_dict[key] = value[0]

    for key,value in my_dict.iteritems():
        if 'decimal' in value:
            my_dict[key] = 'decimal'
        elif 'varchar' in value:
            my_dict[key] = 'varchar'
        elif 'char' in value:
            my_dict[key] = 'char'
    return my_dict,list(OrderedDict.fromkeys(columns))

if __name__=="__main__":
    get_schema(sys.argv[1],sys.argv[2])
