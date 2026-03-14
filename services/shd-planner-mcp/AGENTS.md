# Repository Guidelines

## Project Structure & Module Organization
Core runtime code is at the repo root and in `tools/`.
- `server.py`: FastMCP entry point exposing Division 2 tools.
- `tools/`: feature modules (`lookup.py`, `build_analyzer.py`, `synergy_engine.py`, `stat_calculator.py`, `data_loader.py`).
- `data/`: JSON knowledge base (gear, talents, weapons, skills, stats, synergies).
- `tests/`: pytest suite (`test_*.py`) mapped to tool modules.
- `skill/`, `pattern/`, `nate_framework/`: assistant behavior assets and framework docs.
- `patch_notes/`: update tracking and patch workflow.

## Build, Test, and Development Commands
Use `uv` with Python 3.12.
- `uv sync`: install runtime + dev dependencies.
- `uv run shd-planner-cwd`: run the MCP server via script entrypoint.
- `uv run python server.py`: run server directly over stdio.
- `uv run pytest tests/ -v`: run full test suite.
- `uv run pytest tests/test_lookup.py::test_lookup_gear_by_name -v`: run one targeted test.
- `uv run ruff check .`: lint.
- `uv run ruff format --check .`: formatting check.

## Coding Style & Naming Conventions
- Follow Ruff settings in `pyproject.toml` (`line-length = 120`, target `py312`).
- Use 4-space indentation and type-aware, readable Python.
- File/module names: `snake_case.py`; functions/variables: `snake_case`; classes: `PascalCase`.
- Keep data access centralized in `tools/data_loader.py`; avoid ad-hoc JSON reads elsewhere.

## Testing Guidelines
- Framework: `pytest` (`testpaths = ["tests"]`).
- Name files `test_<module>.py`; name tests `test_<behavior>()`.
- Add/adjust tests with every behavior change, especially lookup accuracy, stat caps, and synergy scoring.
- Run full suite before opening a PR: `uv run pytest tests/ -v`.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit style: `feat: ...`, `fix: ...`, `docs: ...`.
- Keep subject lines imperative and specific (example: `fix: correct named item stat mapping`).
- Group related code + data changes in one commit.
- PRs should include: purpose, affected modules/files, test evidence (commands run), and linked issue(s) when applicable.
- Include sample input/output when changing tool behavior or exported data.

## Security & Configuration Tips
- Never commit OAuth credentials; `export_to_sheets.py` expects local creds in `~/.config/gspread/`.
- Treat `data/*.json` edits as production knowledge changes; validate with tests after updates.
