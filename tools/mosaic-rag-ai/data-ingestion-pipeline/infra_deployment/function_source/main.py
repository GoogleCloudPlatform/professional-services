import functions_framework
from google.cloud import storage
import os
import fitz
from vertexai import rag
import vertexai
from dotenv import load_dotenv
from google import genai
import time
from fpdf import FPDF

GEMINI_API_KEY=os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL=os.environ.get("GEMINI_MODEL")
CORPUS_PATH=os.environ.get("CORPUS_PATH")
PROJECT_ID=os.environ.get("PROJECT_ID")
REGION=os.environ.get("REGION")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set!")
if not GEMINI_MODEL:
    raise ValueError("GEMINI_MODEL environment variable not set!")
if not CORPUS_PATH:
    raise ValueError("CORPUS_PATH environment variable not set!")
if not PROJECT_ID:
    raise ValueError("PROJECT_ID environment variable not set!")
if not REGION:
    raise ValueError("REGION environment variable not set!")


LOCAL_FOLDER_PATH = "./"
LOCAL_IMAGE_FOLDER_PATH = "./images"
LOCAL_IMAGE_PDF_FOLDER_PATH = "./images-pdf"
LOCAL_MEDIA_PDF_FOLDER_PATH = "./media-pdf"
IMAGE_PATH = "./images"
# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize the Cloud Storage client
storage_client = storage.Client()

# Initialize the Vertex AI SDK
vertexai.init(project=PROJECT_ID, location=REGION)

def create_pdf_from_text(text, output_dir, filename):
    """
    Converts text to a PDF and saves it in a designated directory.

    Args:
        text (str): The text data to convert.
        output_dir (str): The path to the directory where the file will be saved.
        filename (str): The name of the output PDF file.
    """
    # Ensure the output directory exists, create it if it doesn't.
    # The 'exist_ok=True' argument prevents an error if the directory already exists.
    os.makedirs(output_dir, exist_ok=True)

    pdf_filename = os.path.splitext(filename)[0] + ".pdf"
    # Construct the full, system-safe path for the output file.
    full_path = os.path.join(output_dir, pdf_filename)

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Times", size=12)
    # Use multi_cell to handle line breaks automatically
    pdf.multi_cell(0, 10, text)
    pdf.output(full_path)
    print(f"PDF created at {full_path}")
    return full_path



def upload_gemini_file(file_name):
  file = client.files.upload(file=file_name)

  while file.state == "PROCESSING":
      print('Waiting for Gemini file to be processed.')
      time.sleep(10)
      file = client.files.get(name=file.name)

  if file.state == "FAILED":
    raise ValueError(file.state)
  print(f'Gemini File processing complete: {file.uri}')

  return file

def upload_to_vertex_rag(file_path):
    """Uploads a file to the specified Vertex AI RAG corpus."""
    filename = os.path.basename(file_path)
    try:
      rag_file = rag.upload_file(
        corpus_name=CORPUS_PATH,
        path=file_path,
        display_name=filename,
        description=filename,
        )
      print(rag_file)  
    except Exception as e:
        print(f"Error uploading to Vertex AI RAG: {e}")

def process_image(image_path, image_filename):
    """Uses Gemini API to understand an image and uploads the response as a PDF."""
    print(f'processing image...{image_path}')
    try:
        gemini_file = upload_gemini_file(image_path)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[gemini_file, "explain the image in detail"],
        )
        print(response.text)
        if response.text:
            uploaded_image_pdf_path = create_pdf_from_text(response.text, LOCAL_IMAGE_PDF_FOLDER_PATH, image_filename)
            upload_to_vertex_rag(uploaded_image_pdf_path)
            os.remove(uploaded_image_pdf_path)
    except Exception as e:
        print(f"Error processing image with Gemini: {e}")

