# EDIT THESE WITH YOUR OWN DATASET/TABLES
billing_project_id = 'project_id'
billing_dataset_id = 'billing_dataset'
billing_table_name = 'billing_data'
output_dataset_id = 'output_dataset'
output_table_name = 'transformed_table'

# You can leave this unless you renamed the file yourself.
sql_file_path = 'cud_sud_attribution_query.sql'

# There are two slightly different allocation methods that affect how the Commitment charge is allocated:

# Method 1: Utilized commitment charges are allocated to cost buckets proportionally to buckets share of 
# total eligible VM usage during the time increment (P_usage_percentage).
# any untilized commitment cost remains unallocated (BA_unutilized_commitment_cost).

#Method 2: All commitment charges are allocated to buckets (P_method_2_CUD_commitment_cost) proportionally 
# to the buckets share of total eligible VM usage during the time increment (P_usage_percentage). All 
# commitment cost is allocated into the buckets proportionally to the CUD credits that they consumed, even 
# if the commitment is not fully utilized.
allocation_method = 'P_method_2_commitment_cost'
