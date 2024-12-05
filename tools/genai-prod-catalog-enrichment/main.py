import os
import json
import csv
import traceback
import datetime
import time
import requests
import fitz
from pdf_helper import parse_pdf
from genai_helper import generate_faqs, \
    generate_isqs, generate_company_details, \
    get_specific_caption, \
    generate_tags_json, generate_category_json
from genai_helper import generate_images_json as gij
from text_helper import clean_text, get_company_text
from google.cloud import storage


def get_todays_date():
    """Returns today's date in 'DD_MM_YYYY' format."""
    today = datetime.date.today()
    return today.strftime('%d_%m_%Y')


def download_blob(bucket_name, source_blob_name,
                  destination_file_name, prefix, csv_folder):
    """Downloads a blob from the bucket."""

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(f"{prefix}/{source_blob_name}")
    blob.download_to_filename(f"{csv_folder}/{destination_file_name}")
    print(
        "[INFO]: Downloaded storage object "
        "{} from bucket {} to local file {}.".format(
            source_blob_name, bucket_name, destination_file_name
        )
    )


def upload_blob(bucket_name, source_file_name,
                destination_blob_name, prefix, date_):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(f"{prefix}/{date_}/{destination_blob_name}")
    blob.upload_from_filename(source_file_name)

    print(f"[INFO]: File {source_file_name} "
          f"uploaded to {destination_blob_name}.")


def get_csv_info(csv_gcs_uri, bucket_name, csv_folder):
    download_blob(bucket_name, csv_gcs_uri.split('/')[-1],
                  csv_gcs_uri.split("/")[-1],
                  csv_gcs_uri.split('/')[-2], csv_folder)
    with open(f"{csv_folder}/{csv_gcs_uri.split('/')[-1]}", "r") as f:
        reader = csv.reader(f)
        csv_data = list(reader)
    return csv_data[1:]


def download_pdf(url, filename):
    response = requests.get(url)
    with open(filename, 'wb') as f:
        f.write(response.content)


def update_output_json(json_output_response, faq_json, isq_json,
                       product_images, product_category, product_tags, error_ws2_message):
    todays_date = get_todays_date()
    products_output_response = get_output_template()
    products_output_response[0]["product_name_citation"][0]["created_date"] = todays_date
    products_output_response[0]["specification_citation"][0]["created_date"] = todays_date
    products_output_response[0]["product_image_citation"][0]["created_date"] = todays_date
    products_output_response[0]["product_category_citation"][0]["created_date"] = todays_date

    try:
        products_output_response[0]["product_images"] = product_images
        products_output_response[0]["product_category"] = product_category
        products_output_response[0]["product_tags"] = product_tags
        if "response_error" not in isq_json:
            if "product_name" in isq_json:
                products_output_response[0]["product_name"] = isq_json["product_name"]
            if "confidence_score" in isq_json:
                products_output_response[0]["product_name_citation"][0]["confidence_score"] = isq_json["confidence_score"]
                products_output_response[0]["specification_citation"][0]["confidence_score"] = isq_json["confidence_score"]
            if "specifications" in isq_json:
                products_output_response[0]["specification"] = isq_json["specifications"]
            json_output_response["products"].extend(products_output_response)
        else:
            products_output_response[0] = {**products_output_response[0], **isq_json}
            json_output_response["products"].extend(products_output_response)
        if "response_error" not in products_output_response[0] and error_ws2_message != '':
            response_error = {"message": error_ws2_message}
            products_output_response[0]["response_error"] = response_error
        if "response_error" not in faq_json:
            json_output_response["catalogue_faqs"].extend(faq_json[list(faq_json.keys())[0]])
        else:
            json_output_response["catalogue_faqs"].append(faq_json)

        return json_output_response

    except Exception as e:
        print(f"[ERROR]: Error while updating output JSON - {e}")
        return {}


