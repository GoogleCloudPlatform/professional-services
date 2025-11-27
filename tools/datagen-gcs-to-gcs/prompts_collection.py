"""
Copyright 2025 Google. This software is provided as-is, 
without warranty or representation for any use or purpose. 
Your use of it is subject to your agreement with Google.

"""

# Prompt for Delimiter Prediction
Delimiter_Prediction_Prompt = """You are an expert in reading file content and identifying column delimiters.  Your input will be the file content. You will read the file and return the delimiter as output. The output should contain only the delimiter and nothing else. No other explanation is needed.

**Example:**

**File Data:**

3,1,3,David,Lee,1975-02-20,David.Lee@example.com,482-28-4145,4132153079386
4,3,1,Sarah,Jones,1985-08-25,Sarah.Jones@example.com,197-32-4878,4359491969700046
1,1,1,John,Doe,1980-05-10,John.Doe@example.com,330-27-8999,180011784614314

**Output:**
,
"""

# Prompt for Custom Header Extraction
Custom_Header_Extract_Prompt = """You are a file parser designed to extract custom headers. Your task is to analyze the provided file content and identify a specific header format. Follow these steps precisely:
1. Analyze the provided file content
2. Search for a line that begins with 'HEADER' followed by any combination of words or numbers.
3. The header must end with a newline character.
4. If you find a line matching this pattern, extract the entire line and return it as the output.
5. If no such header is found in the file content, return 'false'
Strictly the output should contain either the HEADER record or the 'false' keyword and nothing else. No other explanation is needed.
"""

# Prompt for Schema Prediction
Schema_Prediction_Prompt = """You are an expert in reading file content and predicting column names and data types.

Your input will be the file name , file data , and a header flag . The header flag indicates whether the file contains column headers(true) or not(false).

1. **Column Name Prediction:** If  header_flag is false, predict the column names. Use your knowledge of common data structures and the context provided by file_name to make informed predictions. Be as specific as possible.

2. **Data Type Prediction:** Predict the data type for each column based on file_data. The data types should be one of the following: INTEGER, FLOAT, STRING, DATE, DATETIME, BOOLEAN, or TIMESTAMP.

3. **Existing Column Names:** If header_flag is true, or if column names are present in the first row of  file_data, use the existing column names.  Do not predict new names in this case. Only predict the column types.

4. Remove ```json and ``` from the output

**Output:**

Output the column name and data type as an array of JSON objects.

Output Validation:
1. Validate that all the column names which are meaningful are present in the output.
2. Strictly remove the ```json and ``` from the output.
3. Output should contain only the json array and notthing else.

**Example:**

**File Name:** `Dim_Customer.csv`

**File Data:**

3,1,3,David,Lee,1975-02-20,David.Lee@example.com,482-28-4145,4132153079386
4,3,1,Sarah,Jones,1985-08-25,Sarah.Jones@example.com,197-32-4878,4359491969700046
1,1,1,John,Doe,1980-05-10,John.Doe@example.com,330-27-8999,180011784614314

**Header Flag**
false

**Output:**

[{"Customer_ID": 0, "type": "INTEGER"}, {"Customer_Segment_ID": 1, "type": "INTEGER"}, {"Location_ID": 2, "type": "INTEGER"}, {"First_Name": 3, "type": "STRING"}, {"Last_Name": 4, "type": "STRING"}, {"Date_of_Birth": 5, "type": "DATE"}, {"Email_Id": 6, "type": "STRING"}, {"SSN": 7, "type": "STRING"},{"CC": 8, "type": "STRING"}]


"""


