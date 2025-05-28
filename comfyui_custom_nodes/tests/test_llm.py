# Copyright 2025 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to
# your agreement with Google.
"""Sample Unit Tests"""
import unittest
from unittest.mock import MagicMock, patch

from vertexai.generative_models import GenerationResponse, GenerativeModel

from demo.llm import classify_news_topic


class TestLLM(unittest.TestCase):
    """Testing llm"""

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    @patch.object(GenerativeModel, "generate_content")
    def test_normal_query(self, generate_content) -> None:
        """Test normal query.
        Args:
            generate_content: mock for GenerativeModel.generate_content()
        """
        mock_response = MagicMock(GenerationResponse)
        mock_response.text = """
        ```json
            {"topic": "technology"}
        ```
        """
        generate_content.return_value = mock_response

        response = classify_news_topic("Pixel 8 Pro hands-on review is here!")
        self.assertEqual(response, "technology")

    @patch.object(GenerativeModel, "generate_content")
    def test_non_json_response(self, generate_content) -> None:
        """Test invalid JSON payload returned from model response.
        Args:
            generate_content: mock for GenerativeModel.generate_content()
        """
        mock_response = MagicMock(GenerationResponse)
        mock_response.text = """
        ```json
            some invalid json message
        ```
        """
        generate_content.return_value = mock_response

        response = classify_news_topic("Pixel 8 Pro hands-on review is here!")
        self.assertEqual(response, "Sorry, I cannot understand your query.")

    @patch.object(GenerativeModel, "generate_content")
    def test_incorrect_json_key(self, generate_content) -> None:
        """Test incorrect json key returned from model response.
        Args:
            generate_content: mock for GenerativeModel.generate_content()
        """
        mock_response = MagicMock(GenerationResponse)
        mock_response.text = """
        ```json
            {"news_topic": "technology"}
        ```
        """
        generate_content.return_value = mock_response

        response = classify_news_topic("Pixel 8 Pro hands-on review is here!")
        self.assertEqual(response, "Sorry, I cannot understand your query.")

    @patch.object(GenerativeModel, "generate_content")
    def test_unsupported_topic(self, generate_content) -> None:
        """Test unsupported topic returned from model response.
        Args:
            generate_content: mock for GenerativeModel.generate_content()
        """
        mock_response = MagicMock(GenerationResponse)
        mock_response.text = """
        ```json
            {"topic": "finance"}
        ```
        """
        generate_content.return_value = mock_response

        response = classify_news_topic("Pixel 8 Pro hands-on review is here!")
        self.assertEqual(response, "Sorry, the topic finance is not supported")

    @patch.object(GenerativeModel, "generate_content")
    def test_exception(self, generate_content) -> None:
        """Test exception thrown by the model.
        Args:
            generate_content: mock for GenerativeModel.generate_content()
        """
        generate_content.return_value = Exception

        response = classify_news_topic("Some dummy query")
        self.assertEqual(response, "Sorry, I cannot understand your query.")