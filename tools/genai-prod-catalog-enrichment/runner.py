import io
import os
import re
import json
import csv
import ast
import traceback
import datetime
import time
import fitz
import vertexai
from vertexai.language_models import TextGenerationModel
from google.cloud import storage
from PIL import Image
from pdf_helper import *
from genai_helper import *
from main import *
from text_helper import *


start = time.time()
project_id = "sl-test-project-353312"
end_to_end_pipeline("gs://test-sl/hepasky-herbal-liver-tablets.pdf", "test-sl", project_id)
end = time.time()
print(f"[INFO]: Pipeline runtime - {end-start} seconds")