# Function to create header prediction prompt
def header_prediction(file_data):
    return f"""You are an expert in reading file content and understanding its context. You will be provided with a rows of file data. Your task is to predict whether the file contains column headers or not.

**Instructions:**

1. Analyze the provided file data
2. Determine if the first row of the file data appears to be a header row. A header row typically contains descriptive labels rather than data entries.
3. If you determine that the file *does* contain a header row, output it as true
4. If you determine that the file *does not* contain a header row, output it as false
5. Strictly the output should be either true or false and nothing else.

**Example:**

**File Data:**

```
DEMO33,No,No,Same Day,"Paying Agent (House, Riddle and Cook)",Other,232-81-6192,Katie Melendez,DTH,2003-07-28,J58217100,2023 Deferrals,5083.08,7753.42,SFS,Separation Service,1990-06-06,8,16,Monthly,1990-06-06,3835.12,,1990-06-06,Yes,The Merchant's Bank of Willow Creek
DEMO38,Yes,Yes,Same Day,Paying Agent (Thomas-Pennington),Other,346-18-9073,Andrea Martinez,DTH,2012-08-08,D72383286,2021 Deferrals,2601.29,6056.57,SFS,Separation Service,1997-07-24,1,14,Annually,1997-07-24,9048.73,,1997-07-24,No,Sterling Trust & Savings
```

**Output:**
false

**File Data:**

```
{file_data}
```

**Output:**
"""


# Function to create Snowfakery recipe generation prompt
def create_receipe_prompt(fake_function_list, table_schema):
    return f"""
Purpose and Goals:

* Assist users in creating Snowfakery recipes based on their table schemas.
* Generate recipes that accurately reflect the structure and data types of the input schemas.
* Prioritize clarity and readability in the generated recipes.

Behaviors and Rules:

1. Schema Extraction:
 - Carefully parse the JSON schema provided by the user.
 - Extract relevant information for each column, including 'name', 'type', and 'description'.

2. Recipe Generation:
 - Analyze the extracted column information.
 - Consult the Snowfakery documentation ([https://snowfakery.readthedocs.io/en/docs/fakedata.html](https://snowfakery.readthedocs.io/en/docs/fakedata.html)) to understand about each fake function usage
 - Use the below fake function list to determine appropriate fake functions for each column based on its type and description. {fake_function_list}
 - Construct a Snowfakery recipe in YAML format, using the identified fake functions and incorporating any relationships between tables.
 - For the fields similar to indentifier field, use ${{unique_id}}
 - Use `fake: Name` function only if the field is related to the person/human name and not object name. Example: `fake: Name` function cannot be used for organization or company name.


3. Receipe Validation:
 - Carefully read the user provided sample records and for each of the string type column, provide random_choice as arguments for each of the recipe fields from the sample records. If sample record is not available, then generate sample values for the fields and use random_choice as arguments.
 - Generate as many possible values as possible for the random_choice arguments.
 - For integer, float, deciaml, bigdecimal fields, use the random_number with min and max values
 - Use random_choice and random_number, only if no fake function can be found for those fields. If a fake function is found for a particular field, stick to that fake function only, instead of random_choice and random_number
 - If there is any column dependencies based on the semantic meaning of the columns. Example Start_Date depends on End_Date, Start_time depends on End_Time.
 - Apply the below technique to create column dependencies. Make sure the indentations and colons are kept in the same way
 - Strictly validate the number of curly braces used. Example it should $ sign followed by have two ${{unique_id}}.
 - Strictly keep the provided table name as the yaml object name

Example: Column dependencies between travel_start_date and travel_end_date, trip_start_datetime and trip_end_datetime ,random_choice for name field, id field and random_number is as below
- object: trips
  count: 5
  fields:
  trip_id:${{unique_id}}
  trip_type:
   random_choice:
    - One Way
    - Round Trip
  customer_name:
   fake: Name
  email:
   fake: Email
  age:
   random_number:
    min: 12
    max: 95
  payment_type:
   random_choice:
    - Debit Card
    - Credit Card
  travel_start_date:
  fake.DateBetween:
   start_date: -7d
   end_date: -1d
  travel_end_date:
  fake.DateBetween:
   start_date: +0d
   end_date: +7d
 - For Date and Datetime Column Types, strictly use "fake.DateBetween:" as mentioned in the example above.
 - Since fake function is available for the name and email field, respective fake function is used.
 - Since fake fuction is not avaialble for the payment_type,trip_type and age, hence random_choice and random_number is used. Generate as many possible values as possible for the random_choice arguments.
 - Since there is no sample data available for the payment_type, generated sample data as Debit Card and Credit Card and added it to the random_choice function

-For any column which is semantic closer to the Identifier. Example Trip_Id, Plan_Id etc, always use the unique_id Faker function.

- Make sure you follow the same output pattern as above without missing any colon, indentation, hypen, line breaks etc
- Strictly include only the below list of fake functions

 {fake_function_list}

 4. Recipe Presentation:

 - Present the generated Snowfakery recipe to the user in well formatted YAML format only.
 - Include comments in the recipe to explain any complex or non-obvious choices.
 - Remind the user that the generated recipe is a starting point and encourage them to customize and refine it as needed.

 5. Validation:
 - Validate that the recipe doesnot inclue any fake funciton which is not part of the list shared earlier.
 - Validate that the random_choice is correctly added for all the string type fields
 - Strictly validate that the output is a valid YAML with no special characters or formatting issues.
 - Strictly validate the number of curly braces used. Example it should $ sign followed by have two curly braces like ${{unique_id}}.
 - Strictly Keep the same indentation and line breaks as provided in the example recipe.
 - Strictly keep object name same as the table_name in the provided input schema


Additional Notes:
* Strictly adhere to the fake functions defined in the Snowfakery documentation and the provided list. If a faker function is not in the provided list, do not include it in the recipe.
* Strictly format the output in the valid YAML format with the correct formatting
* Strictly Keep the same indentation and line breaks as provided in the example recipe.
* Remove ```yaml and ``` from the output
* The output should contain only the receip and no other explanation


User Schmea Input:

{table_schema}

"""


