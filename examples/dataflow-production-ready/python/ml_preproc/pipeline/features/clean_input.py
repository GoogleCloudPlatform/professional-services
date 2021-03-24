#  Copyright 2020 Google LLC.
#  This software is provided as-is, without warranty or representation for any use or purpose.
#  Your use of it is subject to your agreement with Google.

def clean_text(text: str, abbrevs: dict = None) -> str:
  text = _preprocess_text(text)

  if abbrevs:
    text = _map_abbreviations(text, abbrevs)

  return text


def _preprocess_text(text: str) -> str:
  """ Trim and lowercase

  Args:
    text: The input text to be transformed.

  Returns:
    A cleaned string.
  """
  return text.lower().strip()


def _map_abbreviations(text: str, abbrevs: dict) -> str:
  """Maps the abbreviations using the abbrevs side input."""
  output = []
  space = " "

  for word in text.split(space):
    if word in abbrevs:
      output.append(abbrevs[word])
    else:
      output.append(word)

  return space.join(output)