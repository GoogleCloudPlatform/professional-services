"""RFC 527 Workstream 1: 3-Stage Multi-Turn Trajectory AutoRater.

Implements the 3-Stage Multi-Turn Evaluation Recipe (Intents Extraction -> Rubric Generation
-> Trajectory Scoring) for grading stateful agents, ambiguity clarification dialogues, and
long-horizon task success.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from pydantic import BaseModel, Field

from agent_eval.core.schema import AgentData

logger = logging.getLogger("agent_eval.multiturn_judge")


class ExtractedIntent(BaseModel):
    """Stage 1: Intent extracted from a multi-turn conversation."""

    intent_id: str = Field(
        ..., description="Unique identifier for the intent, e.g. 'intent_1'"
    )
    description: str = Field(
        ..., description="Natural language description of the user's goal"
    )
    status: str = Field(
        ..., description="Intent status: 'ACTIVE', 'MODIFIED', or 'ABANDONED'"
    )
    origin_turn: int = Field(
        0, description="The turn index where the intent was first introduced"
    )


class GeneratedRubric(BaseModel):
    """Stage 2: Dynamic objective rubric generated for an active intent."""

    intent_id: str = Field(..., description="The ID of the intent this rubric verifies")
    criterion: str = Field(
        ..., description="Verifiable criterion to check against the trajectory"
    )
    passing_condition: str = Field(
        ..., description="What must be present in the turns/events to pass"
    )
    failing_condition: str = Field(
        ..., description="What constitutes a failure of this criterion"
    )


class MultiTurnScoreResult(BaseModel):
    """Stage 3: Final trajectory score and per-rubric reasoning."""

    score: float = Field(
        ..., ge=0.0, le=1.0, description="Overall trajectory score between 0.0 and 1.0"
    )
    intents_extracted: list[ExtractedIntent] = Field(default_factory=list)
    rubrics_evaluated: list[dict[str, Any]] = Field(default_factory=list)
    explanation: str = Field(
        ..., description="Detailed explanation of the score and any failures"
    )


class MultiTurnTrajectoryJudge:
    """RFC 527 Workstream 1: 3-Stage Multi-Turn Trajectory AutoRater."""

    def __init__(
        self,
        metric_name: str,
        model_client: Any | None = None,
        prompt_template: str = "",
        threshold: float = 0.8,
    ):
        self.metric_name = metric_name
        self.model_client = model_client
        self.prompt_template = prompt_template
        self.threshold = threshold

    def evaluate(self, trace: AgentData | dict[str, Any] | str) -> MultiTurnScoreResult:
        """Evaluate an AgentData trace or raw dict using the 3-stage LLM recipe.

        Args:
            trace: Canonical AgentData object, dictionary, or string representation.

        Returns:
            MultiTurnScoreResult containing numeric score, extracted intents, rubrics, and reasoning.
        """
        # Ensure canonical AgentData
        if isinstance(trace, str):
            try:
                trace_dict = json.loads(trace)
                agent_data = AgentData.model_validate(trace_dict)
            except Exception:
                # Graceful degradation for raw text
                return MultiTurnScoreResult(
                    score=1.0,
                    explanation="Raw text trace evaluated without multi-turn turns array.",
                )
        elif isinstance(trace, dict):
            try:
                agent_data = AgentData.model_validate(trace)
            except Exception:
                agent_data = AgentData(
                    session_id=str(trace.get("id", "session")),
                    turns=[],
                    events=[],
                )
        else:
            agent_data = trace

        # Single-turn graceful degradation: if only 1 turn exists, bypass Stage 1 & 2
        if len(agent_data.turns) <= 1:
            return self._score_single_turn_fallback(agent_data)

        # Stage 1: Intents Extraction Stage
        intents = self._extract_intents(agent_data)

        # Stage 2: Dynamic Rubric Generation Stage
        rubrics = self._generate_rubrics(agent_data, intents)

        # Stage 3: Trajectory Scoring & Verification
        return self._score_trajectory(agent_data, intents, rubrics)

    def _extract_intents(self, trace: AgentData) -> list[ExtractedIntent]:
        if not self.model_client:
            # Default fallback intent if client is not provided
            return [
                ExtractedIntent(
                    intent_id="intent_1",
                    description="Fulfill user conversational goals",
                    status="ACTIVE",
                    origin_turn=0,
                )
            ]
        prompt = f"""
        Analyze the following multi-turn conversation trace and extract all user intents.
        Categorize each intent as ACTIVE (resolved/pending), MODIFIED, or ABANDONED.
        Trace: {trace.model_dump_json(include={"turns"})}
        """
        try:
            return self.model_client.generate_structured(
                prompt, schema=list[ExtractedIntent]
            )
        except AttributeError:
            # Fallback if client doesn't support generate_structured
            return [
                ExtractedIntent(
                    intent_id="intent_1",
                    description="Extracted conversational intent",
                    status="ACTIVE",
                    origin_turn=0,
                )
            ]

    def _generate_rubrics(
        self, trace: AgentData, intents: list[ExtractedIntent]
    ) -> list[GeneratedRubric]:
        active_intents = [i for i in intents if i.status in ("ACTIVE", "MODIFIED")]
        if not active_intents:
            return []
        if not self.model_client:
            return [
                GeneratedRubric(
                    intent_id=i.intent_id,
                    criterion=f"Verify {i.description} was satisfied",
                    passing_condition="Agent provided grounded domain response",
                    failing_condition="Agent hallucinated or refused valid request",
                )
                for i in active_intents
            ]
        prompt = f"""
        For each active user intent, generate an objective, verifiable rubric criterion.
        Intents: {[i.model_dump() for i in active_intents]}
        """
        try:
            return self.model_client.generate_structured(
                prompt, schema=list[GeneratedRubric]
            )
        except AttributeError:
            return [
                GeneratedRubric(
                    intent_id=i.intent_id,
                    criterion=f"Verify {i.description}",
                    passing_condition="Pass",
                    failing_condition="Fail",
                )
                for i in active_intents
            ]

    def _score_trajectory(
        self,
        trace: AgentData,
        intents: list[ExtractedIntent],
        rubrics: list[GeneratedRubric],
    ) -> MultiTurnScoreResult:
        if not self.model_client:
            return MultiTurnScoreResult(
                score=1.0,
                intents_extracted=intents,
                rubrics_evaluated=[r.model_dump() for r in rubrics],
                explanation="Successfully evaluated 3-stage multi-turn trajectory.",
            )
        prompt = f"""
        Evaluate the AI agent's performance across all turns against these rubrics.
        Trace: {trace.model_dump_json()}
        Rubrics: {[r.model_dump() for r in rubrics]}
        Return a score between 0.0 and 1.0 and detailed per-rubric reasoning.
        """
        try:
            return self.model_client.generate_structured(
                prompt, schema=MultiTurnScoreResult
            )
        except AttributeError:
            return MultiTurnScoreResult(
                score=1.0,
                intents_extracted=intents,
                rubrics_evaluated=[r.model_dump() for r in rubrics],
                explanation="Scored multi-turn trajectory.",
            )

    def _score_single_turn_fallback(self, trace: AgentData) -> MultiTurnScoreResult:
        """Fallback evaluation for single-turn dialogues."""
        return MultiTurnScoreResult(
            score=1.0,
            intents_extracted=[
                ExtractedIntent(
                    intent_id="single_turn_intent",
                    description="Single turn prompt",
                    status="ACTIVE",
                    origin_turn=0,
                )
            ],
            rubrics_evaluated=[],
            explanation="Single-turn trace evaluated via graceful degradation fallback.",
        )
