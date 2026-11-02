# Assignment 3 Part 2 Report

## Submitted application version

Repository: [mental-health-app](https://github.com/dw477/mental-health-app)

Commit: `e2872fbea0620add4d1ffc38cb850756fca96474`

## Working application and design

The app runs on localhost using Vue, FastAPI and SQLite. Start shows the first inhale cue immediately. Six cycles of a 4-second inhale and a 6-second exhale are planned for 60 seconds. A changing text cue, countdown and gentle expansion carry the pace. Reduced-motion preferences retain the text and countdown. Stop, leaving the exercise view, or opening crisis resources ends a session. Hiding the page interrupts it. Starting again creates a separate record.

The 60-second default supports R1. The visible Stop control and neutral completion/exit messages support R3 and user control. A persistent Crisis resources control supports R2 and D4. Optional model questions are in a separate view to reduce demands during breathing, following D2 and D3. The visual palette and language are restrained in response to D6. The fixed default changes the Part 1 proposal's 45-second duration. The questionnaire, anxiety scoring, profile collection and personalized recommendations are deferred.

The original design and diagram remain available. The README explains setup, data, safety choices and the changes from Part 1. [Part 1 report](https://github.com/dw477/mental-health-app/blob/main/reports/part1/report.md), [flow diagram](https://github.com/dw477/mental-health-app/blob/main/reports/part1/Flow-Diagram.png), [README](https://github.com/dw477/mental-health-app/blob/main/README.md)

## Model contribution and safety

The optional question form sends a fictional question and fixed exercise context to Gemini. The verified model is `gemini-3.1-flash-lite`. Its reply correctly explained the intended 60-second duration and permission to stop early. The application controls timing and exercise steps. SQLite saves the question, reply, source, model, outcome and any generic error. [Live Gemini browser evidence](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/live-gemini.png)

Crisis information is embedded in the static interface. It opens without a model, classifier or server request after the page has loaded. The fixed local keyword rule bypasses Gemini for matched crisis-related input and directs the user to that control. The rule can miss paraphrases or languages and can match hypothetical or negated statements. Model instructions provide another boundary but cannot guarantee compliance. The prototype clearly states its coursework role and provides no diagnosis, therapy or monitoring. All evaluation used fictional scenarios. [Local safety response](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/local-safety.png), [resources with server stopped](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/crisis-server-offline.png)

## Verification evidence

Browser observations were made in Chrome on November 2, 2026. The exercise requires no typed response. Timing starts with the first rendered inhale instruction and ends when the final planned exhale finishes. It includes browser scheduling delays. Setup measures time at the ready interface before starting, including user deliberation. It excludes the exercise itself. Opening crisis resources ends the current session, so time in the dialog adds no exercise time.

Video demonstrations: [Complete-session demonstration](https://github.com/dw477/mental-health-app/blob/main/reports/part2/video_demo_complete_session.mp4), [test-evidence demonstration](https://github.com/dw477/mental-health-app/blob/main/reports/part2/video_demo_test_evidence.mp4).

| Fictional scenario or check | Expected and observed result |
|---|---|
| Finish six cycles | Expected about 60 seconds and a completed record. The first run measured 60.039 seconds, with 2.393 seconds of setup. [Completion](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/completed.png) |
| Press Stop early | Expected an immediate exit and a stopped record. Observed 3.255 seconds and status `stopped`. [Early stop](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/stopped.png) |
| Complete with the server stopped | Expected local timing to continue, a pending save and accessible resources. Observed 60.498 seconds, with 6.053 seconds of setup. Retry saving after restart persisted the completed record once. [Offline completion](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/offline-completed.png) |
| Leave through the question navigation | Expected the exercise to stop. Observed a separate `stopped` record at 6.245 seconds. [SQLite inspection](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/database.json) |
| A live model request fails | Expected a recoverable error, a saved failed question and persistent crisis access. All three were observed. [Failure](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/model-failure.png), [resources after failure](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/crisis-after-failure.png) |
| Restart server and reload browser | Expected saved records to remain visible. History and direct SQLite inspection both showed four sessions and five questions. [History screenshot](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/history-after-restart.png), [full browser observation](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/history-after-restart.txt) |

Direct SQLite inspection found two completed and two stopped sessions. The five conversation records contain one successful live Gemini answer, one fixed local safety response and three failed live requests. The committed JSON is a fictional-data snapshot produced by querying SQLite directly. The runtime database and credentials are excluded from Git. [Database evidence and queries](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/database.json)

Eight Python checks passed, covering persistence across restart, reordered/retried session writes, validation, conversation deduplication, model failures, local crisis handling, the Gemini request shape and timeout/empty-response behavior. Two Node checks passed for all inhale/exhale boundaries and delayed-frame completion. Python checks use temporary databases and mocked HTTP responses with no external model calls. The Python log includes a dependency deprecation advisory. Dependency consistency and JavaScript syntax checks also passed. [Python results](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/python-tests.txt), [timing results](https://github.com/dw477/mental-health-app/blob/main/reports/part2/evidence/timing-tests.txt)

## Revised approaches and limits

Live integration first failed because punctuation was included with the pasted credential. After correcting that local configuration, the API reported that the initial model was unavailable to new users. Its suggested replacement then timed out. A supported `gemini-3.1-flash-lite` request succeeded, so it became the configurable default. Failures remain visible in history. No credentials appear in submitted evidence.

An early setup measurement included time spent in a preceding exercise. The clock now resets when an exercise ends or the user returns to Breathe. The earlier 98.512-second setup record remains in the evidence for transparency. Actual exercise timing was measured independently throughout.

Only one ordinary live-model scenario was verified successfully. Broader response variation, multilingual crisis input, assistive-technology behavior and mobile browser behavior remain unevaluated. Abrupt device or process loss can prevent a final event from reaching storage. Saved starts without a finish are labeled accordingly. The 15-scenario evaluation, personalization and final screencast belong to Part 3. These checks establish software behavior and do not establish clinical effectiveness.

Codex assisted with implementation and verification. The disclosure records tools, model identifiers, and revised approaches. [AI use disclosure](https://github.com/dw477/mental-health-app/blob/main/AI-USE.md)
