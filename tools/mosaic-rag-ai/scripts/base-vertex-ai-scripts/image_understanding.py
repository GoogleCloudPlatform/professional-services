from dotenv import load_dotenv

load_dotenv()

import os

print(os.getenv("GEMINI_API_KEY"))
API_KEY=os.getenv("GEMINI_API_KEY")

from google import genai

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=API_KEY)

from google.genai import types

with open('finance.png', 'rb') as f:
    image_bytes = f.read()

response = client.models.generate_content(
model='gemini-2.5-flash',
contents=[
    types.Part.from_bytes(
    data=image_bytes,
    mime_type='image/png',
    ),
    'explain the image in detail with facts and figures'
]
)

print(response.text)