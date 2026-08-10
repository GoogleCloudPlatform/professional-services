# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Unit tests for AgentData schema and data mapping functions."""

import pandas as pd
import pytest

from agent_eval.core.data_mapper import (
    _map_agent_data,
    _map_agent_data_to_row,
    _map_agents,
)
from agent_eval.core.schema import (
    AgentConfig,
    AgentData,
    AgentEvent,
    AgentTurn,
)


class TestAgentDataSchema:
    """Tests for Pydantic data models defining Contract C1 AgentData."""

    def test_agent_config_defaults_and_custom_fields(self):
        config = AgentConfig(
            agent_id="travel_planner",
            type="PlannerAgent",
            description="Plans travel itineraries",
            instruction="Always be polite and accurate.",
            tools=["search_flights", "book_hotel"],
            sub_agents=["flight_agent", "hotel_agent"],
        )
        assert config.agent_id == "travel_planner"
        assert config.type == "PlannerAgent"
        assert len(config.tools) == 2
        assert "flight_agent" in config.sub_agents

        dump = config.model_dump()
        assert dump["agent_id"] == "travel_planner"
        assert dump["tools"] == ["search_flights", "book_hotel"]

    def test_agent_event_rfc477_and_openinference_fields(self):
        event = AgentEvent(
            event_id="ev_001",
            author="model",
            content="I am booking your flight.",
            event_type="TOOL_CALL",
            status="OK",
            payload={
                "tool_name": "book_flight",
                "arguments": {"destination": "HND", "seat": "12A"},
                "result": {"booking_id": "BK-9988"},
            },
            tool_calls=[
                {"name": "book_flight", "args": {"destination": "HND", "seat": "12A"}}
            ],
            tool_responses=[
                {"name": "book_flight", "response": {"booking_id": "BK-9988"}}
            ],
            state_delta={"booked_flight": "BK-9988"},
        )
        assert event.author == "model"
        assert event.event_type == "TOOL_CALL"
        assert event.status == "OK"
        assert event.payload["tool_name"] == "book_flight"
        assert event.state_delta == {"booked_flight": "BK-9988"}
        assert len(event.tool_calls) == 1

    def test_agent_turn_structure(self):
        events = [
            AgentEvent(
                author="USER",
                content="Book a ticket to Paris.",
                event_type="USER_INPUT",
            ),
            AgentEvent(
                author="model",
                event_type="TOOL_CALL",
                payload={"tool_name": "search_flights", "arguments": {"to": "CDG"}},
            ),
        ]
        turn = AgentTurn(
            turn_id="turn_0",
            turn_index=0,
            role="user",
            content="Book a ticket to Paris.",
            events=events,
        )
        assert turn.turn_id == "turn_0"
        assert turn.role == "user"
        assert len(turn.events) == 2

    def test_agent_data_full_model(self):
        agent_cfg = AgentConfig(agent_id="root_agent", type="LlmAgent")
        turn0 = AgentTurn(
            turn_index=0,
            role="user",
            content="Hello!",
            events=[AgentEvent(author="USER", content="Hello!")],
        )
        turn1 = AgentTurn(
            turn_index=1,
            role="model",
            content="Hi! How can I help you today?",
            events=[AgentEvent(author="model", content="Hi! How can I help you today?")],
        )
        agent_data = AgentData(
            session_id="session_abc123",
            agents={"root_agent": agent_cfg},
            turns=[turn0, turn1],
            events=[],
        )
        dump = agent_data.model_dump()
        assert dump["session_id"] == "session_abc123"
        assert "root_agent" in dump["agents"]
        assert len(dump["turns"]) == 2


