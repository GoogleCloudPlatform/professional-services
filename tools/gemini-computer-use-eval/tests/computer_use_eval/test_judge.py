# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import pytest
from unittest.mock import MagicMock, AsyncMock
from computer_use_eval.evaluation.judge import AssertionJudge, LLMLogJudge
from computer_use_eval.browser.playwright_env import PlaywrightEnv


@pytest.fixture
def mock_env():
    env = MagicMock(spec=PlaywrightEnv)
    env.page = MagicMock()
    # Mock locator for DOM assertions
    env.page.locator = MagicMock()
    return env


@pytest.fixture
def mock_client():
    client = MagicMock()
    client.models = MagicMock()
    return client


describe_assertion_judge = "AssertionJudge"


class TestAssertionJudge:
    @pytest.mark.asyncio
    async def test_evaluate_empty_criteria(self, mock_env):
        """Should return 0.0 score when no assertions are provided."""
        judge = AssertionJudge()
        criteria = {"assertions": []}

        result = await judge.evaluate(mock_env, criteria)

        assert result["score"] == 0.0
        assert "No assertions defined" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_evaluate_url_assertion_success(self, mock_env):
        """Should score 1.0 when URL matches."""
        judge = AssertionJudge()
        mock_env.page.url = "https://google.com"
        criteria = {
            "assertions": [
                {"type": "url", "condition": "equals", "value": "https://google.com"}
            ]
        }

        result = await judge.evaluate(mock_env, criteria)
        assert result["score"] == 1.0
        assert "[PASS]" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_evaluate_dom_assertion_success(self, mock_env):
        """Should score 1.0 when DOM element exists."""
        judge = AssertionJudge()
        mock_locator = MagicMock()
        mock_locator.count = AsyncMock(return_value=1)
        mock_env.page.locator.return_value = mock_locator

        criteria = {
            "assertions": [
                {"type": "dom", "selector": "#success-btn", "condition": "exists"}
            ]
        }

        result = await judge.evaluate(mock_env, criteria)
        assert result["score"] == 1.0
        assert "Element '#success-btn' found" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_evaluate_script_assertion_fail(self, mock_env):
        """Should score 0.0 when Script returns False."""
        judge = AssertionJudge()
        mock_env.get_js_state = AsyncMock(return_value=False)
        criteria = {"assertions": [{"type": "script", "code": "return false;"}]}

        result = await judge.evaluate(mock_env, criteria)
        assert result["score"] == 0.0
        assert "Script returned False" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_extensibility_custom_handler(self, mock_env):
        """Verify we can register and use a custom assertion handler."""
        judge = AssertionJudge()

        async def mock_custom_handler(env, assertion):
            return True, "Custom PASS"

        AssertionJudge.register_handler("custom_test", mock_custom_handler)

        criteria = {"assertions": [{"type": "custom_test", "key": "val"}]}

        result = await judge.evaluate(mock_env, criteria)
        assert result["score"] == 1.0
        assert "Custom PASS" in result["reasoning"]


describe_llm_log_judge = "LLMLogJudge"


class TestLLMLogJudge:
    @pytest.mark.asyncio
    async def test_evaluate_no_history(self, mock_client, mock_env):
        """Should return default structure if no history is provided."""
        judge = LLMLogJudge(mock_client)
        result = await judge.evaluate(mock_env, criteria={}, history=[])

        assert "fail_why" in result
        assert "No history provided" in result["fail_why"]

    @pytest.mark.asyncio
    async def test_evaluate_success_parsing(self, mock_client, mock_env):
        """Should correctly parse valid JSON response from LLM."""
        judge = LLMLogJudge(mock_client)

        # Mock successful LLM response
        mock_response = MagicMock()
        mock_response.parsed = None
        mock_response.text = '{"summary": "Did good", "fail_why": "None", "errors": [], "fix_prompt": "None"}'
        mock_client.models.generate_content.return_value = mock_response

        # Create minimal history mock
        turn = MagicMock()
        turn.role = "user"
        part = MagicMock()
        part.text = "Click the button"
        turn.parts = [part]

        result = await judge.evaluate(
            mock_env,
            criteria={},
            history=[turn],
            metadata={"termination_reason": "success"},
        )

        assert result["summary"] == "Did good"
        assert result["fail_why"] == "None"
        assert result["fix_prompt"] == "None"

    @pytest.mark.asyncio
    async def test_evaluate_llm_exception(self, mock_client, mock_env):
        """Should handle exceptions during LLM call gracefully."""
        judge = LLMLogJudge(mock_client)

        # Mock exception
        mock_client.models.generate_content.side_effect = Exception("API Error")

        turn = MagicMock()
        turn.role = "user"
        turn.parts = []

        result = await judge.evaluate(mock_env, criteria={}, history=[turn])

        assert "error" in result
        assert "LLM Judge failed: API Error" in result["error"]

    @pytest.mark.asyncio
    async def test_evaluate_history_formatting(self, mock_client, mock_env):
        """Should correctly format various history part types into trace text."""
        judge = LLMLogJudge(mock_client)

        mock_response = MagicMock()
        mock_response.parsed = {}
        mock_response.text = "{}"
        mock_client.models.generate_content.return_value = mock_response

        # Setup complex history
        turn1 = MagicMock()
        turn1.role = "user"
        part1 = MagicMock()
        part1.text = "Hello"
        # unset other attributes to avoid attribute error if checking hasattr
        part1.function_call = None
        part1.function_response = None
        turn1.parts = [part1]

        turn2 = MagicMock()
        turn2.role = "model"
        part2 = MagicMock()
        part2.text = None
        part2.function_call.name = "click_at"
        part2.function_call.args = {"x": 10, "y": 10}
        part2.function_response = None
        turn2.parts = [part2]

        await judge.evaluate(mock_env, criteria={}, history=[turn1, turn2])

        # Verify the prompt sent to LLM contains the formatted trace
        call_args = mock_client.models.generate_content.call_args
        prompt_sent = call_args.kwargs["contents"]

        assert "Turn 1 (user): Hello" in prompt_sent
        assert (
            "Turn 2 (model): [Tool Call: click_at({'x': 10, 'y': 10})]" in prompt_sent
        )
