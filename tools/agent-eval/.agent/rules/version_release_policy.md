# Version & Release Validation Policy

## Objective
Ensure all updates and pull requests for `agent-eval` strictly follow versioning best practices, prevent regressions, and validate remote versions before publishing.

## Guidelines
1. **Remote Version Check**: Always fetch and inspect remote upstream tags (`git fetch --tags origin`) and remote branches before cutting a release or preparing a PR.
2. **Semantic Versioning (SemVer)**:
   - **Patch (`0.x.Y`)**: Bug fixes, documentation updates, and error handling improvements with no new CLI flags or schema additions.
   - **Minor (`0.X.0`)**: Backwards-compatible features, such as new trace converters (e.g., OpenInference), metric rendering enhancements, or new dataset capabilities.
   - **Major (`X.0.0`)**: Breaking architectural changes or deprecated API removals.
3. **Pre-Release Verification**:
   - Run the full unit & integration test suite (`uv run pytest tests/`).
   - Run linters (`ruff check src/ tests/`) and strict string checks (`tools/check_no_path_ab.sh`).
   - Run an end-to-end trace evaluation smoke test on a real agent.
