# Copyright 2026 Google LLC
#
# This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

from unittest.mock import patch
from computer_use_eval.safety import (
    InteractiveSafetyPolicy,
    AutoApproveSafetyPolicy,
    AutoDenySafetyPolicy,
)


class TestSafetyPolicies:
    """Tests for the SafetyPolicy implementations."""

    # --- InteractiveSafetyPolicy Tests ---

    @patch("builtins.input", return_value="y")
    @patch("builtins.print")
    def test_interactive_policy_accept_y(self, mock_print, mock_input):
        """Should return CONTINUE when user inputs 'y'."""
        policy = InteractiveSafetyPolicy()
        decision = {"explanation": "Risky action"}

        result = policy.confirm_action(decision)

        assert result == "CONTINUE"
        mock_input.assert_called_once()
        # Verify warning was printed
        assert mock_print.call_count >= 1

    @patch("builtins.input", return_value="YES")
    @patch("builtins.print")
    def test_interactive_policy_accept_yes_case_insensitive(
            self, mock_print, mock_input):
        """Should return CONTINUE when user inputs 'YES'."""
        policy = InteractiveSafetyPolicy()
        decision = {"explanation": "Risky action"}

        result = policy.confirm_action(decision)

        assert result == "CONTINUE"

    @patch("builtins.input", return_value="n")
    @patch("builtins.print")
    def test_interactive_policy_deny_n(self, mock_print, mock_input):
        """Should return TERMINATE when user inputs 'n'."""
        policy = InteractiveSafetyPolicy()
        decision = {"explanation": "Risky action"}

        result = policy.confirm_action(decision)

        assert result == "TERMINATE"

    @patch("builtins.input", side_effect=["invalid", "y"])
    @patch("builtins.print")
    def test_interactive_policy_retry_loop(self, mock_print, mock_input):
        """Should loop until valid input is received."""
        policy = InteractiveSafetyPolicy()
        decision = {"explanation": "Risky action"}

        result = policy.confirm_action(decision)

        assert result == "CONTINUE"
        assert mock_input.call_count == 2

    # --- AutoApproveSafetyPolicy Tests ---

    def test_auto_approve_policy(self):
        """Should always return CONTINUE and log warning."""
        policy = AutoApproveSafetyPolicy()
        decision = {"explanation": "Risky action"}

        with patch.object(policy.logger, "warning") as mock_log:
            result = policy.confirm_action(decision)

            assert result == "CONTINUE"
            mock_log.assert_called_once()
            assert "Auto-approving" in mock_log.call_args[0][0]

    # --- AutoDenySafetyPolicy Tests ---

    def test_auto_deny_policy(self):
        """Should always return TERMINATE and log warning."""
        policy = AutoDenySafetyPolicy()
        decision = {"explanation": "Risky action"}

        with patch.object(policy.logger, "warning") as mock_log:
            result = policy.confirm_action(decision)

            assert result == "TERMINATE"
            mock_log.assert_called_once()
            assert "Auto-denying" in mock_log.call_args[0][0]
