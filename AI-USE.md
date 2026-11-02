# AI use disclosure

Codex assisted with implementing the Vue/FastAPI/SQLite prototype, writing checks and documentation, and inspecting the local application. The implementation session used the Codex model identifier `gpt-6.1-sol`. Earlier design discussion used `gpt-6-astra`. This disclosure describes assistance in this repository rather than claiming the student independently authored the generated code.

Browser/computer tools were used to read the assignment overview and submission rubric, and to inspect and capture the local app. The hotline lookup tool supplied the locally stored US crisis-resource information. Official Vue and Gemini documentation informed the implementation. No private dashboard content or credentials are included in the submitted evidence.

The application uses the Gemini Generate Content API. The configured default is `gemini-3.1-flash-lite`; each saved conversation records its actual configured model and source. Automated checks use mocked responses, which are distinguished from live calls in the evidence.

## Curated process evidence

- The requested scope was one 60-second breathing skill, optional contextual model question, durable history, independent crisis resources and failure/early-exit evidence. [Original design](reports/part1/report.md)
- The Part 1 proposal used a 45-second default and questionnaire-based adaptation. The implemented version uses six fixed cycles for 60 seconds, avoiding questionnaire and profile requirements at entry. [Run instructions and decisions](README.md)
- Automated checks exercise delayed/retried session writes, persistence, local crisis handling, mocked Gemini responses and timeout behavior. [Python checks](tests/test_app.py), [timing checks](tests/exercise.test.mjs)
- Live integration initially failed authentication because pasted punctuation was included in the local key. Removing that punctuation resolved authentication. The first configured model was unavailable to new users, and the API's suggested replacement timed out. A supported `gemini-3.1-flash-lite` request succeeded, so that model became the configurable default. The UI preserved the failures as failed conversation records and retained crisis access throughout. Credentials are omitted from this log.
- Browser observations, live-model results and a failed or revised approach are recorded in [Part 2 evidence](reports/part2/report.md). All demonstration inputs are fictional. These observations establish software behavior only.