# Prompt for YAML Correction
yaml_correction_prompt = """You are a YAML text processing expert. Your task is to carefully analyze a given YAML text and modify it according to the following rule:

Rule 1: If a field value within the YAML text contains only a single pair of curly braces (e.g., `${field}`), replace it with two pairs of curly braces (e.g., `${{field}}`).
Rule 2: Convert the decimal values in the min and max arguments of the random_number function to the corresponding integer values

**Input:**

The user will provide you with a string of YAML text.

**Output:**

**Updated YAML:**
1. Return the modified YAML text where all single curly brace expressions have been replaced with double curly braces.
2. Return the modified YAML with the decmail fields replaced with the corresponding integer values

**Important Considerations:**

* **YAML Syntax:** Ensure that your modifications maintain the correct YAML syntax.
* **Preservation:**  Preserve the structure and indentation of the original YAML.
* **Clarity:** Make your output clear and easy to understand.

**Example:**

If the user provides the following YAML:

- object: employees
  count: 5
  fields:
    sales_id: ${unique_id}
    sales_name:
      random_choice:
        - Henry Jones
        - Ivy Taylor
        - Kelly White
    tax:
      random_number:
        min: 21.87
        max: 48.98
    win_id: ${unique_id}

Your Output should be
- object: employees
  count: 5
  fields:
    sales_id: ${{unique_id}} --Added extra curly braces
    sales_name:
      random_choice:
        - Henry Jones
        - Ivy Taylor
        - Kelly White
    tax:
      random_number:
        min: 21 -- Converted from Decimal to Integer
        max: 48 -- Converted from Decimal to Integer
    win_id: ${{unique_id}} --Added extra curly braces

* Strictly Keep the same indentation and line breaks as provided in the example recipe.
* Strictly keep the same object name as in the input
* Remove ```yaml and ``` from the output
* The output should contain only the receip and no other explanation
"""

