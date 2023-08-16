## fields

Example
```json
"fields":[
    {
        "name":"id", 
        "type": "STRING",
        "generation": {
            "type" : "UUID"
        }
    },
    {
        "name":"date", 
        "type": "DATETIME",
        "generation": {
            "type" : "RANDOM_BETWEEN",
            "min":"2018-01-01T00:00:00Z",
            "max":"2023-01-01T00:00:00Z",
            "output_format":"%Y-%m-%d %H:%M:%S"
        }
    },
    {
        "name":"name", 
        "type": "STRING",
        "generation": {
            "type" : "RANDOM_BETWEEN",
            "subtype":"ascii_uppercase",
            "length": 10
        }
    },
    {
        "name":"phone_number", 
        "type": "STRING",
        "generation": {
            "type" : "RANDOM_FROM_REGEX",
            "expression":"\\d{4}-\\d{4}-\\d{4}-[0-9]{4}"
        }
    },
    {
        "name":"product_id", 
        "type": "STRING",
        "generation": {
            "type" : "RANDOM_FROM_LIST"
        }
    },
    {
        "name":"country", 
        "type": "STRING",
        "generation": {
            "type" : "RANDOM_FROM_LIST"
        }
    },
    {
        "name":"amount", 
        "type": "INT",
        "generation": {
            "type" : "RANDOM_BETWEEN",
            "min":5,
            "max":100
        }
    },
    {
        "name":"price", 
        "type": "FLOAT",
        "generation": {
            "type" : "LOOKUP_VALUE",
            "lookup_name":"product_id_price"
        }
    },
    {
        "name":"customer_satisfaction", 
        "type": "FLOAT",
        "generation": {
            "type" : "RANDOM_BETWEEN",
            "min":51.5,
            "max":100,
            "num_decimals":2
        }
    }
]
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| name | string | Name of the field |   |
| type | string | Type of the field | `STRING`,`DATETIME`,`INT`,`FLOAT`  |
| generation | dictionary | Defines how to generate the value for that field  |

### generation - UUID

Generates UUID values 

Example
```json
{
    "name":"id", 
    "type": "STRING",
    "generation": {
        "type" : "UUID"
    }
}
```


### generation - RANDOM_BETWEEN

Generates random values by taking as input the type of the field and the generation parameters

#### generation - RANDOM_BETWEEN(DATETIME)
```json
{
    "name":"date", 
    "type": "DATETIME",
    "generation": {
        "type" : "RANDOM_BETWEEN",
        "min":"2018-01-01T00:00:00Z",
        "max":"2023-01-01T00:00:00Z",
        "output_format":"%Y-%m-%d %H:%M:%S"
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| generation.min | string | start datetime of the range. Must by in "%Y-%m-%dT%H:%M:%SZ" format |   |
| generation.max | string | end datetime of the range. Must by in "%Y-%m-%dT%H:%M:%SZ" format |   |
| generation.output_format | string | Format of the generated Datetime |   |

#### generation - RANDOM_BETWEEN(STRING)
```json
{
    "name":"name", 
    "type": "STRING",
    "generation": {
        "type" : "RANDOM_BETWEEN",
        "subtype":"ascii_uppercase",
        "length": 10
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| generation.subtype | string | Type of string to be generated. [Documentation](https://docs.python.org/3/library/string.html) |  `ascii_uppercase`,`ascii_lowercase`,`ascii_letters`  |
| generation.length | int | Length of the string to be generated  |

```

#### generation - RANDOM_BETWEEN(INT)
```json
{
    "name":"amount", 
    "type": "INT",
    "generation": {
        "type" : "RANDOM_BETWEEN",
        "min":5,
        "max":100
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| generation.min | int | lower boundary of the range|   |
| generation.max | string | upper boundary of the range |   |

#### generation -  RANDOM_BETWEEN(FLOAT)
```json
{
    "name":"customer_satisfaction", 
    "type": "FLOAT",
    "generation": {
        "type" : "RANDOM_BETWEEN",
        "min":51.5,
        "max":100,
        "num_decimals":2
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| generation.min | float | Lower boundary of the range|   |
| generation.max | float | Upper boundary of the range |   |
| generation.num_decimals | int | Number of decimals |   |

### generation - RANDOM_FROM_REGEX

Generates random values that follow a regex expression

Example
```json
{
    "name":"phone_number", 
    "type": "STRING",
    "generation": {
        "type" : "RANDOM_FROM_REGEX",
        "expression":"\\d{4}-\\d{4}-\\d{4}-[0-9]{4}"
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| expression | string | regex expression |   |

### generation - RANDOM_FROM_LIST

Generates a value by randomly picking it from a list of predefined values

Example
```json
{
    "name":"product_id", 
    "type": "STRING",
    "generation": {
        "type" : "RANDOM_FROM_LIST",
        "values":["product1","product2","product3","product4","product5"],
        "weights":[20,60,10,3,7]
    }
}
```

| Field |  Type | Description | Possible values |
|----------|----------|----------|----------|
| values | array | List of possible values to pick from |   |
| weights | array | (Optional) Weight for each value. The sum should be 100. | `None`,`[5,10,50...]`  |

### generation - LOOKUP_VALUE

Generates a value by reading a mapping using as an input the value of another field. The mapping is defined in the [config.lookup_fields](#lookup_fields) section

```json
{
    "name":"price", 
    "type": "FLOAT",
    "generation": {
        "type" : "LOOKUP_VALUE",
        "lookup_name":"product_id_price"
    }
}
```

In this example we will generate the `price` field values using as input the value of the `product_id` field.

Before the lookup:
| date |  product_id | price |
|----------|----------|----------|
| 2023-01-01 |  product1 |  |
| 2023-01-01 |  product2 |  |

After the lookup:
| date |  product_id | price |
|----------|----------|----------|
| 2023-01-01 |  product1 | 15 |
| 2023-01-01 |  product2 | 30 |