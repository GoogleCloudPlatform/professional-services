import re


def validate_comma_separated_string(input_string):
    # Define a regular expression pattern for valid format
    pattern = r'^\s*\w+\s*(,\s*\w+\s*)*$'

    # Use re.match() to check if the string matches the pattern
    if re.match(pattern, input_string):
        print(f'Successfully validated input_string {input_string} follows comma separated regex')
        return True
    else:
        print(f'Validation failed for input_string {input_string} to follow comma separated regex')
        return False
