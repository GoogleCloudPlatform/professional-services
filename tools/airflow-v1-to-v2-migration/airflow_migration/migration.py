#import libraries
import csv
import glob
from pathlib import Path


def find_line_no():
    """
    Compares the v1 files with v2 files and
    finds the line numbers where the replaced is done.
    """
    line_nos = 0
    file_1_line = v1_script.readline()
    file_2_line = v2_script.readline()
    while file_1_line != '' or file_2_line != '':
        file_1_line = file_1_line.rstrip()
        file_2_line = file_2_line.rstrip()
        if file_1_line != file_2_line:
            line_no_list.append(line_nos)
        line_nos = line_nos + 1
        file_1_line = v1_script.readline()
        file_2_line = v2_script.readline()
        if file_1_line == '' or file_2_line == '':
            break


def add_comment():
    """
    Add comments where the lines have changed.
    """
    file_2_line = f3.readlines()
    count = 0
    file_2_line.insert(line_no_list[0], "#Migration Utility Generated Comment -- " + comments[0] + "\n")
    for i in line_no_list[1:]:
        if count < len(line_no_list):
            count = count + 1
        i = count + i
        file_2_line.insert(i, "#Migration Utility Generated Comment -- " + comments[count] + "\n")
        line_no_list[count] = line_no_list[count] + 1
    open(new_file, 'w').close()
    f3.writelines(file_2_line)


class Migration:
    """
        A class to represent migration rules.
    """

    def __init__(self, rules_file):
        self.rules_file = rules_file
        self.rules = {}

    def load_rules(self):
        """
            Load the rules from the rules file.
        """
        with open(self.rules_file, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                self.rules[row[2]] = [row[3], row[4], row[5], row[6], row[0], row[1]]

    def apply_rules(self, contents):
        """
               Apply the rules to the content.
        """
        for key, value in self.rules.items():
            if value[5] != "Argument changes" and value[3] == "FALSE" and value[2] == "TRUE":
                contents = contents.replace(key, value[0])
                comments.append(value[1])
            elif value[5] == "Argument changes" and value[3] == "TRUE" and value[2] == "TRUE":
                contents = contents.replace(value[4], value[4] + " #Migration Utility Generated Comment" + " " + value[1])
        return contents


if __name__ == "__main__":
    for filepath in glob.iglob('../examples/*.py', recursive=True):
        line_nos = 0
        line_no_list = []
        comments = []
        rules = Migration("../migration_rules/rules.csv")
        rules.load_rules()
        filename = Path(filepath).stem
        new_file = '../output/' + filename + "_v2.py"
        with open(filepath) as input_file:
            content = input_file.read()
            with open(new_file, "w") as output_file:
                content = rules.apply_rules(content)
                output_file.write(content)
            with open(filepath) as v1_script, \
                    open(new_file, 'r+') as v2_script:
                find_line_no()
            with open(new_file, 'r+') as f3:
                add_comment()
