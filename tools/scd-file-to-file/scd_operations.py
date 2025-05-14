from google.cloud import storage
import pandas as pd
import re
import uuid


def scd_update_delete_generation(
    gcs_input_path,
    gcs_output_path,
    primary_key_column,
    scd_column_list,
    effective_from_date_column,
    effective_to_date_column,
    active_flag_column,
    unique_scd_keys_for_generation,
    percentage_for_update_scd_generation,
) -> str:
    """Generates Slowly Changing Dimension (SCD) Type 2 data for updates and deletes.

    This function reads data from a CSV file in Google Cloud Storage (GCS),
    identifies records for updates and deletes based on the provided parameters,
    and writes the generated SCD data to a new CSV file in GCS.

    Args:
        gcs_input_path (str): The GCS path to the input CSV file.
        gcs_output_path (str): The GCS path to the output CSV file.
        primary_key_column (str): The name of the primary key column.
        scd_column_list (str): A comma-separated list of columns to consider for SCD changes.
        effective_from_date_column (str): The name of the column for the effective from date.
        effective_to_date_column (str): The name of the column for the effective to date.
        active_flag_column (str): The name of the column indicating active records.
        unique_scd_keys_for_generation (int): The number of unique keys to use for SCD generation.
        percentage_for_update_scd_generation (float): The percentage of records to use for updates.

    Returns:
        Return the status of the SCD Generation as Succeeded or Failed. If Failed, it returns along with the error message
    """

    try:
        storage_client = storage.Client()
        df = pd.read_csv(
            gcs_input_path, storage_options={"client": storage_client}, header=0
        )

        scd_staging_temp = df[
            df[active_flag_column] == True
        ].copy()  # Create a copy to avoid SettingWithCopyWarning

        scd_staging_temp = scd_staging_temp.sample(frac=1).reset_index(drop=True)
        split_index = int(len(scd_staging_temp) * percentage_for_update_scd_generation)
        scd_staging = scd_staging_temp[:split_index].copy()
        scd_staging_delete = scd_staging_temp[split_index:].copy()
        scd_staging_delete["action_flag"] = "D"

        # Assigning Id's
        scd_staging["id"] = scd_staging.reset_index().index + 1
        scd_staging["processed_flag"] = False
        scd_staging["action_flag"] = "U"

        # Get total records
        total_records = len(scd_staging)

        print(
            f"Update SCD Count Generation={total_records}, Unique SCD Keys for Generation={unique_scd_keys_for_generation}"
        )
        columns_to_process = scd_column_list.split(",")

        for current_column in columns_to_process:
            # Get unique values for SCD generation
            scd_array = (
                df[current_column]
                .drop_duplicates()
                .head(unique_scd_keys_for_generation)
                .values
            )
            if scd_array.size == 0:  # Handle potential empty array
                scd_array = [None]  # Use a list with None if the array is empty

            array_len = len(scd_array)
            print("For the Column:", current_column)
            print("Array Length:", array_len)  # Print the array length for debugging
            batch_size = max(
                int(total_records / array_len), 1
            )  # Ensure batch_size is at least 1
            print("Batch Size:", batch_size)  # Print the batch size for debugging
            i = 1
            array_index = 0
            unporcessed_record_count = len(
                scd_staging[scd_staging["processed_flag"] == False]
            )

            while (
                unporcessed_record_count > 0
            ):  # Loop while there are unprocessed records
                j = i
                array_value = scd_array[array_index % array_len]
                k = min(i + batch_size - 1, total_records)

                mask = (scd_staging[current_column] != array_value) & (
                    scd_staging["processed_flag"] == False
                )

                if i <= total_records:  # Only apply id filter if within range
                    mask = mask & (scd_staging["id"] >= j) & (scd_staging["id"] <= k)

                scd_staging.loc[mask, current_column] = array_value
                scd_staging.loc[mask, effective_to_date_column] = pd.Timestamp.now()
                scd_staging.loc[mask, "processed_flag"] = True

                unporcessed_record_count = len(
                    scd_staging[scd_staging["processed_flag"] == False]
                )
                i += batch_size
                array_index += 1

            scd_staging["processed_flag"] = (
                False  # Reset processed flag for next column
            )

        p_status = "SCD Update Delete Generation succeeded"

        # scd_staging = scd_staging.sort_values(by=[primary_key_column])
        scd_staging = scd_staging.drop(
            columns=[
                "id",
                "effective_from_date",
                "effective_to_date",
                "active_flag",
                "processed_flag",
            ]
        )

        print("Records for SCD Update Logic Check")
        # print(scd_staging)  # Print the sorted DataFrame
        print("Records for SCD Delete Logic Check")
        scd_staging_delete = scd_staging_delete.drop(
            columns=["effective_from_date", "effective_to_date", "active_flag"]
        )
        # scd_staging_delete = scd_staging_delete.sort_values(by=[primary_key_column])
        # print(scd_staging_delete)

        union_scd = pd.concat([scd_staging, scd_staging_delete], ignore_index=True)
        union_scd = union_scd.sort_values(by=[primary_key_column])
        print(union_scd.to_string(index=False))

        # Extract the bucket name from the output path
        gcs_bucket = re.match(r"gs://([^/]+)/", gcs_output_path).group(1)

        # Extract the file name from the output path
        gcs_file_path = re.match(r"gs://([^/]+)/(.*)", gcs_output_path).group(2)

        # Get the bucket and blob (file) objects
        bucket = storage_client.bucket(gcs_bucket)
        blob = bucket.blob(gcs_file_path)

        # Upload the DataFrame to GCS
        blob.upload_from_string(union_scd.to_csv(index=False), content_type="text/csv")

        print(f"DataFrame uploaded to: gs://{gcs_bucket}/{gcs_file_path}")

    except Exception as e:
        p_status = f"SCD Update Delete Generation Failed: {e}"  # Include the actual error message

    print(p_status)


