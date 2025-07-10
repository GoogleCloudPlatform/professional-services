import os
import fitz
from vertexai import rag
from dotenv import load_dotenv
from google import genai
import time
from fpdf import FPDF

import os

load_dotenv()
API_KEY=os.getenv("GEMINI_API_KEY")

LOCAL_FOLDER_PATH = "./"
LOCAL_IMAGE_FOLDER_PATH = "./images"
LOCAL_IMAGE_PDF_FOLDER_PATH = "./images-pdf"
LOCAL_MEDIA_PDF_FOLDER_PATH = "./media-pdf"
IMAGE_PATH = "./images"
PROJECT_ID = "agents-stg"
REGION="us-central1"
CORPUS_ID = "projects/agents-stg/locations/us-central1/ragCorpora/7991637538768945152"
# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=API_KEY)

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
        corpus_name=CORPUS_ID,
        path=file_path,
        display_name=filename,
        description='pdf file',
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
            model="gemini-2.5-flash",
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

def process_media(file_path, media_type):
    """Uses Gemini API for audio/video understanding and uploads the response as a PDF."""
    try:
        if media_type == "audio":
            gemini_file = upload_gemini_file(file_path)
            response = client.models.generate_content(
                    model="gemini-2.5-flash", contents=["Describe this audio clip", gemini_file]
                )
        elif media_type ==  "video":
            gemini_file = upload_gemini_file(file_path)
            response = client.models.generate_content(
                    model="gemini-2.5-flash", contents=["Describe the video", gemini_file]
                )
            
        if response.text:
            media_filename = os.path.basename(file_path)
            uploaded_media_pdf_path = create_pdf_from_text(response.text, LOCAL_MEDIA_PDF_FOLDER_PATH, media_filename)
            upload_to_vertex_rag(uploaded_media_pdf_path)
            os.remove(uploaded_media_pdf_path)

    except Exception as e:
        print(f"Error processing {media_type} file {file_path}: {e}")

def main():
    """Main function to iterate through the local folder and process files."""
    for filename in os.listdir(LOCAL_FOLDER_PATH+"/data"):
        file_path = os.path.join(LOCAL_FOLDER_PATH+"/data", filename)
        if os.path.isfile(file_path):
            if filename.lower().endswith(".pdf"):
                print(f"--- Processing PDF: {filename} ---")
                process_pdf(file_path)
            elif filename.lower().endswith(".mp3"):
                print(f"--- Processing MP3: {filename} ---")
                process_media(file_path, "audio")
            elif filename.lower().endswith(".mp4"):
                print(f"--- Processing MP4: {filename} ---")
                process_media(file_path, "video")
            else:
                print(f"--- Skipping unsupported file: {filename} ---")

if __name__ == "__main__":
    main()