def process_pdf(file_path):
    """Extracts text and images from a PDF, processes images, and uploads the PDF."""
    try:
        doc = fitz.open(file_path)
        full_text = ""
        for page in doc:
            full_text += page.get_text()
            for img_index, img in enumerate(page.get_images(full=True)):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]

                # Save the extracted image to a file
                image_filename = f"image_p{page.number + 1}_{img_index + 1}.{image_ext}"
                image_path = os.path.join(LOCAL_IMAGE_FOLDER_PATH, image_filename)
                with open(image_path, "wb") as img_file:
                    img_file.write(image_bytes)
                print(f"Saved image to {image_path}")
                print(f"Processing image {img_index+1} from page {page.number + 1}...")

                process_image(image_path, image_filename)
                os.remove(image_path)

        # Create a PDF from the extracted text
        # In this example, we are not creating a new PDF from the extracted text.
        # The original PDF is uploaded directly.
        upload_to_vertex_rag(file_path)

    except Exception as e:
        print(f"Error processing PDF {file_path}: {e}")

def remove_file_from_rag(file_path):
    rag.delete_file(name=file_path)
    print(f"File {file_path} deleted.")

def delete_files_from_rag(file_name):
    # Extract file and bucket information from the CloudEvent
    files = rag.list_files(corpus_name=CORPUS_PATH)
    for file in files:
        print(f"comparing file name from RAG = {file.display_name} and file_name = {file_name}")
        if os.path.splitext(file.display_name)[0] == os.path.splitext(file_name)[0]:
            remove_file_from_rag(file.name)


def process_media(file_path, media_type):
    """Uses Gemini API for audio/video understanding and uploads the response as a PDF."""
    try:
        if media_type == "audio":
            gemini_file = upload_gemini_file(file_path)
            response = client.models.generate_content(
                    model=GEMINI_MODEL, contents=["Describe this audio clip", gemini_file]
                )
        elif media_type ==  "video":
            gemini_file = upload_gemini_file(file_path)
            response = client.models.generate_content(
                    model=GEMINI_MODEL, contents=["Describe the video", gemini_file]
                )
            
        if response.text:
            media_filename = os.path.basename(file_path)
            uploaded_media_pdf_path = create_pdf_from_text(response.text, LOCAL_MEDIA_PDF_FOLDER_PATH, media_filename)
            upload_to_vertex_rag(uploaded_media_pdf_path)
            os.remove(uploaded_media_pdf_path)

    except Exception as e:
        print(f"Error processing {media_type} file {file_path}: {e}")

@functions_framework.cloud_event
def process_event(cloud_event):
    """
    This function is triggered by a CloudEvent.
    """
    print(f"Received event with ID: {cloud_event['id']}")
    print(f"Event type: {cloud_event['type']}")
    data = cloud_event.data
    bucket_name = data["bucket"]
    file_name = data["name"]
    print(f"Processing file: {file_name} from bucket: {bucket_name}.")

    if cloud_event['type'] == "google.cloud.storage.object.v1.finalized":

        # Download the file
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)

        # Download the file to a temporary location in the Cloud Function's runtime environment
        # The /tmp directory is an in-memory file system.
        file_path = f"/tmp/{file_name}"
        blob.download_to_filename(file_path)

        #Delete exisiting file from RAG
        delete_files_from_rag(file_name)

        print(f"File {file_name} downloaded to {file_path}.")
        if os.path.isfile(file_path):
            if file_name.lower().endswith(".pdf"):
                print(f"--- Processing PDF: {file_name} ---")
                process_pdf(file_path)
            elif file_name.lower().endswith(".png") or file_name.lower().endswith(".jpg") or file_name.lower().endswith(".jpeg") or file_name.lower().endswith(".webp"):
                print(f"--- Processing Images: {file_name} ---")
                process_image(file_path, file_name)
            elif file_name.lower().endswith((".mp3", ".m4a", ".aac", ".flac", ".wav", ".opus", ".mpga", ".mp4", ".pcm", ".webm")):
                print(f"--- Processing MP3: {file_name} ---")
                process_media(file_path, "audio")
            elif file_name.lower().endswith((".mp4", ".mov", ".qt", ".flv", ".mpeg", ".mpg", ".webm", ".wmv", ".3gp")):
                print(f"--- Processing MP4: {file_name} ---")
                process_media(file_path, "video")
            else:
                print(f"--- Skipping unsupported file: {file_name} ---")
    elif cloud_event['type'] == "google.cloud.storage.object.v1.deleted":
        delete_files_from_rag(file_name)
    else:
        print(f"Unknown event type: {cloud_event['type']}")
  # --- End of your processing logic ---