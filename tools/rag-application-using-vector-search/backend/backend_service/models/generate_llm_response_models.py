from typing import Optional
from pydantic import BaseModel

class GenerateLlmResponseConfig(BaseModel):
  """Pydantic model for Generate LLM Response Config.

  Attributes:
    temperature (Optional[float]):
      Temperature controls the randomness of the model's output.
    top_p (Optional[int]):
      Top-p changes how the model selects tokens for output.
      Tokens are selected from most probable to least until the sum of 
      their probabilities equals the top-p value.
    vector_distance_threshold (Optional[double]):
      Only returns contexts with vector distance smaller than the threshold.
      Default value set to 0.5.
    llm_ranker (Optional[str]):
      The model name used for ranking. Only Gemini models are supported
      for now.
    rank_service (Optional[str]):
      The model name of the rank service. Format:
      ``semantic-ranker-512@latest``. Supported models:
      https://cloud.google.com/generative-ai-app-builder/docs/ranking#models
    model_name (str):
      Model Garden model resource name.
      Alternatively, a tuned model endpoint resource name can be provided.
    prompt (str):
      Content send to the model.
  """
  temperature: Optional[float] = 1.0
  top_p: Optional[float] = 0.95
  vector_distance_threshold: Optional[float] = 0.5
  llm_ranker: Optional[str] = None
  rank_service: Optional[str] = None
  model_name: str
  system_instruction: Optional[str] = None
  prompt: str