def get_output_template():
    products_output_response = [
        {
            "product_name": [],
            "product_name_citation": [
                {
                    "pdf_name": "",
                    "url": "",
                    "page": 0,
                    "startIndex": [],
                    "endIndex": [],
                    "confidence_score": 0.0,
                    "created_date": "01/01/1970"
                }
            ],
            "specification": {},
            "specification_citation": [
                {
                    "attribute": "",
                    "pdf_name": "",
                    "url": "",
                    "page": 0,
                    "startIndex": [],
                    "endIndex": [],
                    "confidence_score": 0.0,
                    "created_date": "01/01/1970"
                }
            ],
            "product_images": [
            ],
            "product_image_citation": [
                {
                    "pdf_name": "",
                    "url": "",
                    "page": 0,
                    "startIndex": [],
                    "endIndex": [],
                    "confidence_score": 0.0,
                    "created_date": "01/01/1970"
                }
            ],
            "product_category": [],
            "product_tags": [],
            "product_category_citation": [
                {
                    "pdf_name": "",
                    "url": "",
                    "page": 0,
                    "startIndex": [],
                    "endIndex": [],
                    "confidence_score": 0.0,
                    "created_date": "01/01/1970"
                }
            ]
        }
    ]
    return products_output_response


def create_json_from_dict(json_path, dict_, gcs_bucket=None):
    if gcs_bucket:
        bucket_object = storage.Client().get_bucket(gcs_bucket)
        json_path = bucket_object.blob(json_path)
        json_obj = json.dumps(dict_)
        json_path.upload_from_string(data=json_obj,
                                     content_type='application/json')
    else:
        with open(json_path, "w") as outfile:
            json.dump(dict_, outfile)


def check_pdf_type(filename, input_gcs_bucket=None):
    scanned = False
    tables = False
    images = False
    total_images = 0
    if input_gcs_bucket:
        bucket_object = storage.Client().bucket(input_gcs_bucket)
        blob = bucket_object.blob(filename)
        pdf_file = fitz.open("pdf", blob.download_as_bytes())
    else:
        pdf_file = fitz.open(filename)
    pages = []
    for page_no, page in enumerate(pdf_file, start=1):
        page_wise_details = {"scanned": False,
                             "Images": False,
                             "Tables": False,
                             "Total Images": 0}
        print(f"Page no {page_no}")
        if not page.get_text():
            print("[Info]: scanned!")
            scanned = True
            page_wise_details["scanned"] = True
        images_info = page.get_images()
        print(f"[Info]: No of images: {len(images_info)}")
        if len(images_info) > 0:
            images = True
            page_wise_details["Images"] = True
            page_wise_details["Total Images"] = len(images_info)
            total_images = total_images + len(images_info)
        tables = page.find_tables()
        if len(list(tables)) > 0:
            print("[Info]: Tables present")
            tables = True
            page_wise_details["Tables"] = True
        pages.append(page_wise_details)
    return {"scanned": scanned, "Tables": tables,
            "Images": images, "Total_Images": total_images,
            "pages": pages}


