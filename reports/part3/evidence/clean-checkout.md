# Clean-checkout verification

November 2, 2026, Windows, Python 3.10.6. Source commit: `4b0986e41df49a68c2e94ec5fd7be69907e2e7c7`. Application source is unchanged in the later evidence and report commits.

A separate local `git clone --no-hardlinks --branch codex/part3-minimum` was created under ignored `work/clean-checkout`, followed by a new `.venv`. No `.env`, existing database or original virtual environment was copied. This verifies a fresh working tree and dependency environment from Git, not a second person's machine.

README sequence followed:

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
$env:MODEL_MODE = 'mock'
./.venv/Scripts/python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8015 --no-access-log
```

Port 8015 replaced the documented 8000 to isolate this check. Requirements installed successfully from the pinned file. `pip check` returned “No broken requirements found.” No key was needed. The page loaded in Chrome, an empty database had no shortcut, a fictional Sam question produced a labeled mock success, and the newly saved answer could be reopened. [Browser proof](clean-checkout.jpg), [DOM observations](browser-observations.txt).

Nine Python tests and eight Node tests passed in that new environment. [Python log](clean-python-tests.txt), [Node log](clean-node-tests.txt). A Starlette/httpx deprecation advisory was emitted; it did not fail the checks. `git status --short` in the clone was empty after verification because the new database and virtual environment are ignored.

This verifies local mock-mode setup. It does not claim a fresh-key live setup on another computer. Live integration is documented separately in [live-model.json](live-model.json).
