import csv
import glob
from pathlib import Path
import re


def clean_input(arg):
    return arg.strip().replace('\n', '')


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
    def __init__(self, input_dir, output_dir, rules_file, add_comments, comments, report_generation):
        self.replacement_dict = {}
        self.rules_file = rules_file
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.add_comments = add_comments
        self.comments = comments
        self.report_generation = report_generation
        # self.function_regex = r'(\w+)\('
        self.function_regex = r'(\w+(?:\.\w+)*)\('

    def load_rules(self):
        with open(self.rules_file, 'r') as f:
            reader = csv.reader(f)
            for col in reader:
                self.replacement_dict[col[2].strip()] = (clean_input(col[0]), clean_input(col[1]), clean_input(col[3]),
                                                         clean_input(col[4]), clean_input(col[5]), clean_input(col[6]))

    @staticmethod
    def print_report(impacted_files):
        # temp method to print report on console , will modify this in phase 2
        print("#" * 40)
        print("          REPORT GENERATION           ")
        print("#" * 40)
        print()

        print('Below is the list of impacted files')
        print(f'Total number of impacted files is - {len(impacted_files)}')
        file_string = '\n '.join(impacted_files)
        print(file_string)
        # Conclusion
        print("#" * 40)
        print("             END OF REPORT             ")
        print("#" * 40)

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
                                if self.add_comments:
                                    if self.comments:
                                        comment = '# ' + self.comments + '\n'
                                    else:
                                        comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                  self.replacement_dict[imp_stmt][1] + " , Impact = " + \
                                                  self.replacement_dict[imp_stmt][3] + '\n'
                                    temp.write(comment)
                                temp.write(self.replacement_dict[imp_stmt][2] + '\n')
                            else:
                                temp.write(imp_stmt + '\n')
                    else:
                        # extract Operator Name from the current line 
                        matches = re.findall(self.function_regex, line)

                        if matches:
                            # Iterate over all the perator name matches and check if that matches with any of the rules in rule dict
                            for rec in matches:
                                if rec in self.replacement_dict:
                                    change_count += 1
                                    if self.add_comments:
                                        if self.comments:
                                            comment = '# ' + self.comments + '\n'
                                        else:
                                            comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                      self.replacement_dict[rec][1] + " , Impact = " + \
                                                      self.replacement_dict[rec][3] + '\n'
                                        temp.write(comment)
                                    line = line.replace(rec, self.replacement_dict[rec][2])
                                    # Argument CHanges - Check for a rule in rules dict with Operatorname+( e.g. BigQueryOperator(
                                    if rec+"(" in self.replacement_dict:
                                        space_count = len(line) - len(line.lstrip())
                                        space_count +=4
                                        if self.add_comments:
                                            if self.comments:
                                                comment = '# ' + self.comments + '\n'
                                            else:
                                                comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                      self.replacement_dict[rec+"("][1] + " , Impact = " + \
                                                      self.replacement_dict[rec+"("][3] + '\n'
                                            temp.write(comment)
                                        # Truncate the new line character and hold in temp variable to check if line ends with ) to identify if operator call is in single line
                                        # if it is single line operator function execute the if statment and add argument in the current line itself 
                                        # else add a new line with argument details from rule dict
                                        truncatedLine = line.strip()
                                        if truncatedLine.endswith(")"):
                                            line = line.replace(")",","+self.replacement_dict[rec+"("][2]+")")
                                        else:
                                            line = line+' '*space_count +self.replacement_dict[rec+"("][2]+",\n"

                        temp.write(line)

            if change_count > 0:
                impacted_files.append(filename+'.py')
        if self.report_generation:
            self.print_report(impacted_files)


def run_migration(input_dag, output_dag, rules_file, add_comments, comments, report_generation):
    migration_utility = MigrationUtility(input_dir=input_dag, output_dir=output_dag,
                                         rules_file=rules_file, add_comments=add_comments,
                                         comments=comments, report_generation= report_generation)
    migration_utility.load_rules()
    migration_utility.migrate_files(add_comments, comments)
