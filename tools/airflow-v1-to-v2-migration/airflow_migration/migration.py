import csv
import glob
from pathlib import Path


def find_line_no():
    line_no = 0
    file_1_line = script.readline()
    file_2_line = f2.readline()
    while file_1_line != '' or file_2_line != '':
        file_1_line = file_1_line.rstrip()
        file_2_line = file_2_line.rstrip()
        if file_1_line != file_2_line:
            lists.append(line_no)
        line_no = line_no + 1
        file_1_line = script.readline()
        file_2_line = f2.readline()
        if file_1_line == '' or file_2_line == '':
            break
    


def add_comment():

    file_2_line = f3.readlines()
    count = 0
    print(lists)
    file_2_line.insert(lists[0], "#Migration Utility Generated Comment -- " + comments[0] + "\n")
    for i in lists[1:]:  # 4   6
        if count < len(lists):  # 0<3  1<3
            count = count + 1  # count=1    count=2
        print(i)  ##4  6
        i = count + i

        file_2_line.insert(i, "#Migration Utility Generated Comment -- " + comments[count] + "\n")
        lists[count] = lists[count] + 1  # list[1]=6    list[2]=
    open(new_file, 'w').close()
    f3.writelines(file_2_line)


class Migration:
    def __init__(self, rules_file):
        self.rules_file = rules_file
        self.rules = {}

    def load_rules(self):
        with open(self.rules_file, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                self.rules[row[2]] = [row[3], row[4], row[5], row[6], row[0], row[1]]

    def apply_rules(self, content):
        for key, value in self.rules.items():
            if value[5] != "Argument changes" and value[3] == "FALSE" and value[2] == "TRUE":
                print("pp")
                content = content.replace(key, value[0])
                comments.append(value[1])
            elif value[5] == "Argument changes" and value[3] == "TRUE" and value[2] == "TRUE":
                print("yes")
                content = content.replace(value[4], value[4] + " #Migration Utility Generated Comment" + " " + value[1])
                # comments.append("#Migration Utility Generated Comment --  Manual Intervention required if it's change in argument"+value[1] + "\n")
        return content


if __name__ == "__main__":
    print("check")
    for filepath in glob.iglob('../examples/*.py', recursive=True):
        line_no = 0

        lists = []
        comments = []
        rules = Migration("../migration_rules/rules.csv")
        rules.load_rules()
        filename = Path(filepath).stem
        new_file = '../output/' + filename + "_v2.py"
        with open(filepath) as inputfile:
            content = inputfile.read()
            read_line = inputfile.readlines()
            with open(new_file, "w") as outputfile:
                content = rules.apply_rules(content)
                outputfile.write(content)
                print(new_file)
            with open(filepath) as script, \
                    open(new_file, 'r+') as f2:
                find_line_no()
            with open(new_file, 'r+') as f3:
                add_comment()
            print(comments)
