"""Unit tests for Option 1: Multi-Turn 3-Stage AutoRater Algorithm (RFC 527 Workstream 1)."""

import unittest
from unittest import mock

from agent_eval.core.metric_factory import build_metric
from agent_eval.core.multiturn_judge import (
    ExtractedIntent,
    GeneratedRubric,
    MultiTurnScoreResult,
    MultiTurnTrajectoryJudge,
)
from agent_eval.core.schema import AgentData, AgentTurn


class TestMultiTurnTrajectoryJudge(unittest.TestCase):
    """Verify 3-stage Intents Extraction -> Rubric Generation -> Trajectory Scoring."""

    def test_single_turn_graceful_degradation(self):
        """Single-turn traces should bypass Stage 1 & 2 to save tokens."""
        judge = MultiTurnTrajectoryJudge(metric_name="ambiguity_handling")
        single_turn_trace = AgentData(
            session_id="s1",
            turns=[AgentTurn(turn_index=0, role="user", content="hello", events=[])],
            events=[],
        )

        result = judge.evaluate(single_turn_trace)
        self.assertIsInstance(result, MultiTurnScoreResult)
        self.assertEqual(result.score, 1.0)
        self.assertIn("graceful degradation", result.explanation.lower())

    def test_multi_turn_three_stage_pipeline_default_fallback(self):
        """Without model_client, evaluate should execute 3 stages using default fallbacks."""
        judge = MultiTurnTrajectoryJudge(metric_name="ambiguity_handling")
        multi_turn_trace = AgentData(
            session_id="s2",
            turns=[
                AgentTurn(
                    turn_index=0,
                    role="user",
                    content="Analyze sales data for 2025",
                    events=[],
                ),
                AgentTurn(
                    turn_index=1,
                    role="model",
                    content="Could you clarify which market segment?",
                    events=[],
                ),
                AgentTurn(turn_index=2, role="user", content="US market", events=[]),
            ],
            events=[],
        )

        result = judge.evaluate(multi_turn_trace)
        self.assertIsInstance(result, MultiTurnScoreResult)
        self.assertEqual(result.score, 1.0)
        self.assertEqual(len(result.intents_extracted), 1)
        self.assertEqual(result.intents_extracted[0].status, "ACTIVE")

    def test_multi_turn_with_mock_client_structured_output(self):
        """Verify Stage 1, Stage 2, and Stage 3 structured schema calls on model_client."""
        mock_client = mock.MagicMock()

        # Define 3 sequential structured responses for generate_structured
        mock_intents = [
            ExtractedIntent(
                intent_id="intent_1",
                description="User wants 2025 sales data",
                status="ACTIVE",
                origin_turn=0,
            )
        ]
        mock_rubrics = [
            GeneratedRubric(
                intent_id="intent_1",
                criterion="Verify agent clarifies ambiguous region before tool call",
                passing_condition="Agent asks clarifying question on Turn 1",
                failing_condition="Agent immediately runs tool without clarifying",
            )
        ]
        mock_score = MultiTurnScoreResult(
            score=0.95,
            intents_extracted=mock_intents,
            rubrics_evaluated=[mock_rubrics[0].model_dump()],
            explanation="Agent properly halted on Turn 1 to ask clarifying question.",
        )

        mock_client.generate_structured.side_effect = [
            mock_intents,
            mock_rubrics,
            mock_score,
        ]

        judge = MultiTurnTrajectoryJudge(
            metric_name="ambiguity_handling", model_client=mock_client
        )
        multi_turn_trace = AgentData(
            session_id="s3",
            turns=[
                AgentTurn(
                    turn_index=0,
                    role="user",
                    content="Analyze sales data for 2025",
                    events=[],
                ),
                AgentTurn(
                    turn_index=1, role="model", content="Clarify market?", events=[]
                ),
            ],
            events=[],
        )

        result = judge.evaluate(multi_turn_trace)
        self.assertEqual(result.score, 0.95)
        self.assertEqual(mock_client.generate_structured.call_count, 3)
        self.assertIn("halted on Turn 1", result.explanation)

    def test_factory_instantiates_multiturn_judge(self):
        """Verify metric_factory build_metric instantiates MultiTurnTrajectoryJudge."""
        spec = {
            "kind": "multiturn_trajectory_judge",
            "threshold": 0.85,
            "description": "Multi-turn ambiguity handling judge.",
        }
        judge = build_metric("ambiguity_handling", spec)
        self.assertIsInstance(judge, MultiTurnTrajectoryJudge)
        self.assertEqual(judge.metric_name, "ambiguity_handling")
        self.assertEqual(judge.threshold, 0.85)


if __name__ == "__main__":
    unittest.main()
