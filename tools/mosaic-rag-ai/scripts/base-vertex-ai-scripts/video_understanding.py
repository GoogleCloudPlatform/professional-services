from dotenv import load_dotenv
from google.genai import types
import time

load_dotenv()

import os

def upload_video(video_file_name):
  video_file = client.files.upload(file=video_file_name)

  while video_file.state == "PROCESSING":
      print('Waiting for video to be processed.')
      time.sleep(10)
      video_file = client.files.get(name=video_file.name)

  if video_file.state == "FAILED":
    raise ValueError(video_file.state)
  print(f'Video processing complete: ' + video_file.uri)

  return video_file
print(os.getenv("GEMINI_API_KEY"))
API_KEY=os.getenv("GEMINI_API_KEY")

from google import genai

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=API_KEY)

myfile = upload_video('video.mp4')

response = client.models.generate_content(
    model="gemini-2.0-flash", contents=[myfile, "Summarize this video."]
)

print(response.text)

