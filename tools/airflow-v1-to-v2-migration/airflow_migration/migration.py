import csv
import glob
from pathlib import Path
import re


def parse_import_statement(import_statement):
    pattern = r'^(?:from\s+([\w.]+)\s+)?import\s+(?:\(([^)]+)\)|([\w., ]+))$'
    match = re.search(pattern, import_statement)

    if match:
        mod_name = match.group(1)
        imported_names = match.group(2) or match.group(3)
        if imported_names:
            imported_names = re.findall(r'([\w.]+)(?:\s+as\s+[\w.]+)?', imported_names)
        return mod_name, imported_names
    else:
        return None, None


class MigrationUtility:
    def __init__(self, rules_file, input_dir, output_dir):
        self.replacement_dict = {}
        self.rules_file = rules_file
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.function_regex = r'(\w+)\('

    def load_rules(self):
        with open(self.rules_file, 'r') as f:
            reader = csv.reader(f)
            for col in reader:
                self.replacement_dict[col[2].strip()] = (col[0].strip(), col[1].strip(), col[3].strip(), col[4].strip(), col[5].strip(), col[6].strip())

    @staticmethod
    def print_report(impacted_files):
        # temp method to print report on console , will modify this in phase 2
        print('Below is the list of impacted files')
        print(f'Total number of impacted files is {len(impacted_files)}')
        file_string = '\n '.join(impacted_files)
        print(file_string)

    def migrate_files(self, comment_flag, comment):
        impacted_files = []
        change_count = 0
        for filepath in glob.iglob(f"{self.input_dir}/*.py", recursive=True):
            change_count = 0
            filename = Path(filepath).stem
            new_file = f"{self.output_dir}/{filename}_v2.py"
            with open(filepath, 'r') as f, open(new_file, 'w') as temp:
                for line in f:
                    # check if a comment
                    # add feature to identify multi-line comments and ignore
                    if line.startswith('#'):
                        temp.write(line)
                        continue
                    # check if this is an import statement
                    mod_name, imported_names = parse_import_statement(line)
                    if mod_name is not None:
                        for idx, rec in enumerate(imported_names):
                            imp_stmt = ''
                            if mod_name:
                                imp_stmt = 'from ' + mod_name + ' '
                            imp_stmt += 'import ' + rec
                            if imp_stmt in self.replacement_dict:
                                change_count += 1
                                temp.write('# Migration Utility Generated Comment -- Change Type = ' +
                                           self.replacement_dict[imp_stmt][1] + " , Impact = " +
                                           self.replacement_dict[imp_stmt][3] + '\n')
                                temp.write(self.replacement_dict[imp_stmt][2] + '\n')
                            else:
                                temp.write(line)
                    else:
                        # extract function call
                        matches = re.findall(self.function_regex, line)

                        if matches:
                            # search rif required to replace
                            for rec in matches:
                                if rec in self.replacement_dict:
                                    change_count += 1
                                    temp.write('# Migration Utility Generated Comment -- Change Type = ' +
                                               self.replacement_dict[rec][1] + " , Impact = " +
                                               self.replacement_dict[rec][3] + '\n')
                                    line = line.replace(rec, self.replacement_dict[rec][2])
                        temp.write(line)

            if change_count > 0:
                impacted_files.append(filename+'.py')

        self.print_report(impacted_files)


if __name__ == "__main__":
    migration_utility = MigrationUtility(rules_file="../migration_rules/rules.csv", input_dir="../examples",
                                         output_dir="../output")
    migration_utility.load_rules()
    comment_flag = 0  # get the flag from user
    comment = "#some customized comment"  # input the comment from user
    migration_utility.migrate_files(comment_flag, comment)
