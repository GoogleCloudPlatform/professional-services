grammar ZetaSQLTypeGrammar;

// Parser rules
type : basicType | arrayType | structType;
basicType: BASIC_TYPE ( '(' typeParameters ')' )?;
arrayType: ARRAY '<' type '>';
structType: STRUCT '<' structFields '>';
structFields: structField (',' ' '* structField)*;
structField: IDENTIFIER ' ' type;
typeParameters: TYPE_PARAMETER (',' ' '* TYPE_PARAMETER)*;

// Lexer rules
TYPE_PARAMETER: NUMBER | 'MAX';

ARRAY: 'ARRAY';
STRUCT: 'STRUCT';

BASIC_TYPE: STRING
            | BYTES
            | INT32
            | INT64
            | UINT32
            | UINT64
            | FLOAT64
            | DECIMAL
            | NUMERIC
            | BIGNUMERIC
            | INTERVAL
            | BOOL
            | TIMESTAMP
            | DATE
            | TIME
            | DATETIME
            | GEOGRAPHY
            | JSON;

STRING: 'STRING';
BYTES: 'BYTES';
INT32: 'INT32';
INT64: 'INT64';
UINT32: 'UINT32';
UINT64: 'UINT64';
FLOAT64: 'FLOAT64';
DECIMAL: 'DECIMAL';
NUMERIC: 'NUMERIC';
BIGNUMERIC: 'BIGNUMERIC';
INTERVAL: 'INTERVAL';
BOOL: 'BOOL';
TIMESTAMP: 'TIMESTAMP';
DATE: 'DATE';
TIME: 'TIME';
DATETIME: 'DATETIME';
GEOGRAPHY: 'GEOGRAPHY';
JSON: 'JSON';

IDENTIFIER: [A-Za-z_][A-Za-z0-9_]*;
NUMBER: [1-9][0-9]*;
