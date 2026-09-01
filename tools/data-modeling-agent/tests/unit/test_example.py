from agents.data_modelling_agent import agent


def test_load_agent() -> None:
    """Test that the agent can be successfully loaded."""

    _ = agent.load_agent()
