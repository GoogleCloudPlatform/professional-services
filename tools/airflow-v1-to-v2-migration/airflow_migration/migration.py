import csv
import glob
from pathlib import Path
import re

from prettytable import PrettyTable


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

    # Function to generate summary report
    def generate_summary_report(self, total_num_dag, total_change_num, imp_num, imp_op_num, imp_op_arg_num,
                                impacted_imp_files, impacted_imp_operator_files, impacted_imp_operator_arg_files):
        summary_report = PrettyTable()
        summary_report.title = "SUMMARY REPORT"
        summary_report.field_names = ["DESCRIPTION", "INFO"]

        # Set the alignment of columns
        summary_report.align["DESCRIPTION"] = "l"
        summary_report.align["INFO"] = "l"

        # Adding count of the files
        summary_report.add_row(["Total number of DAG's", total_num_dag])
        summary_report.add_row(["Total number of DAG's with changes: ", total_change_num])
        summary_report.add_row(["Total number of DAG's with import changes: ", imp_num])
        summary_report.add_row(["Total number of DAG's with import and operator changes: ", imp_op_num])
        summary_report.add_row(
            ["Total number of DAG's with import, operator and argument changes: ", imp_op_arg_num])

        # Add blank rows to create spacing
        for _ in range(2):
            summary_report.add_row(["", ""])

        # Adding info on the files
        summary_report.add_row(["Impacted DAG's with import changes", [file for file in impacted_imp_files]])
        summary_report.add_row(["_" * 20, "_" * 20])
        summary_report.add_row(["Impacted DAG's with import and operator changes",
                                      [file for file in impacted_imp_operator_files]])
        summary_report.add_row(["_" * 20, "_" * 20])
        summary_report.add_row(["Impacted DAG's with import, operator and argument changes",
                                      [file for file in impacted_imp_operator_arg_files]])

        # Generate the empty report and add the table to the report
        summary_report_file = f"{self.output_dir}/Summary-Report.txt"
        with open(summary_report_file, "w") as sum_report:
            sum_report.write(str(summary_report))

    # Function to generate Detailed report
    def generate_detailed_report(self, line_changes):
        detailed_report = PrettyTable()
        detailed_report.title = "DETAILED REPORT"
        detailed_report.field_names = ["DAG FILE", "AUTOMATED", "CHANGE_TYPE", "LINE_NO", "OLD_STATEMENT", "NEW_STATEMENT"]

        # Set the alignment of columns
        # detailed_report.align["DESCRIPTION"] = "l"
        # detailed_report.align["DAG FILE"] = "l"
        detailed_report.align["DAG FILE"], detailed_report.align["AUTOMATED"], detailed_report.align["CHANGE_TYPE"], detailed_report.align["LINE_NO"], \
            detailed_report.align["OLD_STATEMENT"], detailed_report.align["NEW_STATEMENT"] = "l", "l", "l", "l", "l", "l"
        detailed_report.max_table_width = 300

        # Adding each value to the table
        for row in line_changes:
            detailed_report.add_row(row)

        # Generate the empty report and add the table to the report
        detailed_report_file = f"{self.output_dir}/Detailed-Report.txt"
        with open(detailed_report_file, "w") as det_report:
            det_report.write(str(detailed_report))

    def migrate_files(self):
        # Args for summary report
        impacted_files = []
        impacted_imp_files = []
        impacted_imp_op_files = []
        impacted_imp_op_arg_files = []
        total_num_dag = 0
        imp_num = 0
        imp_op_num = 0
        imp_op_arg_num = 0

        # Args for detailed report
        line_changes = []

        for filepath in glob.iglob(f"{self.input_dir}/*.py", recursive=True):
            total_num_dag += 1
            imp_change = False
            imp_op_change = False
            imp_op_arg_change = False
            change_count = 0
            filename = Path(filepath).stem
            new_file = f"{self.output_dir}/{filename}_v2.py"

            # Iterate through each file and open new v2 file
            with open(filepath, 'r') as f, open(new_file, 'w') as temp:
                for line_number, line in enumerate(f, start=1):
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
                                imp_change = True
                                change_count += 1
                                old_line = line
                                if self.add_comments:
                                    if self.comments:
                                        comment = '# ' + self.comments + '\n'
                                    else:
                                        comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                  self.replacement_dict[imp_stmt][1] + " , Impact = " + \
                                                  self.replacement_dict[imp_stmt][3] + '\n'
                                    temp.write(comment)
                                temp.write(self.replacement_dict[imp_stmt][2] + '\n')
                                line_changes.append(
                                    [filename + ".py", "Y", "Import_Change", line_number, old_line.rstrip(), self.replacement_dict[imp_stmt][2]])
                            else:
                                temp.write(imp_stmt + '\n')
                    else:
                        # extract Operator Name from the current line 
                        matches = re.findall(self.function_regex, line)

                        if matches:
                            # Iterate over all the operator name and check if that matches with any of the rules in
                            # rule dict
                            for rec in matches:
                                if rec in self.replacement_dict:
                                    old_line = line
                                    change_count += 1
                                    imp_change = False
                                    imp_op_change = True
                                    if self.add_comments:
                                        if self.comments:
                                            comment = '# ' + self.comments + '\n'
                                        else:
                                            comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                      self.replacement_dict[rec][1] + " , Impact = " + \
                                                      self.replacement_dict[rec][3] + '\n'
                                        temp.write(comment)
                                    line = line.replace(rec, self.replacement_dict[rec][2])
                                    line_changes.append(
                                        [filename + ".py", "Y", "Operator_Change", line_number, old_line.rstrip(), line.rstrip()])
                                    # Argument Changes - Check for a rule in rules dict with Operator name+( e.g.
                                    # BigQueryOperator(
                                    if rec + "(" in self.replacement_dict:
                                        old_line = line
                                        imp_change = False
                                        imp_op_change = False
                                        imp_op_arg_change = True
                                        space_count = len(line) - len(line.lstrip())
                                        space_count += 4
                                        if self.add_comments:
                                            if self.comments:
                                                comment = '# ' + self.comments + '\n'
                                            else:
                                                comment = '# Migration Utility Generated Comment -- Change Type = ' + \
                                                          self.replacement_dict[rec + "("][1] + " , Impact = " + \
                                                          self.replacement_dict[rec + "("][3] + '\n'
                                            temp.write(comment)
                                        # Truncate the new line character and hold in temp variable to check if line
                                        # ends with ")" to identify if operator call is in single line if it is single
                                        # line operator function execute the if statement and add argument in the
                                        # current line itself else add a new line with argument details from rule dict
                                        truncatedline = line.strip()
                                        if truncatedline.endswith(")"):
                                            line = line.replace(")", "," + self.replacement_dict[rec + "("][2] + ")")
                                            line_changes.append(
                                                [filename + ".py", "Y", "Argument_Change", line_number, old_line, line])
                                            print(line_changes)
                                        else:
                                            line = line + ' ' * space_count + self.replacement_dict[rec + "("][
                                                2] + ",\n"
                                            line_changes.append(
                                                [filename + ".py", "Y", "Argument_Change", line_number, old_line.rstrip(),
                                                 line.rstrip()])
                        temp.write(line)

            if change_count > 0:
                impacted_files.append(filename + '.py')

            # Append filename with an import change
            if imp_change:
                imp_num += 1
                impacted_imp_files.append(filename + '.py')
            # Append filename with an operator change
            if imp_op_change:
                imp_op_num += 1
                impacted_imp_op_files.append(filename + '.py')
            # Append filename with an argument change
            if imp_op_arg_change:
                imp_op_arg_num += 1
                impacted_imp_op_arg_files.append(filename + '.py')

        self.generate_summary_report(total_num_dag, imp_num + imp_op_num + imp_op_arg_num, imp_num, imp_op_num,
                                     imp_op_arg_num, impacted_imp_files, impacted_imp_op_files,
                                     impacted_imp_op_arg_files)
        # Append all filenames when is a change
        if self.report_generation:
            self.generate_detailed_report(line_changes)


def run_migration(input_dag, output_dag, rules_file, add_comments, comments, report_generation):
    migration_utility = MigrationUtility(input_dir=input_dag, output_dir=output_dag,
                                         rules_file=rules_file, add_comments=add_comments,
                                         comments=comments, report_generation=report_generation)
    migration_utility.load_rules()
    migration_utility.migrate_files()
