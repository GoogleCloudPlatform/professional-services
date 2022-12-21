ORDER_TABLE_SCHEMA = {
    'fields': [
        {
            'name': 'CustomerID',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'EmployeeID',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'OrderDate',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'RequiredDate',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name':
                'ShipInfo',
            'type':
                'RECORD',
            'mode':
                'NULLABLE',
            'fields': [
                {
                    'name': 'ShipVia',
                    'type': 'INT64',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'Freight',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipName',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipAddress',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipCity',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipRegion',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipPostalCode',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShipCountry',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'ShippedDate',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
            ]
        },
    ]
}

CUSTOMER_TABLE_SCHEMA = {
    'fields': [
        {
            'name': 'CustomerID',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'CompanyName',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'ContactName',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'ContactTitle',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'Phone',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name': 'Fax',
            'type': 'STRING',
            'mode': 'NULLABLE'
        },
        {
            'name':
                'FullAddress',
            'type':
                'RECORD',
            'mode':
                'NULLABLE',
            'fields': [
                {
                    'name': 'Address',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'City',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'Region',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'PostalCode',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'Country',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
                {
                    'name': 'CustomerID',
                    'type': 'STRING',
                    'mode': 'NULLABLE'
                },
            ]
        },
    ]
}