def scd_insert_generation(
    gcs_input_path,
    gcs_output_path,
    primary_key_column,
    scd_column_list,
    effective_from_date_column,
    effective_to_date_column,
    active_flag_column,
    unique_scd_keys_for_generation,
    number_of_insert_record_count,
) -> str:
    """Generates data for inserting new records into a Slowly Changing Dimension (SCD) Type 2 table.

    This function reads data from a CSV file in Google Cloud Storage (GCS),
    generates new records with unique primary keys and modified SCD columns,
    and writes the generated data to a new CSV file in GCS.

    Args:
        gcs_input_path (str): The GCS path to the input CSV file.
        gcs_output_path (str): The GCS path to the output CSV file.
        primary_key_column (str): The name of the primary key column.
        scd_column_list (str): A comma-separated list of columns to consider for SCD changes.
        effective_from_date_column (str): The name of the column for the effective from date.
        effective_to_date_column (str): The name of the column for the effective to date.
        active_flag_column (str): The name of the column indicating active records.
        unique_scd_keys_for_generation (int): The number of unique keys to use for SCD generation.
        number_of_insert_record_count (int): The number of insert records to generate.

    Returns:
        Return the status of the SCD Generation as Succeeded or Failed. If Failed, it returns along with the error message
    """

    try:
        storage_client = storage.Client()
        df = pd.read_csv(
            gcs_input_path, storage_options={"client": storage_client}, header=0
        )
        total_records = len(df)
        print(
            f"Insert SCD Count Generation={total_records}, Unique SCD Keys for Generation={unique_scd_keys_for_generation}"
        )

        scd_staging = df.sample(frac=1).reset_index(drop=True).copy()
        scd_staging["id"] = scd_staging.reset_index().index + 1
        scd_staging["processed_flag"] = False
        scd_staging["action_flag"] = "I"

        columns_to_process = scd_column_list.split(",")

        for current_column in columns_to_process:
            # Get unique values for SCD generation
            scd_array = (
                df[current_column]
                .drop_duplicates()
                .head(unique_scd_keys_for_generation)
                .values
            )
            if scd_array.size == 0:  # Handle potential empty array
                scd_array = [None]  # Use a list with None if the array is empty

            array_len = len(scd_array)
            print("For the Column:", current_column)
            print("Array Length:", array_len)  # Print the array length for debugging
            batch_size = max(
                int(total_records / array_len), 1
            )  # Ensure batch_size is at least 1
            print("Batch Size:", batch_size)  # Print the batch size for debugging
            i = 1
            array_index = 0
            unporcessed_record_count = len(
                scd_staging[scd_staging["processed_flag"] == False]
            )

            while (
                unporcessed_record_count > 0
            ):  # Loop while there are unprocessed records
                j = i
                array_value = scd_array[array_index % array_len]
                k = min(i + batch_size - 1, total_records)

                mask = (scd_staging[current_column] != array_value) & (
                    scd_staging["processed_flag"] == False
                )

                if i <= total_records:  # Only apply id filter if within range
                    mask = mask & (scd_staging["id"] >= j) & (scd_staging["id"] <= k)

                scd_staging.loc[mask, current_column] = array_value
                scd_staging.loc[mask, effective_to_date_column] = pd.Timestamp.now()
                scd_staging.loc[mask, "processed_flag"] = True

                unporcessed_record_count = len(
                    scd_staging[scd_staging["processed_flag"] == False]
                )
                i += batch_size
                array_index += 1

            scd_staging["processed_flag"] = (
                False  # Reset processed flag for next column
            )

        p_status = "SCD Insert Generation succeeded"
        # Sort by 'id' column
        scd_staging = scd_staging.sort_values(by=[primary_key_column])
        scd_staging = scd_staging.drop(
            columns=[
                "id",
                "effective_from_date",
                "effective_to_date",
                "active_flag",
                "processed_flag",
            ]
        )
        scd_staging[primary_key_column] = scd_staging.apply(
            lambda _: uuid.uuid4().int, axis=1
        )
        print("Records for SCD Insert Logic Check")
        print(scd_staging.to_string(index=False))

        # Extract the bucket name from the output path
        gcs_bucket = re.match(r"gs://([^/]+)/", gcs_output_path).group(1)

        # Extract the file name from the output path
        gcs_file_path = re.match(r"gs://([^/]+)/(.*)", gcs_output_path).group(2)

        # Get the bucket and blob (file) objects
        bucket = storage_client.bucket(gcs_bucket)
        blob = bucket.blob(gcs_file_path)

        # Upload the DataFrame to GCS
        blob.upload_from_string(
            scd_staging.to_csv(index=False), content_type="text/csv"
        )

        print(f"DataFrame uploaded to: gs://{gcs_bucket}/{gcs_file_path}")

    except Exception as e:
        p_status = (
            f"SCD Insert Generation Failed: {e}"  # Include the actual error message
        )

    print(p_status)
