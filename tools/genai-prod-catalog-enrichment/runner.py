import time
from main import end_to_end_pipeline
import argparse


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract text/image from a PDF in Google Cloud Storage')
    parser.add_argument('pdf_uri', help='Google Cloud Storage URI of the PDF file')
    parser.add_argument('output_bucket_name', help='Name of the output bucket')
    parser.add_argument('project_id', help='Your Google Cloud project ID')
    args = parser.parse_args()

    # Check if all arguments are provided
    if not (args.pdf_uri and args.output_bucket_name and args.project_id):
        parser.print_help()  # Display the usage message
        exit(1)  # Exit with an error code

    try:
        start = time.time()
        # project_id = "sl-test-project-353312"
        # pdf_uri = "gs://test-sl/hepasky-herbal-liver-tablets.pdf" "test-sl" "sl-test-project-353312"
        # output_gcs_bucket = "test-sl"
        return_json = end_to_end_pipeline(args.pdf_uri, args.output_bucket_name, args.project_id)
        # with open("output_prod_details.json", "w") as outfile:
        #     json.dump(return_json, outfile, indent=4)
        # end = time.time()
        # print(f"[INFO]: Pipeline runtime - {end - start} seconds")
    except Exception as e:
        print(f"Error: {e}")
