
import csv
import glob
from pathlib import Path


class MigrationUtility:
    def __init__(self, rules_file, input_dir, output_dir):
        self.replacement_dict = {}
        self.rules_file = rules_file
        self.input_dir = input_dir
        self.output_dir = output_dir

    def load_rules(self):
        with open(self.rules_file, 'r') as f:
            reader = csv.reader(f)
            for col in reader:
                self.replacement_dict[col[2]] = (col[0], col[1], col[3], col[4], col[5], col[6])

    def migrate_files(self):
        for filepath in glob.iglob(f"{self.input_dir}/*.py", recursive=True):
            filename = Path(filepath).stem
            new_file = f"{self.output_dir}/{filename}_v2.py"
            with open(filepath, 'r') as f, open(new_file, 'w') as temp:
                for line in f:
                    for word, replacement in self.replacement_dict.items():
                        if word in line:
                            if replacement[1] != "Argument changes" and replacement[4] == "TRUE" and replacement[5] == "FALSE":
                                temp.write('#Migration Utility Generated Comment -- Change Type = ' + replacement[1] + " , Impact = " + replacement[3] + '\n')
                                temp.write(line.replace(word, replacement[2]))
                                break
                            elif replacement[4] == "TRUE" and replacement[5] == "TRUE":
                                temp.write('#Migration Utility Generated Comment -- Change Type = ' + replacement[1] + " , Impact = " + replacement[3] + '\n')
                    else:
                        temp.write(line)


if __name__ == "__main__":
    migration_utility = MigrationUtility(rules_file="../migration_rules/rules.csv", input_dir="../examples",output_dir="../output")
    migration_utility.load_rules()
    migration_utility.migrate_files()
