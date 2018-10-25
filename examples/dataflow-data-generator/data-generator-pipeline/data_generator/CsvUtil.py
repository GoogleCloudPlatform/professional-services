import cStringIO
import csv
from contextlib import closing

def dict_to_csv(input_dict, output_order=[]):
    """
    This funciton converts a python dictionary to a 
    CSV line. 
    Note keys in output schema that are missing in the 
    dictionary or that contains commas will result in 
    empty values.
    
    Arguments:
        dictionary: (dict) A dictionary containing the data of interest.
        output_order: (list of strings) The order of field names to write to CSV.
    """
    with closing(cStringIO.StringIO()) as csv_string:
        writer = csv.DictWriter(csv_string, output_order)
        writer.writerow(input_dict)
        # Our desired output is a csv string not a line in a file so we strip the
        # newline character written by the writerow function by default.
        return csv_string.getvalue().strip()