# Prompt for Relationship Builder
Relationship_builder = """Purpose: Given the schema of multiple database tables, determine their relationships and the type of each table.
Strictly build the relationship only for the table provided the user.
Dont include any additional tables in the relationship.

Input Format:

*  A string containing the table definitions. Each definition includes:

  *  Table name.

  *  Column names and their data types.



Output Format:

* A JSON array where each element represents a table and contains:

  *  table_name (string): The name of the table.

  *  table_type (string): Either 'dimension' or 'fact'.

  *  foreign_keys (array):

    *  column_name (string): The name of the foreign key column in this table.

    *  references_table (string): The name of the referenced table.

    *  references_column (string): The name of the referenced column.

    *  relationship_type (string): Either 'One-to-Many (1:M)' or 'Many-to-One (M:1)'. If the table is a dimension table, this array is empty.



Rules and Instructions:

1. **Schema Parsing:**

   *  Identify each table, its name, columns, and data types.



2. **Table Type Determination:**

   *  Classify each table as either:

      *  **Dimension:** Primarily stores descriptive attributes, often used to filter or group data in fact tables.

      *  **Fact:** Primarily stores measurable or quantitative data, often related to events or transactions.

   *  If unsure, make an educated guess based on common patterns



3. **Relationship Identification:**

   *  Look for foreign key relationships between tables.

      *  Foreign keys are columns that reference the primary key of another table.

   *  Determine the type of relationship:

      *  **One-to-Many (1:M):** One record in the dimension table can be associated with many records in the fact table.

      *  **Many-to-One (M:1):** Many records in the fact table can be associated with one record in the dimension table.



4. **Output Generation:**

   *  For each table, create a JSON object following the specified format.

   *  Include relevant foreign key information in the `foreign_keys` array.

   *  Ensure the output is valid JSON.


Additional Notes:

*  This is a simplified approach. Real-world schema analysis can be more complex.

*  For large schemas, you might implement more advanced algorithms for relationship discovery.
"""

# Prompt for Updating Recipe based on Relationship
Relationship_Prompt = """Below is the Example of Snowfakery yml file for tables emp and dept with minimal number of columns to demonstrate how primary key and foreign key can be represented while creating recipe.
- object: dept
  count: 4
  fields:
    deptno: ${{unique_id}}
    name:
     random_choice:
       - Henry Jones
       - Ivy Taylor
       - Kelly White
- object: emp
  count: 10
  fields:
    __dept_fk:
      random_reference:
        to: dept
        unique: False
    empno: ${{unique_id}}
    deptno: ${{__dept_fk.deptno}}


## Snowfakery Recipe Breakdown: Department and Employee Data Generation

This Snowfakery recipe generates synthetic data for two related objects: `dept` (department) and `emp` (employee). It leverages several key features of Snowfakery to create realistic and interconnected data.

**Object: dept**

- **`object: dept`**: This line declares the first object to be generated, representing a department.
- **`count: 4`**: This specifies that four department records will be created.
- **`fields:`**: This introduces the fields that will be populated for each department record.
    - **`deptno: ${{unique_id}}`**: This assigns a unique ID to each department using the `unique_id` function, ensuring each department has a distinct identifier.
    - **`name: fake: Name`**: This generates a fake department name using the `fake` function with the `Name` provider. This will produce random, yet plausible, department names.

**Object: emp**

- **`object: emp`**: This line declares the second object to be generated, representing an employee.
- **`count: 10`**: This specifies that ten employee records will be created.
- **`fields:`**: This introduces the fields that will be populated for each employee record.
    - **`__dept_fk: random_reference: to: dept unique: False`**: This is a hidden field used to establish a relationship between employees and departments. It utilizes the `random_reference` function to randomly assign a department to each employee.
        - **`to: dept`**: This specifies that the reference should point to a `dept` object.
        - **`unique: False`**: This allows multiple employees to be assigned to the same department, reflecting a realistic scenario.
    - **`empno: ${{unique_id}}`**: This assigns a unique ID to each employee using the `unique_id` function, ensuring each employee has a distinct identifier.
    - **`deptno: ${{__dept_fk.deptno}}`**: This field populates the employee's department number by referencing the `deptno` field of the randomly assigned department from the hidden `__dept_fk` field. This creates a direct link between the employee and their department.

**Recipe Execution**

When this recipe is executed, Snowfakery will first generate four unique department records with random names. Subsequently, it will create ten employee records, each randomly assigned to one of the existing departments. The `deptno` field in the `emp` object will reflect the `deptno` of the assigned department, ensuring data consistency and reflecting a realistic one-to-many relationship between departments and employees.

**Key Features Utilized**

- **`unique_id` function**: Generates unique identifiers for both departments and employees.
- **`fake` function**: Generates fake department names using the `Name` provider.
- **`random_reference` function**: Randomly assigns departments to employees.
- **Hidden fields**: Used to store intermediate values and establish relationships without appearing in the final output.

This recipe demonstrates the power and flexibility of Snowfakery in generating synthetic data with realistic relationships between objects. It can be easily adapted to generate data for other scenarios by modifying the object names, field definitions, and relationships as needed.


Task:
* Correct the below provided Snowfakery recipe (yml) files to include correct primary key generation and foreign key references.
* Use the provided relationship
* Remove ```yaml and ``` from the output
* The output should contain only the receip and no other explanation
* Strictly Keep the same indentation and line breaks as provided in the example recipe.
* Strictly keep the provided table name as the yaml object name


Here's a step-by-step guide for completing your tasks:
1. For recipes having ONLY PRIMARY KEY include unique_id as shown in the dept, emp example recipe.
2. For recipes having FOREIGN KEY reference include
a. Hidden field referring to Primary table recipe
PS: unique=False for 'One-to-Many (1:M)' relationship and unique=True for 'One-to-One (1:1)' relationship
b. Hidden fields should be placed right after `fields` keyword of that particular object
c. Replace the foreign key column value to refer to primary column recipe
3. When there are conflicting scenarios between
4. All other columns will remain as it is. No changes are required for other columns.
5. You are allowed to rearrange the order of yaml recipe to get desired output (hint: try building independent objects i.e., without foreign key first and only after that bring in dependent objects)
6. Strictly Keep the same indentation and line breaks as provided in the example recipe.
7. Strictly keep the same object name as in the input
8. Always add - before the "object" keyword in the yaml recipe
9. Just provide output yaml; no explaination is needed
"""

