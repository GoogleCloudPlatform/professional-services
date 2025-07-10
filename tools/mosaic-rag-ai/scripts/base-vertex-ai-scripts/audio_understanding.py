from dotenv import load_dotenv

load_dotenv()

import os

print(os.getenv("GEMINI_API_KEY"))
API_KEY=os.getenv("GEMINI_API_KEY")

from google import genai

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=API_KEY)

from google.genai import types

with open('owl.mp3', 'rb') as f:
    audio_bytes = f.read()

response = client.models.generate_content(
  model='gemini-2.5-flash',
  contents=[
    'Describe this audio clip and explain the content',
    types.Part.from_bytes(
      data=audio_bytes,
      mime_type='audio/mp3',
    )
  ]
)

print(response.text)