def end_to_end_pipeline(input_pdf_uri, output_gcs_bucket, project_id):
    # csv_folder = "csv"
    pdf_folder = "pdf_files"
    # date_ = get_todays_date()
    # os.makedirs(csv_folder, exist_ok=True)
    os.makedirs(pdf_folder, exist_ok=True)

    try:
        start = time.time()
        # csv_data = get_csv_info(csv_gcs_uri, bucket_name, csv_folder)
        end = time.time()
        print(f"[INFO]: CSV data fetched "
              f"successfully in {end - start} seconds")
    except Exception as e:
        print(f"[ERROR]: Error "
              f"during fetching data from CSV - {e}")
        return None

    uri = input_pdf_uri

    # check if file name exists
    full_path = uri.replace("gs://", "")
    input_gcs_bucket = full_path.split("/")[0]
    filename = full_path.replace(f"{input_gcs_bucket}/", "")
    name = filename.split("/")[-1]
    output_gcs_bucket = output_gcs_bucket

    try:
        pdf_type = check_pdf_type(filename, input_gcs_bucket)
        if not pdf_type["scanned"]:
            start = time.time()
            pdf_json = parse_pdf(filename, input_gcs_bucket, output_gcs_bucket)
            end = time.time()
            print(f"[INFO]: Parsed PDF successfully in {end - start} seconds")

            pdf_json = get_specific_caption(pdf_json)
            name_initials = name.replace(".pdf", "")
            json_path = f"./{name_initials}.json"
            create_json_from_dict(json_path, pdf_json, output_gcs_bucket)
            pdf_json = clean_text(pdf_json)
            json_output_response = {
                "pdf_name": f"{filename.split('/')[-1]}",
                "pdf_url": uri,  # f"gs://{input_gcs_bucket}/{filename}",
                "company_details": {},
                "products": [],
                "catalogue_faqs": []
                # "pc_item_doc_id": pc_item_doc_id,
                # "pc_doc_modified_date": pc_doc_modified_date,
                # "pc_item_doc_path": pc_item_doc_path,
                # "fk_pc_item_id": fk_pc_item_id,
                # "fk_glusr_usr_id": fk_glusr_usr_id
            }
            print(json_output_response, "\n")
            start = time.time()
            company_text = get_company_text(pdf_json['pages'])
            if company_text:
                company_details = \
                    generate_company_details(company_text, project_id)
                if "company_details" in company_details:
                    json_output_response["company_details"] = \
                        company_details["company_details"]
                elif "response_error" in company_details:
                    json_output_response["company_details"] = \
                        company_details
                else:
                    json_output_response["company_details"] = {}
            end = time.time()
            print(f"[INFO]: Company details "
                  f"extraction time: {end - start} seconds")
            for page_no, page in enumerate(pdf_json['pages']):
                try:
                    print(str(page_no))
                    context = page['texts']['full_text']
                    start = time.time()
                    faq_json = generate_faqs(context, project_id)
                    isq_json = generate_isqs(context, project_id)
                    end = time.time()
                    print(f"[INFO]: FAQ, ISQ generation "
                          f"time for page {page_no + 1}: "
                          f"{end - start} seconds")

                    error_ws2_msg = ''
                    try:
                        products = isq_json['product_name']
                    except Exception:
                        products = []
                    print("Products:", products)
                    if len(products) > 0:
                        try:
                            start = time.time()
                            product_tags = \
                                generate_tags_json(context, products)
                            end = time.time()
                            print(f"[INFO]: Product tag "
                                  f"generation time for page {page_no + 1}: "
                                  f"{end - start} seconds")
                        except Exception:
                            print(f"[ERROR]: Error during generation "
                                  f"of product tags -"
                                  f" {str(traceback.format_exc())}")
                            error_ws2_msg = error_ws2_msg
                            product_tags = {}
                        try:
                            start = time.time()
                            product_category = \
                                generate_category_json(context, products)
                            end = time.time()
                            print(
                                f"[INFO]: Product category generation time "
                                f"for page {page_no + 1}: "
                                f"{end - start} seconds")
                        except Exception:
                            print(
                                f"[ERROR]: Error during generation of"
                                f" product category - "
                                f"{str(traceback.format_exc())}")
                            product_category = {}

                        try:
                            start = time.time()
                            image_json = \
                                gij(page, products,
                                    product_tags, output_gcs_bucket)
                            end = time.time()
                            print(f"[INFO]: Image JSON generation "
                                  f"time for page {page_no + 1}:"
                                  f" {end - start} seconds")
                        except Exception as error:
                            print(
                                f"[ERROR]: Error during generation "
                                f"of product category - "
                                f"{str(traceback.format_exc())} + {error}")
                            error_ws2_msg = \
                                error_ws2_msg + "\n" \
                                + 'Product image json ' \
                                  'generation failed - {str(e)}'
                            image_json = {}
                    else:
                        product_tags = {}
                        product_category = {}
                        image_json = {}

                    start = time.time()
                    json_output_response = \
                        update_output_json(json_output_response,
                                           faq_json, isq_json, image_json,
                                           product_category,
                                           product_tags, error_ws2_msg)
                    end = time.time()
                    print(f"[INFO]: Output for page {page_no + 1}: "
                          f"updated in {end - start} seconds")
                except Exception as error:
                    print(f"[ERROR]: Error during generating "
                          f"final json - "
                          f"{str(traceback.format_exc())} - {error}")

            final_json_path = f"{name_initials}_ouput.json"
            start = time.time()
            create_json_from_dict(final_json_path,
                                  json_output_response,
                                  output_gcs_bucket)
            end = time.time()
            print(f"[INFO]: Final output JSON "
                  f"uploaded to GCS in {end - start} seconds")
        else:
            print("[INFO]: Please process text PDF's only!")

        return json_output_response
    except Exception as error:
        print(f"[ERROR]: Error for filename: "
              f"{filename} - {str(traceback.format_exc())} - {error}")
