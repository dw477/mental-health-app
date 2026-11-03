# Project instructions

This is a localhost coursework prototype. Use fictional scenarios for every test, browser observation and demonstration. Keep exercise steps fixed at a 4-second inhale and a 6-second exhale for six cycles. Keep Stop and the independent Crisis resources route available during the exercise and model failures.

The FastAPI application serves the local Vue assets. Keep SQLite writes idempotent and preserve terminal session states on retries. Model calls are optional. Keep secrets in the ignored `.env` file, and never include secrets, private dashboard content or real personal data in logs, screenshots, tests or reports.

Use mocked replies for routine checks. Record live-model observations separately. Run Python tests with `.venv/Scripts/python.exe -m unittest discover -s tests -v` and timing checks with `node --test tests/exercise.test.mjs` when changing the affected behavior. Saved-answer behavior is checked with `node --test tests/saved-answer.test.mjs`. Part 3 adds only the optional latest-successful-answer shortcut and evaluation/documentation; do not add questionnaire, profiles, distress scoring or adjustable exercise timing. The live observation script is opt-in, makes four calls and must never run as a routine check.
