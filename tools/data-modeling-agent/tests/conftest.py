import pathlib
import sys

import dotenv
import pytest

# Ensure src and src/agents are on sys.path
repo_root = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(repo_root / "src"))
sys.path.insert(0, str(repo_root / "src" / "agents"))


def pytest_configure(config: pytest.Config) -> None:
    del config  # unused

    # Load environment variables for tests
    dotEnvFilename = repo_root / ".env"
    _ = dotenv.load_dotenv(dotEnvFilename)
