## Code for the implementation


class MigrationUtility:
    def __init__(self, gcloud_invoke, rules_file, gcloud_output, output_folder):
        self.gcloud_invoke = gcloud_invoke
        self.rules_file = rules_file
        self.gcloud_output = gcloud_output
        self.output_folder = output_folder

    def migrate_roles(self):
        pass

def run_migration(gcloud_invoke, rules_file, gcloud_output, output_folder):
    migration_utility = MigrationUtility(gcloud_invoke=gcloud_invoke, rules_file=rules_file,
                                         gcloud_output=gcloud_output,
                                         output_folder=output_folder)
    migration_utility.load_rules()
    migration_utility.migrate_files()
