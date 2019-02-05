
# EDIT THESE WITH YOUR OWN DATASET/TABLES
billing_project_id = 'project_id'
billing_dataset_id = 'billing_dataset'
billing_table_name = 'billing_data'
output_dataset_id = 'output_dataset'
output_table_name = 'transformed_table'

# You can leave this unless you renamed the file yourself.
sql_file_path = 'cud_sud_attribution_query.sql'

# There are two slightly different allocation methods that affect how the Commitment charge is allocated:

# There are two slightly different allocation methods that affect how the
# Commitment charge is allocated:

# Method 1: Only UTILIZED commitment charges are allocated to projects.
# (P_method_1_CUD_commitment_cost): Utilized CUD commitment charges are
# proportionally allocated to each project based on its share of total eligible
# VM usage during the time increment (P_usage_percentage). Any unutilized
# commitment cost remains unallocated (BA_unutilized_commitment_cost) and is
# allocated to the shell project.

# Method 2: ALL commitment charges are allocated to projects (regardless of utilization).
# (P_method_2_CUD_commitment_cost): All CUD commitment charges are
# proportionally allocated to each project based on its share of total eligible
# VM usage during the time increment (P_usage_percentage). All commitment cost
# is allocated into the projects proportionally based on the CUD credits that
# they consumed, even if the commitment is not fully utilized.
allocation_method = 'P_method_2_commitment_cost'
