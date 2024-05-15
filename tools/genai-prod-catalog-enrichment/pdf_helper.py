import os
# from genai_helper import *
from google.cloud import storage
import fitz


def image_info_for_page(pdf_file, images_path,
                        page, page_index, gcs_bucket=None):
    images_info = page.get_images()
    # print(len(images_info))
    bound = page.bound()
    xmin, ymin, xmax, ymax = bound[0], bound[1], bound[2], bound[3]
    images = []
    i = 0
    for i_no, image_info in enumerate(images_info, start=1):
        try:
            image_xref = image_info[0]
            image_id = image_info[7]
            # print(image_id)
            # print(image_xref, image_id)
            bbox = page.get_image_bbox(image_id)
            if ((bbox[0] < xmin or bbox[0] > xmax) and
                (bbox[2] < xmin or bbox[2] > xmax)) or \
                ((bbox[1] < ymin or bbox[1] > ymax) and
                 (bbox[3] < ymin or bbox[3] > ymax)):
                continue
            # print(bbox)
            base_image = pdf_file.extract_image(image_xref)
            # Store image bytes
            image_bytes = base_image['image']
            # Store image extension
            image_ext = base_image['ext']
            if not (str(image_ext.lower()) == "jpeg"
                    or str(image_ext.lower()) == "jpg"
                    or str(image_ext.lower()) == "png"):
                continue
            i = i+1
            # Generate image file name
            image_name = str(page_index)+"_"+str(i) + '.' + image_ext
            image_name = os.path.join(images_path, image_name)
            if gcs_bucket:
                url = f"gs://{gcs_bucket}/{image_name}"
                bucket_object = storage.Client().bucket(gcs_bucket)
                image_name = bucket_object.blob(image_name)
                with image_name.open('wb') as image_file:
                    image_file.write(image_bytes)
            else:
                url = image_name
                with open(image_name, 'wb') as image_file:
                    image_file.write(image_bytes)
            image = {"xref": image_xref, "id": image_id,
                     "image_url": url,
                     "bbox": (bbox[0], bbox[1], bbox[2], bbox[3])}
            # print(image_name)
            # print(image["bbox"])
            images.append(image)
        except Exception as e:
            print(f"[ERROR]: extracting an image - {e}")
    return images


def text_info_for_page(pdf_file, page):
    texts = {"full_text": "", "spans": []}
    file_dict = page.get_text('dict')
    texts["full_text"] = str(page.get_text(sort=True))

    blocks = file_dict['blocks']
    for block in blocks:
        # print(block)
        if block["type"] == 0:
            # print(block["lines"])
            for line in block["lines"]:
                for span in line["spans"]:
                    # print(span)
                    if span['text'].strip() != '':
                        texts["spans"].append(span)
                        # print(span['text'])
    return texts


def get_info_for_page(pdf_file, page,
                      page_index, images_path, gcs_bucket=None):
    text_info = {}
    image_info = []
    image_info = image_info_for_page(pdf_file, images_path,
                                     page, page_index, gcs_bucket)
    text_info = text_info_for_page(pdf_file, page)
    return {"images": image_info, "texts": text_info}


def check_text_pdf(filename, input_gcs_bucket=None):
    if filename.endswith('.pdf'):
        if input_gcs_bucket:
            bucket_object = storage.Client().bucket(input_gcs_bucket)
            blob = bucket_object.blob(filename)
            pdf_file = fitz.open("pdf", blob.download_as_bytes())
        else:
            pdf_file = fitz.open(filename)
        text = True
        for i, page in enumerate(pdf_file):
            if page.get_text():
                pass
            else:
                text = False
                print(f"[ERROR]: Page {i+1} of "
                      f"{filename} PDF is a scanned page!")
                break
        return text
    else:
        print(f"[ERROR]: {filename} is not a valid PDF!")
        return False


def get_info_for_pdf(filename, images_path,
                     input_gcs_bucket=None, image_gcs_bucket=None):
    if input_gcs_bucket:
        bucket_object = storage.Client().bucket(input_gcs_bucket)
        blob = bucket_object.blob(filename)
        pdf_file = fitz.open("pdf", blob.download_as_bytes())
    else:
        pdf_file = fitz.open(filename)
    pdf_dict = {"pages": [], "file_url": f"gs://{input_gcs_bucket}/{filename}"}
    for page_index, page in enumerate(pdf_file, start=1):
        page_info = get_info_for_page(pdf_file, page,
                                      page_index, images_path,
                                      image_gcs_bucket)
        pdf_dict["pages"].append(page_info)
    return pdf_dict


def parse_pdf(filename, input_gcs_bucket, output_gcs_bucket):
    name = filename.split("/")[-1]
    images_path = f"images/{name}".replace(".pdf", "")
    pdf_json = get_info_for_pdf(filename, images_path,
                                input_gcs_bucket, output_gcs_bucket)
    # create_json_from_dict(json_path,pdf_json,output_gcs_bucket)
    return pdf_json
