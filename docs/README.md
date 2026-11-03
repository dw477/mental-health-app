# A moment to breathe

A localhost coursework prototype for Assignment 3, Part 3. Vue 3 provides a single paced-breathing exercise, FastAPI serves the interface and API, and SQLite stores exercise sessions and fictional questions. Use fictional scenarios only. This prototype provides no diagnosis, therapy, crisis care, monitoring, or claim of clinical benefit.

## Run on Windows

Requires Python 3.10 or newer. From the repository root in PowerShell, run the following commands.

```powershell
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt
```

For a clean checkout without a key, run the following and open [the app](http://127.0.0.1:8000). Mock answers are labeled and no model service is called.

```powershell
$env:MODEL_MODE = 'mock'
./.venv/Scripts/python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

For live replies, copy `.env.example` to `.env` if `.env` does not already exist, then edit it locally and enter your Gemini key. `.env` and the database are excluded from Git. The server also accepts the process environment variable `GEMINI_API_KEY`, or `GOOGLE_API_KEY` as a fallback. `GEMINI_API_KEY` takes precedence in this app.

```dotenv
GEMINI_API_KEY=your-key-here
GEMINI_MODEL=gemini-3.1-flash-lite
MODEL_MODE=live
```

Stop the mock server with Ctrl+C and remove the process override before starting live mode. Then open [the app](http://127.0.0.1:8000).

```powershell
Remove-Item Env:MODEL_MODE -ErrorAction SilentlyContinue
./.venv/Scripts/python.exe -m uvicorn backend.app:app --host 127.0.0.1 --port 8000
```

Restart the server after editing `.env`. No frontend build or Node installation is needed to run the app. Vue 3.5.22 is included locally, so the interface and crisis information have no CDN dependency. Internet access and a valid Gemini key are needed only for live model replies. Keep the server bound to localhost.

For predictable demonstrations without paid calls, use `MODEL_MODE=mock`. Replies and history identify their source as mock. `MODEL_MODE=fail` produces a deliberate request failure. Set the mode in `.env` and restart, or set the process environment variable before launching the server. These modes are for verification and are not live-model evidence.

## Behavior and data

- Start immediately shows the first inhale cue. Six cycles of 4 seconds in and 6 seconds out are planned for 60 seconds. Stop, navigation away from the exercise, or opening crisis resources ends the current session. Hiding the browser tab records an interruption. Starting again creates a new session.
- The elapsed timer uses `performance.now()`, deriving each cue from elapsed time rather than accumulating timer ticks. Setup is measured from the ready interface to the first rendered instruction. History reports setup and actual exercise time separately. Completion can be slightly over 60 seconds because of the browser frame schedule. Reduced motion disables expansion while retaining the text and countdown.
- `data/app.sqlite3` contains `sessions` with start/end, outcome, setup, actual and intended duration, and `conversations` with question, reply, status, source, model and generic failure information. The app saves pending and failed questions too. It sends only the fictional question and fixed exercise context to Gemini. Keys stay on the server.
- Requests have UUIDs. Terminal exercise outcomes cannot be replaced by a late start or repeated finish. A small localStorage outbox retries unsaved session records. A saved start with no finish is shown as **Started · finish unconfirmed**. Abrupt process/device loss can prevent a final event from reaching storage. A pending model request interrupted by server shutdown remains visibly unfinished.
- History reads SQLite, so it survives browser and server restarts. On the question screen, **Reopen my last answer** retrieves the latest successful, nonempty reply from history. It shows the original question, saved date and source without a new question or model call. New question drafts are retained. Failed, pending and local crisis replies do not become the shortcut. A history failure hides the shortcut and offers Retry history; asking a new question and Crisis resources remain available. Reopening a previously loaded reply does not require another request.
- This is lightweight personalization from existing use (D5), offered as a choice (R4), with no profile or configuration form (D3). It does not infer distress, change the breathing sequence or establish that a saved model answer is correct. History belongs to this single local database, not an authenticated person.

## Safety decisions

Crisis resources is a persistent header control. Its dialog is included in the static page, so opening it needs no API call, model response, classifier, or network connection once the page has loaded. External calling, texting and chat still need their respective services. The listed resource is for the United States and territories, with general direction to local services elsewhere. Resource information was checked with the hotline lookup tool on November 2, 2026.

A small local keyword rule catches examples such as “suicidal,” “kill myself,” “hurt myself,” “self-harm,” and “not safe.” Matches receive a fixed local response pointing to Crisis resources, bypassing Gemini. This rule can miss paraphrases and languages and can match negations, quoted text or hypothetical descriptions. It is not a clinical assessment. The control remains available for every input, including unmatched input and failed requests. The Gemini system instruction restricts replies to explaining the fixed skill, asks it to direct crisis-related input to the control, and prohibits diagnosis, treatment advice and altered steps. Model compliance remains uncertain, so exercise control and access to resources are implemented independently.

## Verification

The Python checks use temporary SQLite databases and mocked HTTP responses. They make no live model calls. Node is needed only for the two pure timing checks.

```powershell
./.venv/Scripts/python.exe -m unittest discover -s tests -v
node --test tests/exercise.test.mjs tests/saved-answer.test.mjs
```

The [Part 3 report](reports/part3/report.md) links fifteen scenarios, three behavior checks, clean-checkout evidence, four separate live observations, and a captioned demonstration/process recording. The [Part 2 report](reports/part2/report.md) retains the earlier evidence. The original [Part 1 design](reports/part1/report.md) and diagram are preserved. The implementation uses a fixed 60 seconds and defers the questionnaire, anxiety scoring, profile collection and configurable duration.

The live observation script is opt-in and makes exactly four calls using the configured key. It writes only fictional prompts, replies and generic outcomes to `reports/part3/evidence/live-model.json`, with a separate ignored database under `work/`. It is never run by unittest discovery:

```powershell
./.venv/Scripts/python.exe tests/observe_live.py --run-four-calls
```

Peer testing uses mocks by default. If live calls are needed, the host caps the session at 50 calls and returns to mocks at that limit. The submitted observation used four calls.

The API is documented at [localhost /docs](http://127.0.0.1:8000/docs). It provides `GET /api/status`, `POST /api/sessions/{uuid}`, `POST /api/questions` and `GET /api/history`. This is a single-user local prototype with no accounts or access control. Use fictional data on a trusted computer.

## Dependencies and sources

Vue is the official Vue 3.5.22 ESM production distribution from the npm `vue` package, with its [MIT license](frontend/vendor/LICENSE-vue.txt). The application code is newly created for this repository. It reuses the breathing concept and model placement from Part 1.

- [Vue production builds without build tools](https://vuejs.org/guide/best-practices/production-deployment)
- [Gemini generateContent API](https://ai.google.dev/api/generate-content)
- [Assignment overview](https://psu.instructure.com/courses/2484533/pages/assignment-3-overview-mental-health-skills-application)
- [AI use disclosure](AI-USE.md)