class TestDataMapperAgentDataProjection:
    """Tests for _map_agents and _map_agent_data projecting AgentData into canonical evaluation rows."""

    def test_map_single_agent_data_instance(self):
        agent_cfg = AgentConfig(agent_id="search_bot", type="SearchAgent")
        turn_user = AgentTurn(
            turn_index=0,
            role="user",
            content="What is the capital of France?",
            events=[AgentEvent(author="USER", content="What is the capital of France?")],
        )
        turn_model = AgentTurn(
            turn_index=1,
            role="model",
            content="The capital of France is Paris.",
            events=[
                AgentEvent(
                    author="model",
                    event_type="TOOL_CALL",
                    payload={
                        "tool_name": "wiki_lookup",
                        "arguments": {"query": "Capital of France"},
                        "result": "Paris",
                    },
                    state_delta={"verified": True},
                ),
                AgentEvent(
                    author="model",
                    content="The capital of France is Paris.",
                ),
            ],
        )
        agent_data = AgentData(
            session_id="eval_sess_42",
            agents={"search_bot": agent_cfg},
            turns=[turn_user, turn_model],
            events=[],
            reference_data={"expected_behavior": "Should state Paris"},
        )

        row = _map_agent_data_to_row(agent_data)
        assert row["session_id"] == "eval_sess_42"
        assert row["prompt"] == "What is the capital of France?"
        assert row["response"] == "The capital of France is Paris."
        assert row["final_response"] == "The capital of France is Paris."
        assert row["user_inputs"] == ["What is the capital of France?"]
        assert row["agents_evaluated"] == ["search_bot"]
        assert row["final_session_state"] == {"verified": True}
        assert row["reference_data"] == {"expected_behavior": "Should state Paris"}

        # Tool interactions verification
        tool_interactions = row["extracted_data"]["tool_interactions"]
        assert len(tool_interactions) == 1
        assert tool_interactions[0]["tool_name"] == "wiki_lookup"
        assert tool_interactions[0]["input_arguments"] == {"query": "Capital of France"}
        assert tool_interactions[0]["output_result"] == "Paris"
        assert tool_interactions[0]["arguments"] == {"query": "Capital of France"}
        assert tool_interactions[0]["result"] == "Paris"

        # Flattened key for pandas dataframe compatibility
        assert row["extracted_data.tool_interactions"] == tool_interactions

    def test_map_agent_data_with_rfc477_tool_calls(self):
        turn = AgentTurn(
            turn_index=0,
            role="model",
            content="Checking weather...",
            events=[
                AgentEvent(
                    author="model",
                    tool_calls=[{"name": "get_weather", "args": {"city": "Seattle"}}],
                    tool_responses=[{"name": "get_weather", "response": {"temp": "18C", "rain": True}}],
                )
            ],
        )
        agent_data = AgentData(
            session_id="weather_sess",
            turns=[turn],
            events=[],
            user_inputs=["What is the weather in Seattle?"],
        )

        row = _map_agent_data_to_row(agent_data)
        assert row["prompt"] == "What is the weather in Seattle?"
        assert len(row["extracted_data"]["tool_interactions"]) == 1
        ti = row["extracted_data"]["tool_interactions"][0]
        assert ti["tool_name"] == "get_weather"
        assert ti["input_arguments"] == {"city": "Seattle"}
        assert ti["output_result"] == {"temp": "18C", "rain": True}

    def test_map_agents_with_list_and_dataframe(self):
        ad1 = AgentData(
            session_id="s1",
            turns=[
                AgentTurn(role="user", content="Q1"),
                AgentTurn(role="model", content="A1"),
            ],
        )
        ad2 = AgentData(
            session_id="s2",
            turns=[
                AgentTurn(role="user", content="Q2"),
                AgentTurn(role="model", content="A2"),
            ],
        )

        # Test list of AgentData
        mapped_list = _map_agents([ad1, ad2])
        assert isinstance(mapped_list, list)
        assert len(mapped_list) == 2
        assert mapped_list[0]["session_id"] == "s1"
        assert mapped_list[0]["prompt"] == "Q1"
        assert mapped_list[0]["response"] == "A1"
        assert mapped_list[1]["session_id"] == "s2"
        assert mapped_list[1]["prompt"] == "Q2"
        assert mapped_list[1]["response"] == "A2"

        # Test _map_agent_data with single item and list
        single_res = _map_agent_data(ad1)
        assert isinstance(single_res, dict)
        assert single_res["session_id"] == "s1"

        list_res = _map_agent_data([ad1, ad2])
        assert isinstance(list_res, list)
        assert len(list_res) == 2

        # Test with pandas DataFrame
        df_input = pd.DataFrame([ad1.model_dump(), ad2.model_dump()])
        mapped_df = _map_agents(df_input)
        assert isinstance(mapped_df, pd.DataFrame)
        assert len(mapped_df) == 2
        assert "prompt" in mapped_df.columns
        assert "response" in mapped_df.columns
        assert mapped_df.iloc[0]["prompt"] == "Q1"
        assert mapped_df.iloc[1]["response"] == "A2"

    def test_map_agent_data_raw_dictionary(self):
        raw_dict = {
            "session_id": "dict_session_100",
            "turns": [
                {
                    "role": "user",
                    "content": "Tell me a joke",
                    "events": [{"author": "USER", "content": "Tell me a joke"}],
                },
                {
                    "role": "model",
                    "content": "Why did the chicken cross the road?",
                    "events": [
                        {
                            "author": "model",
                            "event_type": "TOOL_CALL",
                            "payload": {
                                "tool_name": "joke_db",
                                "arguments": {"tag": "poultry"},
                                "result": "cross the road",
                            },
                        }
                    ],
                },
            ],
            "final_session_state": {"jokes_told": 1},
            "reference_data": {"expected_topic": "humor"},
        }
        row = _map_agent_data_to_row(raw_dict)
        assert row["session_id"] == "dict_session_100"
        assert row["prompt"] == "Tell me a joke"
        assert row["response"] == "Why did the chicken cross the road?"
        assert row["final_session_state"] == {"jokes_told": 1}
        assert len(row["extracted_data"]["tool_interactions"]) == 1
        assert row["extracted_data"]["tool_interactions"][0]["tool_name"] == "joke_db"