# Prompt for Correcting Object Name in Recipe
Correct_Object_Name_Prompt = """ You will either get the relationship json or a table name as an input.
Your task is as below:
1. If you get the relationship json , then extract the table name form the relationship.
Then, read the provided yaml receipe and replace the object name with the name of the table names extracted from the relationship.
2. If you get the table name, replace the object name in the yaml recipe with the input table name provided.

* Just provide output yaml; no explaination is needed
* Remove ```yaml and ``` from the output
* Always add - before the "object" keyword in the yaml recipe
* Strictly Keep the same indentation and line breaks as provided in the input recipe.
"""

# List of fake functions (as a string or list)
fake_function_list = """
fake: Email
fake: Name
fake: Postalcode
fake: State
Address Fakers
fake: City
fake: Country
fake: CurrentCountry
fake: StreetAddress
Company Fakers
fake: CatchPhrase
fake: Company
Date_Time Fakers
fake: Time
fake: Year
Lorem Fakers
fake: Paragraph
fake: Sentence
Person Fakers
fake: FirstName
fake: FirstNameFemale
fake: FirstNameMale
fake: FirstNameNonbinary
fake: LastName
Phone_Number Fakers
fake: PhoneNumber
Rarely Used
Salesforce Fakers
fake: UserName
fake: Alias
fake: RealisticMaybeRealEmail
Address Fakers
fake: Address
fake: AdministrativeUnit
fake: BuildingNumber
fake: CityPrefix
fake: CitySuffix
fake: CountryCode
fake: CurrentCountryCode
fake: MilitaryApo
fake: MilitaryDpo
fake: MilitaryShip
fake: MilitaryState
fake: PostalcodeInState
fake: PostalcodePlus4
fake: Postcode
fake: PostcodeInState
fake: SecondaryAddress
fake: StateAbbr
fake: StreetName
fake: StreetSuffix
fake: Zipcode
fake: ZipcodeInState
fake: ZipcodePlus4
Automotive Fakers
fake: LicensePlate
Bank Fakers
fake: Aba
fake: BankCountry
fake: Bban
fake: Iban
fake: Swift
fake: Swift11
fake: Swift8
Barcode Fakers
fake: Ean
fake: Ean13
fake: Ean8
fake: LocalizedEan
fake: LocalizedEan13
fake: LocalizedEan8
fake: UpcA
fake: UpcE
Color Fakers
fake: Color
fake: ColorName
fake: HexColor
fake: RgbColor
fake: RgbCssColor
fake: SafeColorName
fake: SafeHexColor
Company Fakers
fake: Bs
fake: CompanySuffix
Credit_Card Fakers
fake: CreditCardExpire
fake: CreditCardFull
fake: CreditCardNumber
fake: CreditCardProvider
fake: CreditCardSecurityCode
Currency Fakers
fake: Cryptocurrency
fake: CryptocurrencyCode
fake: CryptocurrencyName
fake: Currency
fake: CurrencyCode
fake: CurrencyName
fake: CurrencySymbol
fake: Pricetag
Date_Time Fakers
fake: AmPm
fake: Century
fake.DateBetween:
fake: DateObject
fake: DateOfBirth
fake: DayOfMonth
fake: DayOfWeek
fake: FutureDate
fake: FutureDatetime
fake: Iso8601
fake: Month
fake: MonthName
fake: PastDate
fake: PastDatetime
fake: Pytimezone
fake: TimeDelta
fake: TimeObject
fake: TimeSeries
fake: Timezone
fake: UnixTime
Decorators.Py Fakers
fake: AsciiCompanyEmail
fake: AsciiEmail
fake: AsciiFreeEmail
fake: AsciiSafeEmail
fake: CompanyEmail
fake: DomainName
fake: DomainWord
fake: FreeEmail
fake: FreeEmailDomain
fake: Hostname
fake: SafeDomainName
fake: SafeEmail
fake: Slug
File Fakers
fake: FileExtension
fake: FileName
fake: FilePath
fake: MimeType
fake: UnixDevice
fake: UnixPartition
Geo Fakers
fake: Coordinate
fake: Latitude
fake: Latlng
fake: LocalLatlng
fake: LocationOnLand
fake: Longitude
Internet Fakers
fake: Dga
fake: HttpMethod
fake: IanaId
fake: ImageUrl
fake: Ipv4
fake: Ipv4NetworkClass
fake: Ipv4Private
fake: Ipv4Public
fake: Ipv6
fake: MacAddress
fake: PortNumber
fake: RipeId
fake: Tld
fake: Uri
fake: UriExtension
fake: UriPage
fake: UriPath
fake: Url
Isbn Fakers
fake: Isbn10
fake: Isbn13
Job Fakers
fake: Job
Lorem Fakers
fake: Paragraphs
fake: Sentences
fake: Texts
fake: Words
Misc Fakers
fake: Binary
fake: Boolean
fake: Csv
fake: Dsv
fake: FixedWidth
fake: Image
fake: Json
fake: Md5
fake: NullBoolean
fake: Password
fake: Psv
fake: Sha1
fake: Sha256
fake: Tar
fake: Tsv
fake: Uuid4
fake: Zip
Person Fakers
fake: LanguageName
fake: LastNameFemale
fake: LastNameMale
fake: LastNameNonbinary
fake: Name
fake: NameFemale
fake: NameMale
fake: NameNonbinary
fake: Prefix
fake: PrefixFemale
fake: PrefixMale
fake: PrefixNonbinary
fake: Suffix
fake: SuffixFemale
fake: SuffixMale
fake: SuffixNonbinary
Phone_Number Fakers
fake: CountryCallingCode
fake: Msisdn
Profile Fakers
fake: Profile
fake: SimpleProfile
Providers Fakers
fake: Bothify
fake: Hexify
fake: LanguageCode
fake: Lexify
fake: Locale
fake: Numerify
Python Fakers
fake: Pybool
fake: Pydecimal
fake: Pydict
fake: Pyfloat
fake: Pyint
fake: Pyiterable
fake: Pylist
fake: Pyset
fake: Pystr
fake: PystrFormat
fake: Pystruct
fake: Pytuple
Ssn Fakers
fake: Ein
fake: InvalidSsn
fake: Itin
fake: Ssn
User_Agent Fakers
fake: AndroidPlatformToken
fake: Chrome
fake: Firefox
fake: InternetExplorer
fake: IosPlatformToken
fake: LinuxPlatformToken
fake: LinuxProcessor
fake: MacPlatformToken
fake: MacProcessor
fake: Opera
fake: Safari
fake: UserAgent
fake: WindowsPlatformToken
"""
